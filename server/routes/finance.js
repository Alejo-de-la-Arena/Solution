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

/**
 * Costo real del envío de una orden: lo que le pagamos a Correo, NO lo que le
 * cobramos al comprador.
 *
 * `shipping_cost` es el cargo al cliente — con envío gratis es 0 aunque el flete
 * se pague igual. `shipping_original_price` guarda la tarifa real de Correo
 * (poblada en el checkout y por scripts/backfill-shipping-cost.js).
 *
 * Fallback a `shipping_cost` cuando la columna es NULL: son órdenes viejas sin
 * cotización guardada (las primeras de abril), todas con envío en 0. Es el mismo
 * número que se venía usando, así que el fallback no empeora nada.
 */
function realShippingCost(order) {
  return order?.shipping_original_price != null
    ? toNumber(order.shipping_original_price)
    : toNumber(order?.shipping_cost);
}

function isValidDateStr(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidMonthStr(s) {
  return typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

/** 'YYYY-MM' → 'YYYY-MM-01' (día 1 del mes, como lo guarda monthly_revenue_charges). */
function monthToFirstDay(month) {
  return `${month}-01`;
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

  const purge = ['true', '1'].includes(String(req.query.purge || '').toLowerCase());

  if (purge) {
    // Borrado REAL: saca el gasto de TODOS los períodos, histórico incluido.
    // Para gastos de prueba o cargados por error. Funciona esté vigente o ya
    // cerrado (no filtra por effective_until).
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (error) {
      console.error('[finance] DELETE(purge) /expenses error:', error);
      return res.status(500).json({ error: 'Error eliminando gasto' });
    }
    return res.json({ ok: true, purged: true });
  }

  // Cierre suave: deja de aplicar desde hoy, pero SIGUE impactando los reportes
  // de los meses donde ya estuvo vigente (es un gasto real que terminó). Sólo
  // aplica sobre una fila vigente.
  const { error } = await supabase
    .from('fixed_expenses')
    .update({ effective_until: todayIsoDate() })
    .eq('id', id)
    .is('effective_until', null);
  if (error) {
    console.error('[finance] DELETE /expenses error:', error);
    return res.status(500).json({ error: 'Error cerrando gasto' });
  }
  return res.json({ ok: true, purged: false });
});

// ── Pauta publicitaria (gasto diario variable) ──────────────────────────────
// daily_expenses: un valor real por fecha. Distinto de un gasto fijo 'daily'
// (que repite el mismo monto). La ausencia de fila = día no cargado; una fila
// con amount=0 = confirmado sin gasto.

// Una tabla nueva puede no existir todavía (migración pendiente). El error llega
// distinto según la capa: 42P01 desde Postgres directo, PGRST205 desde PostgREST
// (no está en el schema cache). Tratamos ambos como "tabla pendiente".
function isMissingTableError(error) {
  const code = String(error?.code || '');
  return code === '42P01' || code === 'PGRST205';
}

router.get('/daily-expenses', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  if (!isValidDateStr(from) || !isValidDateStr(to) || from > to) {
    return res.status(400).json({ error: 'from y to deben ser YYYY-MM-DD válidos y from ≤ to' });
  }

  const { data, error } = await supabase
    .from('daily_expenses')
    .select('id, expense_date, category, amount, notes, updated_at')
    .gte('expense_date', from)
    .lte('expense_date', to)
    .order('expense_date', { ascending: false });
  if (error) {
    if (isMissingTableError(error)) return res.json({ items: [], table_missing: true });
    console.error('[finance] GET /daily-expenses error:', error);
    return res.status(500).json({ error: 'Error leyendo pauta' });
  }
  return res.json({ items: data || [] });
});

router.put('/daily-expenses/:date', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const date = String(req.params.date || '').trim();
  if (!isValidDateStr(date)) return res.status(400).json({ error: 'date debe ser YYYY-MM-DD' });

  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ error: 'amount inválido (debe ser >= 0)' });
  }
  const category = String(req.body?.category || 'pauta').trim() || 'pauta';
  const notes = String(req.body?.notes || '').trim() || null;

  // Upsert por (expense_date, category): recargar el día pisa el valor anterior.
  const { data, error } = await supabase
    .from('daily_expenses')
    .upsert(
      { expense_date: date, category, amount, notes, updated_at: new Date().toISOString(), created_by: user.id },
      { onConflict: 'expense_date,category' }
    )
    .select('id, expense_date, category, amount, notes, updated_at')
    .single();
  if (error) {
    if (isMissingTableError(error)) {
      return res.status(503).json({ error: 'Falta aplicar la migración daily_expenses en la base' });
    }
    console.error('[finance] PUT /daily-expenses error:', error);
    return res.status(500).json({ error: 'Error guardando pauta' });
  }
  return res.json(data);
});

router.delete('/daily-expenses/:date', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const date = String(req.params.date || '').trim();
  if (!isValidDateStr(date)) return res.status(400).json({ error: 'date debe ser YYYY-MM-DD' });
  const category = String(req.query.category || 'pauta').trim() || 'pauta';

  // Borrar (no poner 0): vuelve el día al estado "no cargado" y reactiva el aviso.
  const { error } = await supabase
    .from('daily_expenses')
    .delete()
    .eq('expense_date', date)
    .eq('category', category);
  if (error) {
    console.error('[finance] DELETE /daily-expenses error:', error);
    return res.status(500).json({ error: 'Error borrando pauta' });
  }
  return res.json({ ok: true });
});

// ── Cargo mensual sobre facturación (switch on/off + %) ──────────────────────
// monthly_revenue_charges: por mes, un % sobre lo facturado que aplica sólo si
// está ON. Ausencia de fila = OFF (default 7% en la UI al prender).

const DEFAULT_REVENUE_CHARGE_PCT = 7;

router.get('/monthly-charges/:month', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const month = String(req.params.month || '').trim();
  if (!isValidMonthStr(month)) return res.status(400).json({ error: 'month debe ser YYYY-MM' });

  const { data, error } = await supabase
    .from('monthly_revenue_charges')
    .select('month, enabled, percentage')
    .eq('month', monthToFirstDay(month))
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error)) {
      return res.json({ month, enabled: false, percentage: DEFAULT_REVENUE_CHARGE_PCT, exists: false, table_missing: true });
    }
    console.error('[finance] GET /monthly-charges error:', error);
    return res.status(500).json({ error: 'Error leyendo cargo mensual' });
  }
  // Sin fila → OFF con el % por defecto (lo que verá el switch al abrir el mes).
  if (!data) return res.json({ month, enabled: false, percentage: DEFAULT_REVENUE_CHARGE_PCT, exists: false });
  return res.json({ month, enabled: data.enabled, percentage: toNumber(data.percentage), exists: true });
});

router.put('/monthly-charges/:month', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const month = String(req.params.month || '').trim();
  if (!isValidMonthStr(month)) return res.status(400).json({ error: 'month debe ser YYYY-MM' });

  const enabled = req.body?.enabled === true || req.body?.enabled === 'true';
  const pctRaw = req.body?.percentage;
  const percentage = pctRaw === undefined || pctRaw === null || pctRaw === ''
    ? DEFAULT_REVENUE_CHARGE_PCT
    : Number(pctRaw);
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    return res.status(400).json({ error: 'percentage inválido (0 a 100)' });
  }

  const { data, error } = await supabase
    .from('monthly_revenue_charges')
    .upsert(
      { month: monthToFirstDay(month), enabled, percentage, updated_at: new Date().toISOString(), created_by: user.id },
      { onConflict: 'month' }
    )
    .select('month, enabled, percentage')
    .single();
  if (error) {
    if (isMissingTableError(error)) {
      return res.status(503).json({ error: 'Falta aplicar la migración monthly_revenue_charges en la base' });
    }
    console.error('[finance] PUT /monthly-charges error:', error);
    return res.status(500).json({ error: 'Error guardando cargo mensual' });
  }
  return res.json({ month, enabled: data.enabled, percentage: toNumber(data.percentage), exists: true });
});

// ── Reporte mensual / por rango ─────────────────────────────────────────────

// Argentina no tiene DST: el offset es fijo todo el año.
const ART_OFFSET = '-03:00';
const ART_OFFSET_MS = 3 * 3600 * 1000;

/** Suma n días a una fecha YYYY-MM-DD (aritmética de calendario pura). */
function addDaysYmd(ymd, n) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Fecha YYYY-MM-DD de un timestamp según hora Argentina. */
function artYmd(ts) {
  return new Date(new Date(ts).getTime() - ART_OFFSET_MS).toISOString().slice(0, 10);
}

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

  const wantDaily = ['true', '1'].includes(String(req.query.daily || '').toLowerCase());

  // Rango temporal: paid_at entre [from 00:00, to+1 00:00) en hora Argentina.
  // Como mp_paid_at y nave_paid_at son timestamptz, comparamos con strings ISO
  // con offset explícito para que el corte de día sea a medianoche ART.
  const fromIso = `${from}T00:00:00.000${ART_OFFSET}`;
  const toEndIso = `${addDaysYmd(to, 1)}T00:00:00.000${ART_OFFSET}`;

  // Filtramos por mp_paid_at OR nave_paid_at; Supabase no permite OR sobre 2
  // columnas con rango fácilmente, así que hacemos 2 queries y unimos.
  const baseSelect = 'id, total, shipping_cost, shipping_original_price, channel, payment_method, mp_paid_at, nave_paid_at, status';

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

  // ── Pauta publicitaria (gasto dinámico por día) ──
  // daily_expenses guarda un valor REAL por fecha (≠ fixed_expenses 'daily', que
  // repite el mismo monto). Ausencia de fila = día no cargado (se avisa);
  // amount=0 = confirmado sin pauta (no se avisa). Tolerante a que la tabla no
  // exista aún (deploy antes de la migración): degrada a "sin pauta" y lo marca,
  // en vez de tumbar el cierre.
  let pautaRows = [];
  let pautaTablePresente = true;
  {
    const { data: pr, error: pErr } = await supabase
      .from('daily_expenses')
      .select('expense_date, category, amount')
      .gte('expense_date', from)
      .lte('expense_date', to);
    if (pErr) {
      pautaTablePresente = false; // 42P01 = tabla inexistente, u otro error transitorio
      console.warn('[finance] /report daily_expenses no disponible:', pErr.message);
    } else {
      pautaRows = pr || [];
    }
  }
  // Monto por fecha (suma de categorías) y set de días efectivamente cargados
  // (tengan el monto que tengan, incluido 0 explícito).
  const pautaByDate = new Map();
  for (const row of pautaRows) {
    pautaByDate.set(row.expense_date, (pautaByDate.get(row.expense_date) || 0) + toNumber(row.amount));
  }
  const pauta = pautaRows.reduce((s, r) => s + toNumber(r.amount), 0);

  // Días del período (de `from` hasta hoy ART) sin ninguna fila de pauta.
  // Los días futuros no cuentan: todavía no se pudo gastar pauta.
  const hoyArtReport = artYmd(Date.now());
  const ultimoDiaPauta = to < hoyArtReport ? to : hoyArtReport;
  const dias_sin_pauta = [];
  if (pautaTablePresente) {
    for (let d = from; d <= ultimoDiaPauta; d = addDaysYmd(d, 1)) {
      if (!pautaByDate.has(d)) dias_sin_pauta.push(d);
    }
    dias_sin_pauta.reverse(); // más reciente primero
  }

  // ── Cargo mensual sobre facturación (switch on/off + % por mes) ──
  // Por cada mes del rango: si está ON, se descuenta percentage% de lo facturado
  // (ingresos brutos) de ese mes. Tolerante a que la tabla no exista aún.
  const firstMonthStart = `${from.slice(0, 7)}-01`;
  const lastMonthStart = `${to.slice(0, 7)}-01`;
  let chargeSettingsPresente = true;
  const chargeByMonth = new Map(); // 'YYYY-MM' → { enabled, percentage }
  {
    const { data: cr, error: cErr } = await supabase
      .from('monthly_revenue_charges')
      .select('month, enabled, percentage')
      .gte('month', firstMonthStart)
      .lte('month', lastMonthStart);
    if (cErr) {
      chargeSettingsPresente = false;
      console.warn('[finance] /report monthly_revenue_charges no disponible:', cErr.message);
    } else {
      for (const row of cr || []) {
        chargeByMonth.set(String(row.month).slice(0, 7), {
          enabled: row.enabled === true,
          percentage: toNumber(row.percentage),
        });
      }
    }
  }
  // Ingresos brutos por mes (base del cargo), agrupando por mes ART del pago.
  const ingresosByMonth = new Map();
  for (const o of orders) {
    const mm = artYmd(o.mp_paid_at || o.nave_paid_at).slice(0, 7);
    ingresosByMonth.set(mm, (ingresosByMonth.get(mm) || 0) + toNumber(o.total));
  }
  // Factor de cargo por mes (pct/100 si está ON, 0 si OFF) — reutilizado en la
  // serie diaria para prorratear sin re-mirar la config.
  const chargeFactorForMonth = (mm) => {
    const cfg = chargeByMonth.get(mm);
    return cfg && cfg.enabled ? cfg.percentage / 100 : 0;
  };
  const cargo_facturacion = [...ingresosByMonth.entries()].reduce(
    (s, [mm, ing]) => s + ing * chargeFactorForMonth(mm),
    0
  );
  // Detalle por mes del rango (incluye meses sin fila, como OFF al 7% default),
  // para que el switch de la UI tenga estado en cualquier vista.
  const cargo_por_mes = [];
  for (let mCursor = firstMonthStart; mCursor <= lastMonthStart; ) {
    const mm = mCursor.slice(0, 7);
    const cfg = chargeByMonth.get(mm);
    const enabled = cfg ? cfg.enabled : false;
    const percentage = cfg ? cfg.percentage : DEFAULT_REVENUE_CHARGE_PCT;
    const ingresos = ingresosByMonth.get(mm) || 0;
    cargo_por_mes.push({
      month: mm,
      enabled,
      percentage: Number(percentage.toFixed(2)),
      ingresos: Number(ingresos.toFixed(2)),
      cargo: Number((enabled ? ingresos * (percentage / 100) : 0).toFixed(2)),
    });
    // Avanzar un mes (aritmética de calendario sobre el día 1).
    const y = Number(mm.slice(0, 4));
    const mo = Number(mm.slice(5, 7));
    mCursor = mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, '0')}-01`;
  }

  // ── Cálculos agregados ──
  const ingresos_brutos = orders.reduce((s, o) => s + toNumber(o.total), 0);

  // Envío: tres cifras distintas que no hay que confundir.
  //   envio_cobrado  → lo que pagó el comprador. Informativo: ya está DENTRO de
  //                    ingresos_brutos (total = productos + envío), así que el
  //                    frontend NO debe sumarlo aparte.
  //   costo_envio    → lo que le pagamos a Correo. Este es el que se resta.
  //   quebranto_envio_gratis → cuánto de ese costo no se le trasladó al cliente.
  const envio_cobrado = orders.reduce((s, o) => s + toNumber(o.shipping_cost), 0);
  const costo_envio = orders.reduce((s, o) => s + realShippingCost(o), 0);
  const quebranto_envio_gratis = orders.reduce(
    (s, o) => s + Math.max(0, realShippingCost(o) - toNumber(o.shipping_cost)),
    0
  );
  const ordenes_sin_costo_envio_real = orders.filter((o) => o.shipping_original_price == null).length;

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
  const cogsByOrder = new Map();
  for (const it of items) {
    if (it.cogs_unit == null) {
      cogs_unidades_sin_costo += toNumber(it.quantity);
      continue;
    }
    const itemCogs = toNumber(it.cogs_unit) * toNumber(it.quantity);
    cogs += itemCogs;
    cogsByOrder.set(it.order_id, (cogsByOrder.get(it.order_id) || 0) + itemCogs);
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
      .select('id, total, shipping_cost, shipping_original_price, status, mp_paid_at, nave_paid_at')
      .in('status', ['refunded', 'chargeback'])
      .not('is_admin_test', 'is', true)
      .gte('mp_paid_at', fromIso)
      .lt('mp_paid_at', toEndIso),
    supabase
      .from('orders')
      .select('id, total, shipping_cost, shipping_original_price, status, mp_paid_at, nave_paid_at')
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
    // El flete a Correo se pagó igual que en una venta buena: la pérdida es el
    // costo real, no lo que se le había cobrado al comprador.
    const envio = realShippingCost(r);
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

  const ganancia_neta = ganancia_operativa - gastos_fijos - pauta - cargo_facturacion - perdidas_devoluciones;
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

  // ── Serie diaria (agenda/heatmap) ──
  // Reusa las órdenes/items/financials ya en memoria; agrupa por fecha ART del
  // pago. Los días futuros no se emiten; los días sin ventas van igual (con
  // sus gastos fijos prorrateados) para que el cliente tenga la grilla completa.
  let por_dia = null;
  if (wantDaily) {
    const finByOrder = new Map(financials.map((f) => [f.order_id, f]));
    const hoyArt = artYmd(Date.now());
    const lastDay = to < hoyArt ? to : hoyArt;

    const dayMap = new Map();
    for (let d = from; d <= lastDay; d = addDaysYmd(d, 1)) {
      dayMap.set(d, {
        fecha: d, ordenes: 0, ingresos_brutos: 0, neto: 0,
        envio: 0, envio_cobrado: 0, quebranto_envio_gratis: 0,
        cogs: 0, gastos_fijos: 0, pauta: 0, cargo_facturacion: 0, perdidas_devoluciones: 0,
      });
    }

    for (const o of orders) {
      const d = dayMap.get(artYmd(o.mp_paid_at || o.nave_paid_at));
      if (!d) continue;
      const fin = finByOrder.get(o.id);
      const envioReal = realShippingCost(o);
      const envioCobrado = toNumber(o.shipping_cost);
      d.ordenes += 1;
      d.ingresos_brutos += toNumber(o.total);
      d.neto += fin ? toNumber(fin.net_received) : toNumber(o.total);
      d.envio += envioReal; // costo real de Correo — es el que resta
      d.envio_cobrado += envioCobrado;
      d.quebranto_envio_gratis += Math.max(0, envioReal - envioCobrado);
      d.cogs += cogsByOrder.get(o.id) || 0;
    }

    // Cada pérdida se imputa al día ART del pago original (mismo criterio que
    // el agregado del período). refunds y devoluciones_detalle comparten índice.
    refunds.forEach((r, i) => {
      const d = dayMap.get(artYmd(r.mp_paid_at || r.nave_paid_at));
      if (d) d.perdidas_devoluciones += devoluciones_detalle[i].perdida;
    });

    for (const d of dayMap.values()) {
      d.gastos_fijos = expenses.reduce((s, e) => s + expenseAmountInRange(e, d.fecha, d.fecha), 0);
      d.pauta = pautaByDate.get(d.fecha) || 0;
      // Días sin pauta cargada quedan marcados para pintar el heatmap distinto.
      d.pauta_sin_cargar = pautaTablePresente && d.fecha <= hoyArtReport && !pautaByDate.has(d.fecha);
      // Cargo sobre facturación: % del mes de ESTE día aplicado a su facturado.
      d.cargo_facturacion = d.ingresos_brutos * chargeFactorForMonth(d.fecha.slice(0, 7));
      const ganancia = d.neto - d.envio - d.cogs - d.gastos_fijos - d.pauta - d.cargo_facturacion - d.perdidas_devoluciones;
      for (const k of [
        'ingresos_brutos', 'neto', 'envio', 'envio_cobrado', 'quebranto_envio_gratis',
        'cogs', 'gastos_fijos', 'pauta', 'cargo_facturacion', 'perdidas_devoluciones',
      ]) {
        d[k] = Number(d[k].toFixed(2));
      }
      d.ganancia_neta = Number(ganancia.toFixed(2));
    }
    por_dia = [...dayMap.values()];
  }

  return res.json({
    ...(por_dia ? { por_dia } : {}),
    period: { from, to, dias: daysBetweenInclusive(from, to) },
    resumen: {
      ingresos_brutos: Number(ingresos_brutos.toFixed(2)),
      comisiones_pasarela: Number(comisiones_pasarela.toFixed(2)),
      impuestos_retenidos: Number(impuestos_retenidos.toFixed(2)),
      neto_recibido: Number(neto_recibido_estimado.toFixed(2)),
      // costo_envio = lo que se le pagó a Correo (se resta de la ganancia).
      // envio_cobrado = lo que pagó el comprador; INFORMATIVO, ya está dentro de
      // ingresos_brutos — no sumarlo aparte en la UI.
      costo_envio: Number(costo_envio.toFixed(2)),
      envio_cobrado: Number(envio_cobrado.toFixed(2)),
      quebranto_envio_gratis: Number(quebranto_envio_gratis.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      ganancia_operativa: Number(ganancia_operativa.toFixed(2)),
      gastos_fijos: Number(gastos_fijos.toFixed(2)),
      pauta: Number(pauta.toFixed(2)),
      cargo_facturacion: Number(cargo_facturacion.toFixed(2)),
      perdidas_devoluciones: Number(perdidas_devoluciones.toFixed(2)),
      ganancia_neta: Number(ganancia_neta.toFixed(2)),
      margen_pct: Number(margen_pct.toFixed(2)),
    },
    avisos: {
      ordenes_sin_desglose_financiero: ordersWithoutFin.length,
      unidades_vendidas_sin_costo: cogs_unidades_sin_costo,
      devoluciones_en_periodo: devoluciones_detalle.length,
      // Órdenes sin tarifa real de Correo: caen al fallback (shipping_cost), así
      // que su flete puede estar subestimado. Correr scripts/backfill-shipping-cost.js.
      ordenes_sin_costo_envio_real: ordenes_sin_costo_envio_real,
      // Pauta: días del período sin cargar (más reciente primero) y flag de que
      // la tabla daily_expenses todavía no existe (migración pendiente).
      dias_sin_pauta,
      pauta_dias_sin_cargar: dias_sin_pauta.length,
      pauta_no_configurada: !pautaTablePresente,
      // Cargo mensual: flag de que la tabla todavía no existe (migración pendiente).
      cargo_facturacion_no_configurado: !chargeSettingsPresente,
    },
    detalle: {
      ordenes: orders.length,
      gastos_fijos: gastos_fijos_detalle,
      devoluciones: devoluciones_detalle,
      unidades_por_sku,
      por_canal,
      por_metodo_pago,
      // Estado del cargo por cada mes del rango (para el switch de la UI).
      cargo_por_mes,
    },
  });
});

module.exports = router;
