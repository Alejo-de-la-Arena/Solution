const { supabase } = require('../lib/supabase');
const gestionarProvider = require('./providers/gestionar.provider');

const SOFT_LOCK_MINUTES = 5;

async function loadPendingOrders({ limit, orderId = null }) {
    let query = supabase
        .from('orders')
        .select(
            'id, customer_name, customer_email, customer_phone, ' +
            'shipping_address_line1, shipping_address_line2, shipping_city, ' +
            'shipping_state, shipping_postal_code, shipping_country, shipping_notes, ' +
            'total, currency, channel, created_at, ' +
            'gestionar_attempts, gestionar_last_attempt_at',
        )
        .eq('status', 'paid')
        .eq('shipping_provider', 'gestionar')
        .is('gestionar_pushed_at', null)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (orderId) {
        query = query.eq('id', orderId);
    } else {
        // Soft lock: no levantamos órdenes que otro proceso intentó hace <5min.
        const cutoff = new Date(Date.now() - SOFT_LOCK_MINUTES * 60_000).toISOString();
        query = query.or(
            `gestionar_last_attempt_at.is.null,gestionar_last_attempt_at.lt.${cutoff}`,
        );
    }

    const { data, error } = await query;
    if (error) throw new Error(`Error leyendo orders: ${error.message}`);
    return data || [];
}

async function loadItemsForOrders(orderIds) {
    if (orderIds.length === 0) return { itemsByOrder: {}, productById: {} };

    const { data: items, error: itemsErr } = await supabase
        .from('order_items')
        .select('order_id, product_id, quantity, unit_price')
        .in('order_id', orderIds);
    if (itemsErr) throw new Error(`Error leyendo order_items: ${itemsErr.message}`);

    const productIds = [...new Set((items || []).map((i) => i.product_id))];
    let productById = {};
    if (productIds.length > 0) {
        const { data: products, error: pErr } = await supabase
            .from('products')
            .select('id, name, sku, gestionar_product_id')
            .in('id', productIds);
        if (pErr) throw new Error(`Error leyendo products: ${pErr.message}`);
        productById = Object.fromEntries((products || []).map((p) => [p.id, p]));
    }

    const itemsByOrder = {};
    for (const it of items || []) {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        const product = productById[it.product_id] || {};
        itemsByOrder[it.order_id].push({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: it.unit_price,
            sku: product.sku || null,
            name: product.name || null,
            gestionar_product_id: product.gestionar_product_id || null,
        });
    }

    return { itemsByOrder, productById };
}

async function markOrderPushed({ orderId, gestionarPackageId }) {
    const { error } = await supabase
        .from('orders')
        .update({
            gestionar_pushed_at: new Date().toISOString(),
            gestionar_package_id: gestionarPackageId || null,
            gestionar_error: null,
            gestionar_last_attempt_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    if (error) throw new Error(`Error marcando push de ${orderId}: ${error.message}`);
}

async function markOrderFailed({ orderId, message, currentAttempts }) {
    const { error } = await supabase
        .from('orders')
        .update({
            gestionar_error: String(message || 'Error desconocido').slice(0, 1000),
            gestionar_attempts: (currentAttempts || 0) + 1,
            gestionar_last_attempt_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    if (error) console.error(`[gestionar.dispatcher] markOrderFailed ${orderId}:`, error.message);
}

// Gestionar suele devolver { message: '...' } con info útil dentro de campos como
// `errors`, `details` o `invalidRows`. Si raw es solo { message } no aporta nada,
// pero cuando trae estructura la serializamos para que el admin la vea en
// orders.gestionar_error y los logs del server tengan el JSON completo.
function buildDetailedMessage(err) {
    const base = String(err?.message || 'Error desconocido');
    const raw = err?.raw;
    if (!raw || typeof raw !== 'object') return base;
    try {
        const rawStr = JSON.stringify(raw);
        if (rawStr === JSON.stringify({ message: base })) return base;
        return `${base} | raw: ${rawStr.slice(0, 700)}`;
    } catch {
        return base;
    }
}

/**
 * Levanta órdenes paid con shipping_provider=gestionar y push pendiente, arma
 * el Excel de Gestionar y las sube en lote.
 *
 * Idempotente: el WHERE gestionar_pushed_at IS NULL evita re-pushear y un soft
 * lock de 5min sobre gestionar_last_attempt_at protege contra corridas paralelas.
 */
async function dispatchPendingOrders({ limit = 50, orderId = null } = {}) {
    if (!supabase) throw new Error('Supabase no configurado');

    const pending = await loadPendingOrders({ limit, orderId });
    if (pending.length === 0) {
        return { picked: 0, succeeded: 0, failed: 0, errors: [] };
    }

    const orderIds = pending.map((o) => o.id);
    const { itemsByOrder } = await loadItemsForOrders(orderIds);

    const ordersWithItems = pending.map((o) => ({
        ...o,
        items: itemsByOrder[o.id] || [],
    }));

    let excelBuffer;
    try {
        excelBuffer = await gestionarProvider.buildFullfilmentExcel({ orders: ordersWithItems });
    } catch (err) {
        // Si buildFullfilmentExcel está stubeado (fase 8 bloqueada), marcamos
        // todas las órdenes con el error y volvemos. El admin lo ve y reintenta
        // cuando llegue el template del Excel.
        const detailedMessage = buildDetailedMessage(err);
        console.error(
            '[gestionar.dispatcher] buildFullfilmentExcel falló:',
            detailedMessage,
            err.raw ? `\nraw: ${JSON.stringify(err.raw, null, 2)}` : '',
        );
        await Promise.all(
            ordersWithItems.map((o) =>
                markOrderFailed({
                    orderId: o.id,
                    message: detailedMessage,
                    currentAttempts: o.gestionar_attempts,
                }),
            ),
        );
        return {
            picked: pending.length,
            succeeded: 0,
            failed: pending.length,
            errors: [{ stage: 'buildExcel', message: detailedMessage, raw: err.raw || null }],
        };
    }

    let response;
    try {
        response = await gestionarProvider.registerNotLinkedPackages({
            excelBuffer,
            condition: 'nueva venta',
            type: 'fullfilment',
        });
    } catch (err) {
        const detailedMessage = buildDetailedMessage(err);
        // Log siempre el raw completo (sin truncar) — Gestionar suele meter en
        // `errors` o `invalidRows` qué fila/columna rechazó el validador.
        console.error(
            '[gestionar.dispatcher] registerNotLinkedPackages falló para órdenes',
            ordersWithItems.map((o) => o.id).join(', '),
            '— status:', err.status,
            '— message:', err.message,
            err.raw ? `\nraw: ${JSON.stringify(err.raw, null, 2)}` : '',
        );
        await Promise.all(
            ordersWithItems.map((o) =>
                markOrderFailed({
                    orderId: o.id,
                    message: detailedMessage,
                    currentAttempts: o.gestionar_attempts,
                }),
            ),
        );
        return {
            picked: pending.length,
            succeeded: 0,
            failed: pending.length,
            errors: [{ stage: 'upload', message: detailedMessage, raw: err.raw || null }],
        };
    }

    const claimedPackageIds = new Set();
    let succeeded = 0;
    const errors = [];
    for (const o of ordersWithItems) {
        try {
            const pkgs = extractPackagesForOrder(response, o, claimedPackageIds);
            for (const p of pkgs) claimedPackageIds.add(p.package_id);
            const primaryId = pkgs[0]?.package_id ? String(pkgs[0].package_id) : null;
            await markOrderPushed({
                orderId: o.id,
                gestionarPackageId: primaryId,
            });
            await persistOrderPackages({ orderId: o.id, packages: pkgs });
            succeeded += 1;
        } catch (err) {
            errors.push({ orderId: o.id, message: err.message });
        }
    }

    return {
        picked: pending.length,
        succeeded,
        failed: pending.length - succeeded,
        errors,
        response,
    };
}

async function persistOrderPackages({ orderId, packages }) {
    if (!packages || packages.length === 0) return;
    const rows = packages.map((p) => ({
        order_id: orderId,
        package_id: p.package_id,
        qr_code_id: p.qr_code_id || null,
        tracking_url: p.tracking_url || null,
        sku: p.sku || null,
        sale_date: p.sale_date || null,
        raw: p.raw || null,
    }));
    const { error } = await supabase
        .from('order_gestionar_packages')
        .upsert(rows, { onConflict: 'package_id' });
    if (error) {
        // No abortamos el push si falla la escritura del detalle — la orden ya
        // quedó marcada como pushed y el paquete existe en Gestionar.
        console.error(
            `[gestionar.dispatcher] persistOrderPackages ${orderId}:`,
            error.message,
        );
    }
}

/**
 * Devuelve todos los paquetes que Gestionar generó para `order`. Una orden con
 * N SKUs produce N paquetes (uno por fila del Excel). Match se hace por
 * `destinatary.email`; `claimedPackageIds` evita reasignar paquetes que ya se
 * adjudicaron a otra orden del lote.
 *
 * Shape de cada elemento devuelto:
 *   { package_id, qr_code_id, tracking_url, sku, sale_date, raw }
 *
 * `sku` puede venir vacío: Gestionar no incluye SKU en el response del push,
 * solo dirección/destinatario. Lo dejamos null y se llena cuando hagamos
 * matching más fino (p. ej. usando el orden de las filas del Excel).
 */
function extractPackagesForOrder(response, order, claimedPackageIds = new Set()) {
    const packages = response?.data?.packages;
    if (!Array.isArray(packages) || packages.length === 0) return [];

    const targetEmail = String(order?.customer_email || '').trim().toLowerCase();
    if (!targetEmail) return [];

    const result = [];
    for (const entry of packages) {
        const pkg = entry?.package || entry;
        if (!pkg?.id) continue;
        if (claimedPackageIds.has(pkg.id)) continue;
        const pkgEmail = String(
            entry?.destinatary?.email || pkg?.destinatary?.email || '',
        ).trim().toLowerCase();
        if (pkgEmail && pkgEmail === targetEmail) {
            result.push({
                package_id: pkg.id,
                qr_code_id: pkg.qr_code_id || null,
                tracking_url: pkg.tracking_url || null,
                sku: null,
                sale_date: parseSaleDate(pkg.sale_date),
                raw: pkg,
            });
        }
    }
    return result;
}

function parseSaleDate(s) {
    if (!s || typeof s !== 'string') return null;
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    return `${m[3]}-${m[2]}-${m[1]}`; // YYYY-MM-DD para columna DATE
}

module.exports = {
    dispatchPendingOrders,
};
