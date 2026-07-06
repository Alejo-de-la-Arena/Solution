/**
 * /api/admin/finance — módulo Calculadora.
 *
 * Endpoints:
 *   GET    /costs                   → lista productos con cost_price actual
 *   PUT    /costs/:productId        → actualiza cost_price de un producto
 *   GET    /expenses                → lista de gastos fijos (vigentes + histórico)
 *   POST   /expenses                → crea un gasto fijo
 *   PUT    /expenses/:id            → cierra el gasto previo y crea uno nuevo
 *   DELETE /expenses/:id            → cierra (effective_until = hoy)
 *   GET    /report?from&to          → reporte desglosado del período
 *
 * Todos los endpoints requieren admin (Bearer token con perfil admin).
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { assertAdmin } = require('../lib/adminAuth');

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isValidDateStr(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

// ── Costos por producto ─────────────────────────────────────────────────────

router.get('/costs', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const { data, error } = await supabase
    .from('products')
    .select('id, slug, name, cost_price, price_retail, price_wholesale')
    .order('name');
  if (error) {
    console.error('[finance] /costs error:', error);
    return res.status(500).json({ error: 'Error leyendo productos' });
  }
  return res.json({ items: data || [] });
});

router.put('/costs/:productId', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const productId = String(req.params.productId || '').trim();
  if (!productId) return res.status(400).json({ error: 'productId requerido' });

  const raw = req.body?.cost_price;
  if (raw === null || raw === undefined || raw === '') {
    const { error } = await supabase
      .from('products')
      .update({ cost_price: null })
      .eq('id', productId);
    if (error) return res.status(500).json({ error: 'Error actualizando costo' });
    return res.json({ ok: true, cost_price: null });
  }

  const cost = Number(raw);
  if (!Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({ error: 'cost_price inválido' });
  }
  const { error } = await supabase
    .from('products')
    .update({ cost_price: cost })
    .eq('id', productId);
  if (error) {
    console.error('[finance] PUT /costs error:', error);
    return res.status(500).json({ error: 'Error actualizando costo' });
  }
  return res.json({ ok: true, cost_price: cost });
});

// ── Gastos fijos ────────────────────────────────────────────────────────────

// Estados que representan una venta efectiva (ingreso real). 'shipped' es una
// orden pagada que además ya se despachó: sigue siendo ingreso, no debe caerse
// del reporte al marcarla como enviada.
const REVENUE_STATUSES = ['paid', 'shipped'];

const VALID_FREQS = new Set(['monthly', 'weekly', 'daily', 'annual', 'one-time']);

function validateExpenseBody(body) {
  const name = String(body?.name || '').trim();
  if (!name) return { error: 'name requerido' };
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount < 0) return { error: 'amount inválido' };
  const frequency = String(body?.frequency || '').trim();
  if (!VALID_FREQS.has(frequency)) return { error: 'frequency inválido' };
  const effective_from = String(body?.effective_from || '').trim();
  if (!isValidDateStr(effective_from)) return { error: 'effective_from debe ser YYYY-MM-DD' };
  const category = String(body?.category || '').trim() || null;
  const notes = String(body?.notes || '').trim() || null;
  return { value: { name, amount, frequency, effective_from, category, notes } };
}

router.get('/expenses', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const includeHistory = String(req.query.history || '').toLowerCase() === 'true';
  let query = supabase
    .from('fixed_expenses')
    .select('id, name, category, amount, frequency, effective_from, effective_until, notes, created_at, created_by')
    .order('effective_from', { ascending: false });
  if (!includeHistory) query = query.is('effective_until', null);

  const { data, error } = await query;
  if (error) {
    console.error('[finance] /expenses error:', error);
    return res.status(500).json({ error: 'Error leyendo gastos' });
  }
  return res.json({ items: data || [] });
});

router.post('/expenses', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const { value, error: vErr } = validateExpenseBody(req.body);
  if (vErr) return res.status(400).json({ error: vErr });

  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert({ ...value, created_by: user.id })
    .select('*')
    .single();
  if (error) {
    console.error('[finance] POST /expenses error:', error);
    return res.status(500).json({ error: 'Error creando gasto' });
  }
  return res.status(201).json(data);
});

router.put('/expenses/:id', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'id requerido' });

  const { value, error: vErr } = validateExpenseBody(req.body);
  if (vErr) return res.status(400).json({ error: vErr });

  // 1) Cerrar la fila previa con effective_until = effective_from de la nueva (- 1 día) si está vigente.
  const today = todayIsoDate();
  const closeDate = value.effective_from > today ? today : value.effective_from;
  const { error: closeErr } = await supabase
    .from('fixed_expenses')
    .update({ effective_until: closeDate })
    .eq('id', id)
    .is('effective_until', null);
  if (closeErr) {
    console.error('[finance] PUT /expenses close error:', closeErr);
    return res.status(500).json({ error: 'Error cerrando gasto previo' });
  }

  // 2) Insertar la nueva fila.
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert({ ...value, created_by: user.id })
    .select('*')
    .single();
  if (error) {
    console.error('[finance] PUT /expenses insert error:', error);
    return res.status(500).json({ error: 'Error creando gasto actualizado' });
  }
  return res.json(data);
});

router.delete('/expenses/:id', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const id = String(req.params.id || '').trim();
  if (!id) return res.status(400).json({ error: 'id requerido' });

  const { error } = await supabase
    .from('fixed_expenses')
    .update({ effective_until: todayIsoDate() })
    .eq('id', id)
    .is('effective_until', null);
  if (error) {
    console.error('[finance] DELETE /expenses error:', error);
    return res.status(500).json({ error: 'Error cerrando gasto' });
  }
  return res.json({ ok: true });
});

// ── Reporte mensual / por rango ─────────────────────────────────────────────

/**
 * Días entre dos fechas YYYY-MM-DD inclusive (zona UTC, los dates de Postgres
 * no llevan timezone; tratarlos como UTC mantiene cálculos consistentes).
 */
function daysBetweenInclusive(fromStr, toStr) {
  const from = new Date(`${fromStr}T00:00:00Z`).getTime();
  const to = new Date(`${toStr}T00:00:00Z`).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return 0;
  return Math.floor((to - from) / 86400000) + 1;
}

/**
 * Fracción de "meses calendario" cubierta por [fromStr, toStr] inclusive.
 * Cada mes aporta (días cubiertos en ese mes / días reales del mes). Un mes
 * calendario completo aporta exactamente 1.0 sin importar si tiene 28/30/31
 * días — así un gasto mensual se cobra 1× en un cierre mensual, no 31/30.
 */
function monthFractionInRange(fromStr, toStr) {
  const fromT = new Date(`${fromStr}T00:00:00Z`).getTime();
  const toT = new Date(`${toStr}T00:00:00Z`).getTime();
  if (!Number.isFinite(fromT) || !Number.isFinite(toT) || toT < fromT) return 0;
  let total = 0;
  let cursor = new Date(Date.UTC(Number(fromStr.slice(0, 4)), Number(fromStr.slice(5, 7)) - 1, 1));
  while (cursor.getTime() <= toT) {
    const yy = cursor.getUTCFullYear();
    const mm = cursor.getUTCMonth();
    const monthStart = Date.UTC(yy, mm, 1);
    const monthEnd = Date.UTC(yy, mm + 1, 0); // último día del mes (00:00Z)
    const daysInMonth = new Date(monthEnd).getUTCDate();
    const ovStart = Math.max(fromT, monthStart);
    const ovEnd = Math.min(toT, monthEnd);
    if (ovEnd >= ovStart) {
      const daysCovered = Math.floor((ovEnd - ovStart) / 86400000) + 1;
      total += daysCovered / daysInMonth;
    }
    cursor = new Date(Date.UTC(yy, mm + 1, 1));
  }
  return total;
}

/**
 * Fracción de "años calendario" cubierta por [fromStr, toStr] inclusive.
 * Cada año aporta (días cubiertos / días del año), respetando bisiestos.
 */
function yearFractionInRange(fromStr, toStr) {
  const fromT = new Date(`${fromStr}T00:00:00Z`).getTime();
  const toT = new Date(`${toStr}T00:00:00Z`).getTime();
  if (!Number.isFinite(fromT) || !Number.isFinite(toT) || toT < fromT) return 0;
  let total = 0;
  for (let y = Number(fromStr.slice(0, 4)); y <= Number(toStr.slice(0, 4)); y++) {
    const yearStart = Date.UTC(y, 0, 1);
    const yearEnd = Date.UTC(y, 11, 31);
    const daysInYear = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365;
    const ovStart = Math.max(fromT, yearStart);
    const ovEnd = Math.min(toT, yearEnd);
    if (ovEnd >= ovStart) {
      const daysCovered = Math.floor((ovEnd - ovStart) / 86400000) + 1;
      total += daysCovered / daysInYear;
    }
  }
  return total;
}

/**
 * Normaliza un gasto fijo al monto efectivo dentro de [from, to], considerando
 * frequency y la vigencia (effective_from / effective_until) de la fila.
 */
function expenseAmountInRange(expense, from, to) {
  const eFrom = expense.effective_from;
  const eUntil = expense.effective_until || '9999-12-31';
  // Recortar la vigencia al rango pedido
  const overlapFrom = eFrom > from ? eFrom : from;
  const overlapTo = eUntil < to ? eUntil : to;
  if (overlapFrom > overlapTo) return 0;
  const days = daysBetweenInclusive(overlapFrom, overlapTo);
  if (days <= 0) return 0;
  const amount = toNumber(expense.amount);

  switch (expense.frequency) {
    case 'daily':
      return amount * days;
    case 'weekly':
      return amount * (days / 7); // una semana son siempre 7 días → exacto
    case 'monthly':
      return amount * monthFractionInRange(overlapFrom, overlapTo);
    case 'annual':
      return amount * yearFractionInRange(overlapFrom, overlapTo);
    case 'one-time':
      return eFrom >= from && eFrom <= to ? amount : 0;
    default:
      return 0;
  }
}

router.get('/report', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  if (!isValidDateStr(from) || !isValidDateStr(to) || from > to) {
    return res.status(400).json({ error: 'from y to deben ser YYYY-MM-DD válidos y from ≤ to' });
  }

  // Rango temporal: paid_at entre [from 00:00, to+1 00:00). Como mp_paid_at y
  // nave_paid_at son timestamptz, comparamos con strings ISO.
  const fromIso = `${from}T00:00:00.000Z`;
  const toEndIso = (() => {
    const d = new Date(`${to}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString();
  })();

  // Filtramos por mp_paid_at OR nave_paid_at; Supabase no permite OR sobre 2
  // columnas con rango fácilmente, así que hacemos 2 queries y unimos.
  const baseSelect = 'id, total, shipping_cost, channel, payment_method, mp_paid_at, nave_paid_at, status';

  const [{ data: mpOrders, error: mpErr }, { data: naveOrders, error: naveErr }] = await Promise.all([
    supabase
      .from('orders')
      .select(baseSelect)
      .in('status', REVENUE_STATUSES)
      .not('is_admin_test', 'is', true)
      .gte('mp_paid_at', fromIso)
      .lt('mp_paid_at', toEndIso),
    supabase
      .from('orders')
      .select(baseSelect)
      .in('status', REVENUE_STATUSES)
      .not('is_admin_test', 'is', true)
      .gte('nave_paid_at', fromIso)
      .lt('nave_paid_at', toEndIso),
  ]);

  if (mpErr || naveErr) {
    console.error('[finance] /report orders error:', mpErr || naveErr);
    return res.status(500).json({ error: 'Error leyendo órdenes del período' });
  }

  // Unión deduplicada (una orden puede tener ambos timestamps en casos raros).
  const byId = new Map();
  for (const o of mpOrders || []) byId.set(o.id, o);
  for (const o of naveOrders || []) if (!byId.has(o.id)) byId.set(o.id, o);
  const orders = [...byId.values()];
  const orderIds = orders.map((o) => o.id);

  // Items y financials de esas órdenes.
  let items = [];
  let financials = [];
  if (orderIds.length > 0) {
    const [{ data: itemsRows, error: itemsErr }, { data: finRows, error: finErr }] = await Promise.all([
      supabase
        .from('order_items')
        .select('order_id, product_id, quantity, unit_price, cogs_unit')
        .in('order_id', orderIds),
      supabase
        .from('order_financials')
        .select('order_id, gross_amount, payment_fee, payment_taxes, net_received, provider')
        .in('order_id', orderIds),
    ]);
    if (itemsErr || finErr) {
      console.error('[finance] /report items/financials error:', itemsErr || finErr);
      return res.status(500).json({ error: 'Error leyendo items o financials' });
    }
    items = itemsRows || [];
    financials = finRows || [];
  }

  // Productos (para breakdown por SKU).
  const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
  let products = [];
  if (productIds.length > 0) {
    const { data: prodRows } = await supabase
      .from('products')
      .select('id, name, slug')
      .in('id', productIds);
    products = prodRows || [];
  }
  const productById = Object.fromEntries(products.map((p) => [p.id, p]));

  // Gastos fijos: traer todos los que tienen vigencia que overlap [from, to].
  // PostgREST OR: effective_until >= from OR effective_until IS NULL, AND effective_from <= to.
  const { data: expRows, error: expErr } = await supabase
    .from('fixed_expenses')
    .select('id, name, category, amount, frequency, effective_from, effective_until')
    .lte('effective_from', to)
    .or(`effective_until.gte.${from},effective_until.is.null`);
  if (expErr) {
    console.error('[finance] /report expenses error:', expErr);
    return res.status(500).json({ error: 'Error leyendo gastos' });
  }
  const expenses = expRows || [];

  // ── Cálculos agregados ──
  const ingresos_brutos = orders.reduce((s, o) => s + toNumber(o.total), 0);
  const costo_envio = orders.reduce((s, o) => s + toNumber(o.shipping_cost), 0);

  const comisiones_pasarela = financials.reduce((s, f) => s + toNumber(f.payment_fee), 0);
  const impuestos_retenidos = financials.reduce((s, f) => s + toNumber(f.payment_taxes), 0);
  const neto_recibido = financials.reduce((s, f) => s + toNumber(f.net_received), 0);

  // Si una orden paid no tiene su financial registrado todavía, asumimos
  // neto = total (sin restar fee/tax). Se reporta para que el cliente sepa.
  const ordersWithFin = new Set(financials.map((f) => f.order_id));
  const ordersWithoutFin = orders.filter((o) => !ordersWithFin.has(o.id));
  const neto_recibido_estimado = neto_recibido + ordersWithoutFin.reduce((s, o) => s + toNumber(o.total), 0);

  let cogs = 0;
  let cogs_unidades_sin_costo = 0;
  for (const it of items) {
    if (it.cogs_unit == null) {
      cogs_unidades_sin_costo += toNumber(it.quantity);
      continue;
    }
    cogs += toNumber(it.cogs_unit) * toNumber(it.quantity);
  }

  const ganancia_operativa = neto_recibido_estimado - costo_envio - cogs;

  const gastos_fijos = expenses.reduce((s, e) => s + expenseAmountInRange(e, from, to), 0);
  const gastos_fijos_detalle = expenses.map((e) => ({
    id: e.id,
    name: e.name,
    category: e.category,
    frequency: e.frequency,
    amount_in_range: Number(expenseAmountInRange(e, from, to).toFixed(2)),
  })).filter((e) => e.amount_in_range > 0);

  // ── Devoluciones y contracargos ──
  // Órdenes en estado refunded/chargeback. No existe una columna refunded_at,
  // así que las atribuimos al período del PAGO original (mp_paid_at/nave_paid_at)
  // — principio de matching: la pérdida se imputa al mes en que se registró la
  // venta que luego se revirtió. Estas órdenes ya NO están en paid/shipped, así
  // que no aportan ingreso; su pérdida real se suma acá.
  //   pérdida ≈ comisión de pasarela + costo de envío + COGS
  // Asunción conservadora: la comisión no se reintegra y el envío/producto no
  // se recuperan (una devolución con producto revendible tendría pérdida menor).
  const [{ data: mpRef, error: mpRefErr }, { data: naveRef, error: naveRefErr }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, shipping_cost, status')
      .in('status', ['refunded', 'chargeback'])
      .not('is_admin_test', 'is', true)
      .gte('mp_paid_at', fromIso)
      .lt('mp_paid_at', toEndIso),
    supabase
      .from('orders')
      .select('id, total, shipping_cost, status')
      .in('status', ['refunded', 'chargeback'])
      .not('is_admin_test', 'is', true)
      .gte('nave_paid_at', fromIso)
      .lt('nave_paid_at', toEndIso),
  ]);
  if (mpRefErr || naveRefErr) {
    console.error('[finance] /report refunds error:', mpRefErr || naveRefErr);
    return res.status(500).json({ error: 'Error leyendo devoluciones' });
  }
  const refundById = new Map();
  for (const o of mpRef || []) refundById.set(o.id, o);
  for (const o of naveRef || []) if (!refundById.has(o.id)) refundById.set(o.id, o);
  const refunds = [...refundById.values()];
  const refundIds = refunds.map((r) => r.id);

  let refundItems = [];
  let refundFin = [];
  if (refundIds.length > 0) {
    const [{ data: ri }, { data: rf }] = await Promise.all([
      supabase.from('order_items').select('order_id, quantity, cogs_unit').in('order_id', refundIds),
      supabase.from('order_financials').select('order_id, payment_fee').in('order_id', refundIds),
    ]);
    refundItems = ri || [];
    refundFin = rf || [];
  }
  const refundCogsByOrder = {};
  for (const it of refundItems) {
    if (it.cogs_unit == null) continue;
    refundCogsByOrder[it.order_id] = (refundCogsByOrder[it.order_id] || 0) + toNumber(it.cogs_unit) * toNumber(it.quantity);
  }
  const refundFeeByOrder = Object.fromEntries(refundFin.map((f) => [f.order_id, toNumber(f.payment_fee)]));

  const devoluciones_detalle = refunds.map((r) => {
    const fee = refundFeeByOrder[r.id] || 0;
    const envio = toNumber(r.shipping_cost);
    const cogsR = refundCogsByOrder[r.id] || 0;
    const perdida = fee + envio + cogsR;
    return {
      id: r.id,
      status: r.status,
      comision: Number(fee.toFixed(2)),
      envio: Number(envio.toFixed(2)),
      cogs: Number(cogsR.toFixed(2)),
      perdida: Number(perdida.toFixed(2)),
    };
  });
  const perdidas_devoluciones = devoluciones_detalle.reduce((s, d) => s + d.perdida, 0);

  const ganancia_neta = ganancia_operativa - gastos_fijos - perdidas_devoluciones;
  const margen_pct = ingresos_brutos > 0 ? (ganancia_neta / ingresos_brutos) * 100 : 0;

  // ── Breakdowns ──
  const unidades_por_sku = (() => {
    const acc = new Map();
    for (const it of items) {
      const p = productById[it.product_id];
      const key = p?.slug || it.product_id || 'desconocido';
      const cur = acc.get(key) || { sku: key, name: p?.name || null, units: 0, revenue: 0, cogs: 0 };
      cur.units += toNumber(it.quantity);
      cur.revenue += toNumber(it.unit_price) * toNumber(it.quantity);
      if (it.cogs_unit != null) cur.cogs += toNumber(it.cogs_unit) * toNumber(it.quantity);
      acc.set(key, cur);
    }
    return [...acc.values()].sort((a, b) => b.units - a.units);
  })();

  const por_canal = (() => {
    const acc = new Map();
    for (const o of orders) {
      const k = o.channel || 'desconocido';
      const cur = acc.get(k) || { channel: k, orders: 0, revenue: 0 };
      cur.orders += 1;
      cur.revenue += toNumber(o.total);
      acc.set(k, cur);
    }
    return [...acc.values()];
  })();

  const por_metodo_pago = (() => {
    const acc = new Map();
    for (const o of orders) {
      const k = o.payment_method || 'desconocido';
      const cur = acc.get(k) || { payment_method: k, orders: 0, revenue: 0 };
      cur.orders += 1;
      cur.revenue += toNumber(o.total);
      acc.set(k, cur);
    }
    return [...acc.values()];
  })();

  return res.json({
    period: { from, to, dias: daysBetweenInclusive(from, to) },
    resumen: {
      ingresos_brutos: Number(ingresos_brutos.toFixed(2)),
      comisiones_pasarela: Number(comisiones_pasarela.toFixed(2)),
      impuestos_retenidos: Number(impuestos_retenidos.toFixed(2)),
      neto_recibido: Number(neto_recibido_estimado.toFixed(2)),
      costo_envio: Number(costo_envio.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      ganancia_operativa: Number(ganancia_operativa.toFixed(2)),
      gastos_fijos: Number(gastos_fijos.toFixed(2)),
      perdidas_devoluciones: Number(perdidas_devoluciones.toFixed(2)),
      ganancia_neta: Number(ganancia_neta.toFixed(2)),
      margen_pct: Number(margen_pct.toFixed(2)),
    },
    avisos: {
      ordenes_sin_desglose_financiero: ordersWithoutFin.length,
      unidades_vendidas_sin_costo: cogs_unidades_sin_costo,
      devoluciones_en_periodo: devoluciones_detalle.length,
    },
    detalle: {
      ordenes: orders.length,
      gastos_fijos: gastos_fijos_detalle,
      devoluciones: devoluciones_detalle,
      unidades_por_sku,
      por_canal,
      por_metodo_pago,
    },
  });
});

module.exports = router;
