const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Cotiza el envío para los items y la dirección dados.
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

/**
 * Obtiene las sucursales de Correo Argentino para una provincia.
 * Usado en el panel admin para el selector de sucursal de despacho.
 *
 * @param {string} province - Nombre de provincia (ej: "Buenos Aires", "Cordoba")
 * @returns {Promise<Array<{code, name, address, locality, postalCode, hours, status}>>}
 */
export async function fetchCorreoAgencies(province) {
    if (!province) throw new Error('provincia requerida');
    const res = await fetch(
        `${BASE}/api/correo/agencies?province=${encodeURIComponent(province)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener sucursales');
    return data.agencies || [];
}

/**
 * Admin: guardar tracking number y enviar email de seguimiento al cliente.
 */
export async function saveTrackingNumber({ orderId, trackingNumber }) {
    const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const url = `${API_URL}/api/correo/save-tracking`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, trackingNumber }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || 'Error al guardar tracking');
    }
    return data;
}