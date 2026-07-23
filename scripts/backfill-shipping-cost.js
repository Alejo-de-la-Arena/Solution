#!/usr/bin/env node
/**
 * Backfill de `orders.shipping_original_price` — el costo REAL de Correo.
 *
 * `shipping_cost` es lo que se le cobró al comprador (0 con envío gratis), no lo
 * que se le pagó a Correo. El costo real ya viaja guardado en cada orden dentro
 * de `shipping_quote_payload.selectedOption.originalPrice`, así que este backfill
 * NO llama a la API de Correo: es una copia de JSONB a columna.
 *
 * Uso:
 *   cd Solution/server && node ../scripts/backfill-shipping-cost.js --dry-run
 *   cd Solution/server && node ../scripts/backfill-shipping-cost.js --apply
 *
 * Flags:
 *   --dry-run     (default) no escribe, sólo reporta el impacto
 *   --apply       escribe los cambios
 *   --from=YYYY-MM-DD  sólo órdenes creadas desde esa fecha (default: todas)
 *   --force       recalcula también las que ya tienen shipping_original_price
 *
 * Idempotente: sin --force saltea las filas ya pobladas.
 */

const path = require('path');
const { createRequire } = require('module');
// Los node_modules viven en server/, no en la raíz del repo.
const requireFromServer = createRequire(path.join(__dirname, '..', 'server', 'package.json'));
requireFromServer('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const { createClient } = requireFromServer('@supabase/supabase-js');
const { extractRealShippingCost } = require('../server/lib/shippingCost');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
const FROM = (() => {
  const a = args.find((x) => x.startsWith('--from='));
  return a ? a.split('=')[1] : null;
})();

// Estados con ingreso efectivo (los que consume la calculadora) + los que
// pueden pasar a serlo. Backfilleamos amplio: la columna es informativa y no
// cuesta nada tenerla completa en órdenes que todavía no cerraron.
const STATUSES = ['paid', 'shipped', 'refunded', 'chargeback'];

function fmt(n) {
  return Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function main() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log(`\n[backfill-shipping] modo: ${APPLY ? 'APPLY (escribe)' : 'DRY-RUN (no escribe)'}${FORCE ? ' --force' : ''}`);
  if (FROM) console.log(`[backfill-shipping] desde: ${FROM}`);

  let query = supabase
    .from('orders')
    .select('id, created_at, status, shipping_cost, shipping_is_free, shipping_mode, shipping_service_type, shipping_original_price, shipping_quote_payload, shipping_quote_response, is_admin_test')
    .in('status', STATUSES)
    .order('created_at', { ascending: true });
  if (FROM) query = query.gte('created_at', `${FROM}T00:00:00.000-03:00`);

  const { data: orders, error } = await query;
  if (error) throw new Error(`Error leyendo órdenes: ${error.message}`);

  console.log(`[backfill-shipping] ${orders.length} órdenes en rango\n`);

  let updated = 0, skipped = 0, noData = 0, failed = 0;
  let sumCobrado = 0, sumReal = 0, sumQuebranto = 0;

  for (const o of orders) {
    if (o.shipping_original_price != null && !FORCE) { skipped++; continue; }

    // Las órdenes de prueba del admin no tienen envío real que pagar.
    const real = o.is_admin_test
      ? 0
      : extractRealShippingCost(o.shipping_quote_payload, o.shipping_quote_response, {
          mode: o.shipping_mode,
          serviceType: o.shipping_service_type,
        });

    if (real == null) {
      noData++;
      console.log(`  · sin cotización: ${o.id.slice(0, 8)} (${o.created_at.slice(0, 10)}) cobrado=${o.shipping_cost} → queda NULL, la calculadora usará shipping_cost`);
      continue;
    }

    const cobrado = Number(o.shipping_cost || 0);
    sumCobrado += cobrado;
    sumReal += real;
    if (real > cobrado) sumQuebranto += real - cobrado;

    if (APPLY) {
      const { error: upErr } = await supabase
        .from('orders')
        .update({ shipping_original_price: real })
        .eq('id', o.id);
      if (upErr) {
        failed++;
        console.error(`  ✗ ${o.id.slice(0, 8)}: ${upErr.message}`);
        continue;
      }
    }
    updated++;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${APPLY ? 'actualizadas' : 'a actualizar'}: ${updated}`);
  console.log(`  ya pobladas (salteadas): ${skipped}`);
  console.log(`  sin dato de cotización:  ${noData}`);
  if (failed) console.log(`  fallidas: ${failed}`);
  console.log('─'.repeat(60));
  console.log(`  envío cobrado a clientes: $${fmt(sumCobrado)}`);
  console.log(`  costo real de Correo:     $${fmt(sumReal)}`);
  console.log(`  quebranto (envío gratis): $${fmt(sumQuebranto)}`);
  console.log(`  → la ganancia estaba inflada en $${fmt(sumReal - sumCobrado)}`);
  console.log('─'.repeat(60));

  if (!APPLY) console.log('\nDry-run: no se escribió nada. Re-corré con --apply para aplicar.\n');
  else console.log('\nListo. La calculadora ya refleja el costo real.\n');
}

main().catch((err) => {
  console.error('[backfill-shipping] error fatal:', err.message);
  process.exit(1);
});
