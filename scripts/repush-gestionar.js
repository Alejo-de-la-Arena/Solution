#!/usr/bin/env node
/**
 * Re-push de órdenes a Gestionar.
 *
 * Limpia los campos `gestionar_*` de una o más órdenes (identificadas por
 * prefijo de UUID o UUID completo) y llama al dispatcher para pushearlas
 * de nuevo. El dispatcher actual usa `condition: 'Nueva Venta'`, así que
 * esto sirve para corregir órdenes que se pushearon antes con otra condition
 * (ej: 'cambio').
 *
 * IMPORTANTE: este script NO toca los paquetes ya creados en Gestionar.
 * Si necesitás anular los paquetes "viejos", hacelo manualmente en el portal
 * de Gestionar — acá solo creamos los nuevos.
 *
 * Uso:
 *   cd Solution/server && node ../scripts/repush-gestionar.js --dry-run 91c49468 20f3d01c
 *   cd Solution/server && node ../scripts/repush-gestionar.js 91c49468 20f3d01c
 *
 * Variables de entorno (del server/.env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   GESTIONAR_API_KEY, GESTIONAR_API_URL
 *
 * Flags:
 *   --dry-run    no escribe ni pushea, solo muestra el estado actual
 */

const path = require('path');
const { createRequire } = require('module');
const requireFromServer = createRequire(path.join(__dirname, '..', 'server', 'package.json'));

requireFromServer('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const { createClient } = requireFromServer('@supabase/supabase-js');
const { dispatchPendingOrders } = require('../server/services/gestionar.dispatcher');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const PREFIXES = args.filter((a) => !a.startsWith('--')).map((s) => s.replace(/^#/, '').trim().toLowerCase());

if (PREFIXES.length === 0) {
  console.error('Uso: node scripts/repush-gestionar.js [--dry-run] <prefijo> [<prefijo>...]');
  console.error('Ejemplo: node scripts/repush-gestionar.js --dry-run 91c49468 20f3d01c');
  process.exit(1);
}

function getSupabase() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolvePrefix(supabase, prefix) {
  // PostgREST no acepta `like` ni cast `::text` sobre columnas uuid. Como los
  // UUIDs se ordenan lexicográficamente igual que su representación hex, un
  // range gte/lte sobre el prefijo equivale a "empieza con". El padding tiene
  // que respetar la posición de los guiones en el formato 8-4-4-4-12.
  const padded = prefix.padEnd(8, '0').slice(0, 8);
  const lower = `${padded}-0000-0000-0000-000000000000`;
  const upper = `${padded}-ffff-ffff-ffff-ffffffffffff`;
  const { data, error } = await supabase
    .from('orders')
    .select('id, customer_name, status, gestionar_pushed_at, gestionar_error, gestionar_attempts, gestionar_package_id, shipping_provider, customer_phone')
    .gte('id', lower)
    .lte('id', upper);
  if (error) throw new Error(`Error buscando prefijo ${prefix}: ${error.message}`);
  if (!data || data.length === 0) return { error: `No se encontró orden con prefijo "${prefix}"` };
  if (data.length > 1) {
    return { error: `Prefijo "${prefix}" ambiguo: matchea ${data.length} órdenes (${data.map((d) => d.id).join(', ')})` };
  }
  return { order: data[0] };
}

async function countPackages(supabase, orderId) {
  const { count, error } = await supabase
    .from('order_gestionar_packages')
    .select('package_id', { count: 'exact', head: true })
    .eq('order_id', orderId);
  if (error) {
    console.warn(`[repush] no se pudo contar packages de ${orderId}: ${error.message}`);
    return null;
  }
  return count;
}

async function resetGestionarFields(supabase, orderId) {
  const { error } = await supabase
    .from('orders')
    .update({
      gestionar_pushed_at: null,
      gestionar_package_id: null,
      gestionar_error: null,
      gestionar_attempts: 0,
      gestionar_last_attempt_at: null,
    })
    .eq('id', orderId);
  if (error) throw new Error(`Error reseteando ${orderId}: ${error.message}`);
}

async function deleteOldPackageRows(supabase, orderId) {
  // Limpiamos filas locales de paquetes "viejos" (los del push anterior con
  // condition='cambio'). En Gestionar siguen existiendo — esto es solo para
  // que la tabla local no quede con paquetes huérfanos apuntando a la orden
  // re-pusheada. El usuario los cancela manualmente en el portal si quiere.
  const { error, count } = await supabase
    .from('order_gestionar_packages')
    .delete({ count: 'exact' })
    .eq('order_id', orderId);
  if (error) throw new Error(`Error borrando packages de ${orderId}: ${error.message}`);
  return count || 0;
}

(async () => {
  console.log(`[repush] modo: ${DRY_RUN ? 'DRY-RUN' : 'WRITE'}`);
  console.log(`[repush] prefijos: ${PREFIXES.join(', ')}\n`);
  const supabase = getSupabase();

  // 1) Resolver prefijos
  const resolved = [];
  for (const prefix of PREFIXES) {
    const { order, error } = await resolvePrefix(supabase, prefix);
    if (error) {
      console.error(`  ❌ ${error}`);
      continue;
    }
    const pkgCount = await countPackages(supabase, order.id);
    console.log(`  ✓ ${prefix} → ${order.id}`);
    console.log(`      customer:           ${order.customer_name || '-'}`);
    console.log(`      phone:              ${order.customer_phone || '-'}`);
    console.log(`      status:             ${order.status}`);
    console.log(`      shipping_provider:  ${order.shipping_provider}`);
    console.log(`      gestionar_pushed_at:${order.gestionar_pushed_at || 'NULL'}`);
    console.log(`      gestionar_package:  ${order.gestionar_package_id || 'NULL'}`);
    console.log(`      gestionar_attempts: ${order.gestionar_attempts}`);
    console.log(`      gestionar_error:    ${(order.gestionar_error || '').slice(0, 120)}${order.gestionar_error?.length > 120 ? '…' : ''}`);
    console.log(`      packages locales:   ${pkgCount ?? '?'}\n`);
    resolved.push(order);
  }

  if (resolved.length === 0) {
    console.error('[repush] No quedaron órdenes para procesar. Aborto.');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('[repush] DRY-RUN: no se ejecuta reset ni push. Volvé a correr sin --dry-run para aplicar.');
    return;
  }

  // 2) Reset + dispatch por orden
  console.log('[repush] Aplicando reset + push...\n');
  const summary = { ok: 0, fail: 0, errors: [] };

  for (const order of resolved) {
    console.log(`[repush] → ${order.id}`);
    try {
      const deletedRows = await deleteOldPackageRows(supabase, order.id);
      console.log(`    🗑️  ${deletedRows} fila(s) borrada(s) en order_gestionar_packages`);
      await resetGestionarFields(supabase, order.id);
      console.log(`    🔄 gestionar_* reseteado`);

      const result = await dispatchPendingOrders({ orderId: order.id, limit: 1 });
      if (result.succeeded > 0) {
        console.log(`    ✅ push OK (succeeded=${result.succeeded})`);
        summary.ok += 1;
      } else {
        const errMsg = result.errors?.[0]?.message || JSON.stringify(result.errors || result);
        console.log(`    ❌ push falló: ${errMsg}`);
        summary.fail += 1;
        summary.errors.push({ orderId: order.id, message: errMsg, raw: result.errors?.[0]?.raw || null });
      }
    } catch (err) {
      console.log(`    💥 error fatal: ${err.message}`);
      summary.fail += 1;
      summary.errors.push({ orderId: order.id, message: err.message });
    }
    console.log('');
  }

  console.log('[repush] Resumen:');
  console.log(`  ok=${summary.ok}  fail=${summary.fail}`);
  if (summary.errors.length > 0) {
    console.log('  errores:');
    for (const e of summary.errors) {
      console.log(`    - ${e.orderId}: ${e.message}`);
      if (e.raw) console.log(`      raw: ${JSON.stringify(e.raw).slice(0, 400)}`);
    }
  }
  if (summary.fail > 0) process.exit(2);
})().catch((err) => {
  console.error('[repush] Error fatal:', err);
  process.exit(1);
});
