#!/usr/bin/env node
/**
 * Reconciliar órdenes de Mercado Pago trabadas en payment_initiated.
 *
 * Pasa cuando el cliente pagó por Checkout Pro (wallet / "dinero en cuenta")
 * pero MP no nos disparó el webhook y el cliente no volvió al back_url
 * success. La orden queda con status='payment_initiated', sin mp_payment_id.
 *
 * Este script busca el payment en MP por external_reference, agarra el más
 * reciente approved y aplica `applyPaymentToDb` (el mismo handler que usa el
 * webhook). Eso actualiza la orden a 'paid' y dispara emails + CAPI Purchase
 * con la idempotencia ya existente.
 *
 * Uso:
 *   cd Solution/server && node ../scripts/reconcile-mp-order.js --dry-run 7d583f22
 *   cd Solution/server && node ../scripts/reconcile-mp-order.js 7d583f22-470b-4329-9845-7fb6dac040e3
 *
 * Variables de entorno (del server/.env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MP_ACCESS_TOKEN
 *
 * Flags:
 *   --dry-run    no escribe, solo muestra qué payment encontró en MP
 */

const path = require('path');
const { createRequire } = require('module');
const requireFromServer = createRequire(path.join(__dirname, '..', 'server', 'package.json'));

requireFromServer('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const { createClient } = requireFromServer('@supabase/supabase-js');
const axios = requireFromServer('axios');
const mpRouter = require('../server/routes/mercadopago');

const MP_API = 'https://api.mercadopago.com';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const IDS = args.filter((a) => !a.startsWith('--')).map((s) => s.replace(/^#/, '').trim().toLowerCase());

if (IDS.length === 0) {
  console.error('Uso: node scripts/reconcile-mp-order.js [--dry-run] <orderId|prefijo> [<orderId|prefijo>...]');
  console.error('Ejemplo: node scripts/reconcile-mp-order.js --dry-run 7d583f22');
  process.exit(1);
}

function getSupabase() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAccessToken() {
  const t = (process.env.MP_ACCESS_TOKEN || '').trim();
  if (!t) throw new Error('MP_ACCESS_TOKEN no configurado');
  return t;
}

async function resolveOrder(supabase, idOrPrefix) {
  const looksLikeFullUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrPrefix);
  if (looksLikeFullUuid) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total, customer_email, customer_name, payment_method, mp_payment_id, mp_status, created_at')
      .eq('id', idOrPrefix)
      .maybeSingle();
    if (error) return { error: `Error buscando ${idOrPrefix}: ${error.message}` };
    if (!data) return { error: `No se encontró orden con id ${idOrPrefix}` };
    return { order: data };
  }
  const padded = idOrPrefix.padEnd(8, '0').slice(0, 8);
  const lower = `${padded}-0000-0000-0000-000000000000`;
  const upper = `${padded}-ffff-ffff-ffff-ffffffffffff`;
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total, customer_email, customer_name, payment_method, mp_payment_id, mp_status, created_at')
    .gte('id', lower)
    .lte('id', upper);
  if (error) return { error: `Error buscando prefijo ${idOrPrefix}: ${error.message}` };
  if (!data || data.length === 0) return { error: `No se encontró orden con prefijo "${idOrPrefix}"` };
  if (data.length > 1) {
    return { error: `Prefijo "${idOrPrefix}" ambiguo: matchea ${data.length} (${data.map((d) => d.id).join(', ')})` };
  }
  return { order: data[0] };
}

async function searchMpPayments(externalReference, accessToken) {
  // Endpoint legacy de búsqueda por external_reference. Devuelve los pagos
  // asociados (incluyendo los del wallet vía preferencia). Pedimos ordenado
  // por fecha desc así nos quedamos con el más nuevo aprobado.
  const { data } = await axios.get(`${MP_API}/v1/payments/search`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: {
      external_reference: externalReference,
      sort: 'date_created',
      criteria: 'desc',
      limit: 10,
    },
  });
  return Array.isArray(data?.results) ? data.results : [];
}

function pickBestPayment(payments) {
  // Preferimos approved/accredited; si no hay, devolvemos el más reciente.
  const approved = payments.find((p) =>
    String(p?.status || '').toLowerCase() === 'approved'
    && String(p?.status_detail || '').toLowerCase() === 'accredited'
  );
  if (approved) return approved;
  const anyApproved = payments.find((p) => String(p?.status || '').toLowerCase() === 'approved');
  if (anyApproved) return anyApproved;
  return payments[0] || null;
}

(async () => {
  console.log(`[reconcile] modo: ${DRY_RUN ? 'DRY-RUN' : 'WRITE'}`);
  console.log(`[reconcile] ids: ${IDS.join(', ')}\n`);

  const supabase = getSupabase();
  const accessToken = getAccessToken();

  const summary = { ok: 0, skipped: 0, fail: 0, errors: [] };

  for (const id of IDS) {
    console.log(`[reconcile] → ${id}`);
    const { order, error } = await resolveOrder(supabase, id);
    if (error) {
      console.log(`    ❌ ${error}\n`);
      summary.fail += 1;
      summary.errors.push({ id, message: error });
      continue;
    }
    console.log(`    orden:             ${order.id}`);
    console.log(`    customer:          ${order.customer_name || '-'} <${order.customer_email || '-'}>`);
    console.log(`    total:             ${order.total} (status actual: ${order.status})`);
    console.log(`    payment_method:    ${order.payment_method || '-'}`);
    console.log(`    mp_payment_id:     ${order.mp_payment_id || 'NULL'}`);
    console.log(`    created_at:        ${order.created_at}`);

    if ((order.payment_method || '') !== 'mercadopago') {
      console.log(`    ⏭️  no es de mercadopago, salto\n`);
      summary.skipped += 1;
      continue;
    }
    if (order.status === 'paid') {
      console.log(`    ⏭️  ya está paid, salto\n`);
      summary.skipped += 1;
      continue;
    }

    let payments;
    try {
      payments = await searchMpPayments(order.id, accessToken);
    } catch (err) {
      const msg = err.response?.data || err.message;
      console.log(`    ❌ error consultando MP: ${typeof msg === 'object' ? JSON.stringify(msg) : msg}\n`);
      summary.fail += 1;
      summary.errors.push({ id, message: 'MP search error' });
      continue;
    }

    if (payments.length === 0) {
      console.log(`    ❌ MP no devolvió pagos para external_reference=${order.id}\n`);
      summary.fail += 1;
      summary.errors.push({ id, message: 'no payments in MP' });
      continue;
    }

    console.log(`    📋 ${payments.length} pago(s) encontrados en MP:`);
    for (const p of payments) {
      console.log(`         - id=${p.id} status=${p.status}/${p.status_detail} amount=${p.transaction_amount} date=${p.date_created}`);
    }

    const best = pickBestPayment(payments);
    if (!best) {
      console.log(`    ❌ ningún pago utilizable\n`);
      summary.fail += 1;
      continue;
    }

    console.log(`    👉 usando payment ${best.id} (${best.status}/${best.status_detail})`);

    if (DRY_RUN) {
      console.log(`    🟡 DRY-RUN: no aplico cambios\n`);
      summary.skipped += 1;
      continue;
    }

    try {
      const nextStatus = await mpRouter.applyPaymentToDb(order.id, best, { sendEmailIfPaid: true });
      console.log(`    ✅ orden → ${nextStatus}\n`);
      summary.ok += 1;
    } catch (err) {
      console.log(`    💥 error aplicando: ${err.message}\n`);
      summary.fail += 1;
      summary.errors.push({ id, message: err.message });
    }
  }

  console.log('[reconcile] resumen:');
  console.log(`  ok=${summary.ok}  skipped=${summary.skipped}  fail=${summary.fail}`);
  if (summary.errors.length > 0) {
    console.log('  errores:');
    for (const e of summary.errors) {
      console.log(`    - ${e.id}: ${e.message}`);
    }
  }
  if (summary.fail > 0) process.exit(2);
})().catch((err) => {
  console.error('[reconcile] error fatal:', err);
  process.exit(1);
});
