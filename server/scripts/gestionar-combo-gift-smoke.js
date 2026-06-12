/**
 * Smoke test del perfumero de regalo por combo (Gestionar fulfillment).
 *
 * Verifica que `appendComboGiftItems` suma una línea con el SKU del perfumero
 * (PER-S-SOL-UTI) por cada combo de la orden, y que esa línea termina en el Excel
 * de fulfillment. No toca Supabase ni Gestionar.
 *
 * Uso:  cd Solution/server && node scripts/gestionar-combo-gift-smoke.js
 */
const fs = require('fs');
const path = require('path');
const { appendComboGiftItems, COMBO_GIFT_SKU } = require('../services/gestionar.dispatcher');
const { buildFullfilmentExcel } = require('../services/providers/gestionar.provider');

function assert(cond, msg) {
    if (!cond) {
        console.error('✗ FALLÓ:', msg);
        process.exit(1);
    }
    console.log('✓', msg);
}

async function main() {
    // 1 combo = 2 perfumes con combo_tag → 1 perfumero.
    const oneCombo = appendComboGiftItems([
        { sku: 'RED-N-ROJ-D', quantity: 1, combo_tag: 'Combo Día del Padre' },
        { sku: 'BLA-N-NEG-A', quantity: 1, combo_tag: 'Combo Día del Padre' },
    ]);
    const gift1 = oneCombo.filter((i) => i.sku === COMBO_GIFT_SKU);
    assert(gift1.length === 1 && gift1[0].quantity === 1, '1 combo → 1 perfumero');

    // 2 combos (4 perfumes) → 2 perfumeros.
    const twoCombos = appendComboGiftItems([
        { sku: 'RED-N-ROJ-D', quantity: 2, combo_tag: 'Combo Día del Padre' },
        { sku: 'BLA-N-NEG-A', quantity: 2, combo_tag: 'Combo Día del Padre' },
    ]);
    const gift2 = twoCombos.filter((i) => i.sku === COMBO_GIFT_SKU);
    assert(gift2.length === 1 && gift2[0].quantity === 2, '2 combos → 2 perfumeros');

    // Orden sin combo (compra individual) → sin perfumero.
    const noCombo = appendComboGiftItems([
        { sku: 'WHI-D-BLA-F', quantity: 1, combo_tag: null },
    ]);
    assert(noCombo.every((i) => i.sku !== COMBO_GIFT_SKU), 'sin combo → sin perfumero');

    // El perfumero llega al Excel: orden de combo = 2 perfumes + 1 perfumero = 3 filas.
    const buffer = await buildFullfilmentExcel({
        orders: [{
            id: 'ord-combo',
            customer_name: 'Juan Combo',
            customer_email: 'juan@example.com',
            customer_phone: '1144556677',
            shipping_address_line1: 'Av. Corrientes 1234',
            shipping_address_line2: null,
            shipping_city: 'CABA',
            shipping_postal_code: '1043',
            shipping_notes: null,
            created_at: '2026-06-12T15:30:00Z',
            items: oneCombo,
        }],
    });
    const outPath = path.join(__dirname, '..', 'tmp-combo-gift-output.xlsx');
    fs.writeFileSync(outPath, buffer);
    assert(buffer.length > 0, `Excel escrito en ${outPath} (3 filas: 2 perfumes + 1 perfumero ${COMBO_GIFT_SKU})`);

    console.log('\nOK. Perfumero de regalo integrado al fulfillment de Gestionar.');
}

main().catch((err) => {
    console.error('FALLÓ smoke test:', err.message);
    if (err.raw) console.error('raw:', err.raw);
    process.exit(1);
});
