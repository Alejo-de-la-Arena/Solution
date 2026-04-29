/**
 * firePurchaseEvent.js
 * 
 * Módulo dedicado a disparar el evento Purchase de Meta Pixel.
 * Lee los datos de la orden directamente del servidor (endpoint /api/checkout/track/:orderId)
 * para no depender de localStorage/sessionStorage que se pierden en redirects de MP.
 *
 * Se llama UNA sola vez por orderId gracias a un Set en memoria + localStorage flag.
 */

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const firedOrders = new Set();

function getFiredKey(orderId) {
    return `purchase_fired_${orderId}`;
}

function alreadyFired(orderId) {
    if (firedOrders.has(orderId)) return true;
    try {
        if (localStorage.getItem(getFiredKey(orderId))) return true;
    } catch { /* ignore */ }
    return false;
}

function markFired(orderId) {
    firedOrders.add(orderId);
    try {
        localStorage.setItem(getFiredKey(orderId), '1');
    } catch { /* ignore */ }
}

/**
 * Dispara el evento Purchase de Meta Pixel para una orden pagada.
 * Obtiene items y total directamente del servidor.
 * Es idempotente: si ya se disparó para este orderId, no hace nada.
 *
 * @param {string} orderId
 * @returns {Promise<boolean>} true si se disparó, false si no
 */
export async function firePurchaseEvent(orderId) {
    if (!orderId) return false;
    if (alreadyFired(orderId)) return false;
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return false;

    try {
        const res = await fetch(`${BASE}/api/checkout/track/${orderId}`);
        if (!res.ok) return false;

        const data = await res.json();
        const order = data.order;
        const items = data.items;

        if (!order || !items || items.length === 0) return false;

        const totalValue = Number(order.total) || 0;
        if (totalValue <= 0) return false;

        const contentIds = items.map((i) => String(i.product_id));
        const contents = items.map((i) => ({
            id: String(i.product_id),
            quantity: Number(i.quantity) || 1,
        }));
        const numItems = contents.reduce((sum, c) => sum + c.quantity, 0);

        // Marcar como disparado ANTES de llamar a fbq para evitar duplicados
        markFired(orderId);

        window.fbq('track', 'Purchase', {
            content_ids: contentIds,
            contents: contents,
            content_type: 'product',
            num_items: numItems,
            value: totalValue,
            currency: order.currency || 'ARS',
            order_id: String(orderId),
        }, {
            eventID: `purchase_${orderId}`,
        });

        return true;
    } catch (err) {
        console.error('[firePurchaseEvent] error:', err);
        return false;
    }
}