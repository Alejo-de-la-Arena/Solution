const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Cotiza el envío para los items y la dirección dados.
 *
 * @param {{ items: Array<{product_id, quantity, unit_price}>, address: {postalCode, province, city?} }} params
 * @returns {Promise<{
 *   ok: boolean,
 *   provider: 'correo_argentino'|'gestionar',
 *   freeShipping: boolean,
 *   options: Array<{id, label, mode, price, originalPrice, eta, serviceType}>,
 *   customerId?: string,
 *   parcel?: object
 * }>}
 */
export async function quoteShipping({ items, address }) {
    const res = await fetch(`${BASE}/api/shipping/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cotizar envío');
    return data;
}

/**
 * Despacha una orden pagada con Correo Argentino desde el panel admin.
 *
 * @param {{ orderId: string, deliveryType: 'D'|'S', agencyCode?: string, agencyName?: string, serviceType?: string }} params
 */
export async function dispatchWithCorreo({ orderId, deliveryType, agencyCode, agencyName, serviceType }) {
    const res = await fetch(`${BASE}/api/correo/create-shipment-from-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, deliveryType, agencyCode, agencyName, serviceType }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al despachar con Correo Argentino');
    return data;
}