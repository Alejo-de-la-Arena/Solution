#!/usr/bin/env node
/**
 * Backfill del módulo Calculadora.
 *
 * 1) Para cada orden `paid` con mp_payment_id:
 *    - Llama GET /v1/payments/{id} (MP)
 *    - Extrae gross/fee/taxes/net y hace upsert en order_financials
 *
 * 2) Para cada orden `paid` con nave_payment_id:
 *    - Llama GET /ranty-payments/payments/{id} (Nave)
 *    - Mismo upsert
 *
 * 3) Para cada order_item con cogs_unit IS NULL:
 *    - Setea cogs_unit = products.cost_price actual (best effort)
 *
 * Idempotente: re-correr no duplica filas (upsert por order_id PK). Hace pausas
 * entre llamadas a APIs externas para evitar rate limits.
 *
 * Uso:
 *   cd Solution/server && node ../scripts/backfill-financials.js
 *
 * Variables de entorno (toma del server/.env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   MP_ACCESS_TOKEN
 *   NAVE_ENV, NAVE_CLIENT_ID, NAVE_CLIENT_SECRET, NAVE_AUDIENCE
 *
 * Flags opcionales:
 *   --dry-run      no escribe a la DB, sólo reporta
 *   --limit=N      procesa sólo N órdenes por proveedor (debugging)
 *   --skip=mp      saltea backfill de MP
 *   --skip=nave    saltea backfill de Nave
 *   --skip=cogs    saltea backfill de cogs_unit
 */

const path = require('path');
const { createRequire } = require('module');
// Los node_modules viven en server/, no en la raíz del repo.
const requireFromServer = createRequire(path.join(__dirname, '..', 'server', 'package.json'));

requireFromServer('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const axios = requireFromServer('axios');
const { createClient } = requireFromServer('@supabase/supabase-js');
const {
  extractFinancialsFromMpPayment,
  extractFinancialsFromNavePayment,
} = require('../server/lib/orderFinancials');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const LIMIT = (() => {
  const a = [...args].find((x) => x.startsWith('--limit='));
  return a ? Math.max(0, parseInt(a.split('=')[1], 10) || 0) : 0;
})();
const SKIP_MP = args.has('--skip=mp');
const SKIP_NAVE = args.has('--skip=nave');
const SKIP_COGS = args.has('--skip=cogs');

const MP_API = 'https://api.mercadopago.com';
const SLEEP_MS = 250;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function getSupabase() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Backfill MP ─────────────────────────────────────────────────────────────

async function backfillMp(supabase) {
  const token = (process.env.MP_ACCESS_TOKEN || '').trim();
  if (!token) {
    console.warn('[backfill][mp] MP_ACCESS_TOKEN no configurado — salteo MP');
    return { ok: 0, fail: 0, skipped: 0 };
  }

  let query = supabase
    .from('orders')
    .select('id, mp_payment_id')
    .eq('status', 'paid')
    .not('mp_payment_id', 'is', null);
  if (LIMIT > 0) query = query.limit(LIMIT);

  const { data: orders, error } = await query;
  if (error) throw error;

  console.log(`[backfill][mp] Órdenes a procesar: ${orders.length}`);

  let ok = 0, fail = 0, skipped = 0;
  for (const o of orders) {
    try {
      // Saltear si ya tiene financials
      const { data: existing } = await supabase
        .from('order_financials')
        .select('order_id')
        .eq('order_id', o.id)
        .maybeSingle();
      if (existing) { skipped += 1; continue; }

      const { data: payment } = await axios.get(`${MP_API}/v1/payments/${o.mp_payment_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fin = extractFinancialsFromMpPayment(payment);
      if (!fin) { fail += 1; console.warn(`[backfill][mp] sin fin payment=${o.mp_payment_id}`); continue; }

      if (!DRY_RUN) {
        const { error: upErr } = await supabase
          .from('order_financials')
          .upsert({
            order_id: o.id,
            provider: 'mercadopago',
            gross_amount: fin.gross_amount,
            payment_fee: fin.payment_fee,
            payment_taxes: fin.payment_taxes,
            net_received: fin.net_received,
            raw_payload: payment,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'order_id' });
        if (upErr) { fail += 1; console.error(`[backfill][mp] upsert error order=${o.id}:`, upErr); continue; }
      }
      ok += 1;
    } catch (err) {
      fail += 1;
      console.error(`[backfill][mp] error order=${o.id}:`, err.response?.status, err.response?.data || err.message);
    }
    await sleep(SLEEP_MS);
  }
  return { ok, fail, skipped };
}

// ── Backfill Nave ───────────────────────────────────────────────────────────

async function getNaveToken() {
  const isProd = ((process.env.NAVE_ENV || 'testing').toLowerCase() === 'production') ||
                 ((process.env.NAVE_ENV || '').toLowerCase() === 'prod');
  const authUrl = isProd
    ? 'https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate'
    : 'https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate';

  const clientId = (process.env.NAVE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.NAVE_CLIENT_SECRET || '').trim();
  const audience = (process.env.NAVE_AUDIENCE || '').trim();
  if (!clientId || !clientSecret) throw new Error('NAVE_CLIENT_ID/SECRET no configurados');

  const body = { client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' };
  if (audience) body.audience = audience;
  const { data } = await axios.post(authUrl, body, { headers: { 'Content-Type': 'application/json' } });
  return { token: data.access_token, apiBase: isProd ? 'https://api.ranty.io' : 'https://api-sandbox.ranty.io' };
}

async function backfillNave(supabase) {
  let naveCtx;
  try {
    naveCtx = await getNaveToken();
  } catch (err) {
    console.warn('[backfill][nave] No se pudo obtener token, salteo Nave:', err.message);
    return { ok: 0, fail: 0, skipped: 0 };
  }

  let query = supabase
    .from('orders')
    .select('id, nave_payment_id')
    .eq('status', 'paid')
    .not('nave_payment_id', 'is', null);
  if (LIMIT > 0) query = query.limit(LIMIT);

  const { data: orders, error } = await query;
  if (error) throw error;

  console.log(`[backfill][nave] Órdenes a procesar: ${orders.length}`);

  let ok = 0, fail = 0, skipped = 0;
  for (const o of orders) {
    try {
      const { data: existing } = await supabase
        .from('order_financials')
        .select('order_id')
        .eq('order_id', o.id)
        .maybeSingle();
      if (existing) { skipped += 1; continue; }

      const { data: payment } = await axios.get(
        `${naveCtx.apiBase}/ranty-payments/payments/${o.nave_payment_id}`,
        { headers: { Authorization: `Bearer ${naveCtx.token}` } },
      );
      const fin = extractFinancialsFromNavePayment(payment);
      if (!fin) { fail += 1; console.warn(`[backfill][nave] sin fin payment=${o.nave_payment_id}`); continue; }

      if (!DRY_RUN) {
        const { error: upErr } = await supabase
          .from('order_financials')
          .upsert({
            order_id: o.id,
            provider: 'nave',
            gross_amount: fin.gross_amount,
            payment_fee: fin.payment_fee,
            payment_taxes: fin.payment_taxes,
            net_received: fin.net_received,
            raw_payload: payment,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'order_id' });
        if (upErr) { fail += 1; console.error(`[backfill][nave] upsert error order=${o.id}:`, upErr); continue; }
      }
      ok += 1;
    } catch (err) {
      fail += 1;
      console.error(`[backfill][nave] error order=${o.id}:`, err.response?.status, err.response?.data || err.message);
    }
    await sleep(SLEEP_MS);
  }
  return { ok, fail, skipped };
}

// ── Backfill cogs_unit ──────────────────────────────────────────────────────

async function backfillCogs(supabase) {
  // Traer order_items sin cogs_unit
  const { data: items, error } = await supabase
    .from('order_items')
    .select('order_id, product_id')
    .is('cogs_unit', null);
  if (error) throw error;
  if (items.length === 0) {
    console.log('[backfill][cogs] No hay order_items sin cogs_unit.');
    return { updated: 0, skipped: 0 };
  }

  // Costo actual por producto
  const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))];
  const { data: products } = await supabase
    .from('products')
    .select('id, cost_price')
    .in('id', productIds);
  const costById = Object.fromEntries((products || []).map((p) => [p.id, p.cost_price]));

  let updated = 0, skipped = 0;
  for (const it of items) {
    const cost = costById[it.product_id];
    if (cost == null) { skipped += 1; continue; }
    if (!DRY_RUN) {
      const { error: upErr } = await supabase
        .from('order_items')
        .update({ cogs_unit: cost })
        .eq('order_id', it.order_id)
        .eq('product_id', it.product_id)
        .is('cogs_unit', null);
      if (upErr) { console.error('[backfill][cogs] error:', upErr); continue; }
    }
    updated += 1;
  }
  return { updated, skipped };
}

// ── Main ────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`[backfill] modo: ${DRY_RUN ? 'DRY-RUN' : 'WRITE'} ${LIMIT ? `limit=${LIMIT}` : ''}`);
  const supabase = getSupabase();

  const stats = { mp: null, nave: null, cogs: null };
  if (!SKIP_MP) stats.mp = await backfillMp(supabase);
  if (!SKIP_NAVE) stats.nave = await backfillNave(supabase);
  if (!SKIP_COGS) stats.cogs = await backfillCogs(supabase);

  console.log('\n[backfill] Resumen:');
  if (stats.mp) console.log(`  MP:    ok=${stats.mp.ok}  fail=${stats.mp.fail}  skipped(ya existía)=${stats.mp.skipped}`);
  if (stats.nave) console.log(`  Nave:  ok=${stats.nave.ok}  fail=${stats.nave.fail}  skipped(ya existía)=${stats.nave.skipped}`);
  if (stats.cogs) console.log(`  COGS:  updated=${stats.cogs.updated}  skipped(sin cost_price)=${stats.cogs.skipped}`);
  console.log(DRY_RUN ? '\n(DRY-RUN: no se escribió nada a la DB)' : '');
})().catch((err) => {
  console.error('[backfill] Error fatal:', err);
  process.exit(1);
});
