import { fetchWithTimeout } from './http';

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Cotiza el envío para los items y la dirección dados.
 */
export async function quoteShipping({ items, address }) {
    const res = await fetchWithTimeout(`${BASE}/api/shipping/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, address }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cotizar envío');
    return data;
}

/**
 * Extrae un texto legible del campo `details` que devuelve la API de Correo,
 * para mostrarle al admin el motivo REAL del fallo (CP inválido, dirección
 * incompleta, etc.) en lugar de un mensaje genérico.
 */
function extractCorreoDetail(details) {
    if (!details) return '';
    if (typeof details === 'string') return details.trim();
    const d = details.message || details.error || details.detail
        || (Array.isArray(details.errors) ? details.errors.map((e) => e?.message || e).join('; ') : '');
    return (d ? String(d) : '').trim();
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
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const detail = extractCorreoDetail(data.details);
        const base = data.error || 'Error al despachar con Correo Argentino';
        throw new Error(detail && !base.includes(detail) ? `${base} — ${detail}` : base);
    }
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
 * Obtiene las 2-3 sucursales de Correo Argentino más cercanas a un CP.
 * Usado en el checkout cuando el cliente elige "Retiro en sucursal".
 *
 * @param {{ province: string, postalCode: string, limit?: number }} args
 * @returns {Promise<Array<{code, name, address, locality, postalCode, hours}>>}
 */
export async function fetchNearbyCorreoAgencies({ province, postalCode, limit = 3 }) {
    if (!province) throw new Error('provincia requerida');
    if (!postalCode) throw new Error('código postal requerido');
    const params = new URLSearchParams({ province, postalCode, limit: String(limit) });
    const res = await fetch(`${BASE}/api/correo/nearby-agencies?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener sucursales cercanas');
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