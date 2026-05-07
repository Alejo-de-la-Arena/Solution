/**
 * Smoke test del builder de Excel para Gestionar (type=fullfilment).
 *
 * Llama a `buildFullfilmentExcel` con un fixture de 2 órdenes (una con 1 item,
 * otra con 2 items) y escribe el resultado a `tmp-fullfilment-output.xlsx` en
 * la raíz de `server/`. No toca Supabase ni Gestionar.
 *
 * Uso:  node scripts/gestionar-build-excel-smoke.js
 */
const fs = require('fs');
const path = require('path');
const { buildFullfilmentExcel } = require('../services/providers/gestionar.provider');

async function main() {
    const orders = [
        {
            id: 'ord-001',
            customer_name: 'Juan Perez',
            customer_email: 'juan@example.com',
            customer_phone: '1144556677',
            shipping_address_line1: 'Av. Corrientes 1234',
            shipping_address_line2: 'Piso 3 Depto B',
            shipping_city: 'CABA',
            shipping_postal_code: '1043',
            shipping_notes: 'Tocar timbre 3B',
            created_at: '2026-05-07T15:30:00Z',
            items: [
                { sku: 'BLA-N-NEG-A', quantity: 1, name: 'Black Code' },
            ],
        },
        {
            id: 'ord-002',
            customer_name: 'María García',
            customer_email: 'maria@example.com',
            customer_phone: '1199887766',
            shipping_address_line1: 'Calle Falsa 123',
            shipping_address_line2: null,
            shipping_city: 'San Isidro',
            shipping_postal_code: '1642',
            shipping_notes: null,
            created_at: '2026-05-06T10:00:00Z',
            items: [
                { sku: 'RED-N-ROJ-D', quantity: 2, name: 'Red Desire' },
                { sku: 'WHI-D-BLA-F', quantity: 1, name: 'White Ice' },
            ],
        },
    ];

    const buffer = await buildFullfilmentExcel({ orders });
    const outPath = path.join(__dirname, '..', 'tmp-fullfilment-output.xlsx');
    fs.writeFileSync(outPath, buffer);

    console.log('OK. Excel escrito en:', outPath);
    console.log('Tamaño:', buffer.length, 'bytes');
    console.log('Filas esperadas: 1 header + 3 líneas (1 + 2) = 4');
}

main().catch((err) => {
    console.error('FALLÓ smoke test:', err.message);
    if (err.raw) console.error('raw:', err.raw);
    process.exit(1);
});
