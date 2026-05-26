#!/usr/bin/env node
/**
 * Seed de datos demo para el módulo Calculadora.
 *
 *   - Setea products.cost_price para los 5 perfumes
 *   - Inserta 4 gastos fijos vigentes desde 2026-05-01
 *
 * IDEMPOTENTE:
 *   - Costos: UPDATE por slug (sólo modifica los slugs listados)
 *   - Gastos: chequea si ya existe un gasto vigente con el mismo `name`. Si sí,
 *     no inserta uno nuevo (evita duplicados al re-correr).
 *
 * Uso:
 *   cd Solution/server
 *   node ../scripts/seed-finance-demo.js --dry-run        # ver qué haría
 *   node ../scripts/seed-finance-demo.js                  # aplicar
 *
 * Requiere SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY en server/.env.
 */

const path = require('path');
const { createRequire } = require('module');
// Los node_modules viven en server/, no en la raíz del repo. Resolvemos los
// paquetes desde ahí para que el script corra sin necesidad de NODE_PATH.
const requireFromServer = createRequire(path.join(__dirname, '..', 'server', 'package.json'));

requireFromServer('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });
const { createClient } = requireFromServer('@supabase/supabase-js');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const PRODUCT_COSTS = [
  { slug: 'black-code', cost_price: 10876 },
  { slug: 'red-desire', cost_price: 11123 },
  { slug: 'yellow-bloom', cost_price: 10654 },
  { slug: 'white-ice', cost_price: 11089 },
  { slug: 'deep-blue', cost_price: 10521 },
];

const FIXED_EXPENSES = [
  { name: 'Packaging',        category: 'logistica', amount: 100000, frequency: 'monthly', effective_from: '2026-05-01' },
  { name: 'Pauta Meta Ads',   category: 'pauta',     amount: 250000, frequency: 'monthly', effective_from: '2026-05-01' },
  { name: 'Contador',         category: 'contador',  amount:  80000, frequency: 'monthly', effective_from: '2026-05-01' },
  { name: 'Servidor / infra', category: 'infra',     amount:  35000, frequency: 'monthly', effective_from: '2026-05-01' },
];

function getSupabase() {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
  return createClient(url, key, { auth: { persistSession: false } });
}

async function seedCosts(supabase) {
  console.log('\n— Costos de productos —');
  for (const { slug, cost_price } of PRODUCT_COSTS) {
    const { data: prod } = await supabase
      .from('products')
      .select('id, name, cost_price')
      .eq('slug', slug)
      .maybeSingle();
    if (!prod) {
      console.warn(`  ⚠ slug no encontrado: ${slug}`);
      continue;
    }
    const before = prod.cost_price;
    console.log(`  ${prod.name.padEnd(20)}  ${String(before ?? '—').padStart(8)}  →  ${cost_price}`);
    if (!DRY_RUN) {
      const { error } = await supabase
        .from('products')
        .update({ cost_price })
        .eq('id', prod.id);
      if (error) console.error(`    ✗ error:`, error.message);
    }
  }
}

async function seedExpenses(supabase) {
  console.log('\n— Gastos fijos vigentes —');
  for (const exp of FIXED_EXPENSES) {
    const { data: existing } = await supabase
      .from('fixed_expenses')
      .select('id, amount')
      .eq('name', exp.name)
      .is('effective_until', null)
      .maybeSingle();

    if (existing) {
      console.log(`  ${exp.name.padEnd(20)}  ya existe (id=${existing.id.slice(0, 8)}…, $${existing.amount}) — skip`);
      continue;
    }

    console.log(`  ${exp.name.padEnd(20)}  $${exp.amount}/${exp.frequency} desde ${exp.effective_from}  → insert`);
    if (!DRY_RUN) {
      const { error } = await supabase
        .from('fixed_expenses')
        .insert({ ...exp, notes: 'seed demo' });
      if (error) console.error(`    ✗ error:`, error.message);
    }
  }
}

(async () => {
  console.log(`[seed-finance] modo: ${DRY_RUN ? 'DRY-RUN (no escribe)' : 'WRITE'}`);
  const supabase = getSupabase();
  await seedCosts(supabase);
  await seedExpenses(supabase);
  console.log(DRY_RUN ? '\n(DRY-RUN — re-correr sin --dry-run para aplicar)' : '\n✓ Listo.');
})().catch((err) => {
  console.error('[seed-finance] Error fatal:', err);
  process.exit(1);
});
