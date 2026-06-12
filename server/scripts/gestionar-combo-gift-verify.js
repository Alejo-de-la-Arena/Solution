#!/usr/bin/env node
/**
 * Verificación READ-ONLY del perfumero de regalo por combo.
 *
 * Busca órdenes reales que tengan items de combo (order_items.combo_tag != null),
 * carga sus items igual que el dispatcher y corre `appendComboGiftItems` para
 * mostrar qué filas se mandarían a Gestionar — INCLUYENDO el perfumero.
 *
 * NO escribe nada: solo `SELECT`. No toca Gestionar. No crea ni modifica órdenes.
 *
 * Uso:  cd Solution/server && node scripts/gestionar-combo-gift-verify.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');
const { appendComboGiftItems, COMBO_GIFT_SKU } = require('../services/gestionar.dispatcher');

function getSupabase() {
    const url = (process.env.SUPABASE_URL || '').trim();
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    if (!url || !key) {
        throw new Error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en server/.env');
    }
    return createClient(url, key, { auth: { persistSession: false } });
}

async function main() {
    const supabase = getSupabase();
    console.log(`Perfumero de regalo configurado: SKU = ${COMBO_GIFT_SKU}\n`);

    // 1) order_items con combo_tag → distinct order_ids (read-only).
    const { data: comboItems, error: ciErr } = await supabase
        .from('order_items')
        .select('order_id, combo_tag')
        .not('combo_tag', 'is', null)
        .limit(500);
    if (ciErr) throw new Error(`order_items: ${ciErr.message}`);

    const orderIds = [...new Set((comboItems || []).map((i) => i.order_id))];
    if (orderIds.length === 0) {
        console.log('No hay órdenes con combo_tag todavía. Nada que verificar.');
        return;
    }

    // 2) Datos de esas órdenes (read-only).
    const { data: orders, error: oErr } = await supabase
        .from('orders')
        .select('id, status, shipping_provider, gestionar_pushed_at, customer_name, created_at')
        .in('id', orderIds)
        .order('created_at', { ascending: false });
    if (oErr) throw new Error(`orders: ${oErr.message}`);

    // 3) Todos los items de esas órdenes + sku/name de products (read-only).
    const { data: items, error: itErr } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity, unit_price, combo_tag')
        .in('order_id', orderIds);
    if (itErr) throw new Error(`order_items full: ${itErr.message}`);

    const productIds = [...new Set((items || []).map((i) => i.product_id).filter(Boolean))];
    let productById = {};
    if (productIds.length > 0) {
        const { data: products, error: pErr } = await supabase
            .from('products')
            .select('id, name, sku')
            .in('id', productIds);
        if (pErr) throw new Error(`products: ${pErr.message}`);
        productById = Object.fromEntries((products || []).map((p) => [p.id, p]));
    }

    const itemsByOrder = {};
    for (const it of items || []) {
        const product = productById[it.product_id] || {};
        (itemsByOrder[it.order_id] ||= []).push({
            quantity: it.quantity,
            sku: product.sku || null,
            name: product.name || null,
            combo_tag: it.combo_tag || null,
        });
    }

    console.log(`Órdenes con combo encontradas: ${orders.length}\n`);

    let wouldDispatch = 0;
    for (const o of orders) {
        const original = itemsByOrder[o.id] || [];
        const withGift = appendComboGiftItems(original);
        const giftLine = withGift.find((i) => i.sku === COMBO_GIFT_SKU);

        const willBePicked =
            o.status === 'paid' &&
            o.shipping_provider === 'gestionar' &&
            !o.gestionar_pushed_at;
        if (willBePicked) wouldDispatch += 1;

        const flags = [
            o.status,
            o.shipping_provider || 'sin-provider',
            o.gestionar_pushed_at ? 'ya-pusheada' : 'push-pendiente',
            willBePicked ? '⇒ EL DISPATCHER LA TOMA' : '(no la toma ahora)',
        ].join(' · ');

        console.log(`#${String(o.id).slice(0, 8)}  ${o.customer_name || '-'}`);
        console.log(`   ${flags}`);
        console.log('   items que verían en Gestionar:');
        for (const i of withGift) {
            const isGift = i.sku === COMBO_GIFT_SKU;
            const skuLabel = (i.sku || '«sin SKU»').padEnd(14);
            console.log(
                `     ${isGift ? '🎁' : '  '} ${skuLabel} x${i.quantity}` +
                `  ${isGift ? '(PERFUMERO DE REGALO)' : (i.name || '')}` +
                `${i.combo_tag ? `  [${i.combo_tag}]` : ''}`,
            );
        }
        if (!giftLine) {
            console.log('     (sin línea de perfumero — esta orden no tiene items de combo)');
        }
        console.log('');
    }

    console.log('─'.repeat(60));
    console.log(`Órdenes que el dispatcher tomaría AHORA (paid + gestionar + sin pushear): ${wouldDispatch}`);
    console.log('Esta verificación NO escribió nada ni contactó a Gestionar.');
}

main().catch((err) => {
    console.error('FALLÓ verificación:', err.message);
    process.exit(1);
});
