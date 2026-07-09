import { fetchWithTimeout } from './http';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// La creación de pagos llama a MP/Nave del lado del server y puede ser lenta;
// margen mayor que el default antes de abortar.
const PAYMENT_TIMEOUT_MS = 30000;

/**
 * Devuelve los headers de auth si se pasa un access_token de Supabase.
 * Si el server detecta un admin, aplica el modo prueba ($150/item, envío $0).
 */
function authHeaders(accessToken) {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

/**
 * Crea una orden retail en el servidor (flujo legacy sin pasarela).
 * @param {Object} payload - customer_name, customer_email, customer_phone?, shipping_*, items: [{ product_id, quantity, unit_price }]
 * @param {Object} [opts]
 * @param {string} [opts.accessToken] - Token de Supabase del usuario logueado (admin → precios de prueba).
 * @returns {Promise<{ order: Object }>}
 */
export async function createCheckoutOrder(payload, { accessToken } = {}) {
  const url = `${API_URL}/api/checkout`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify(payload),
  }, PAYMENT_TIMEOUT_MS);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error al procesar la compra');
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Crea una orden + intención de pago Nave.
 * @param {Object} payload - Same as createCheckoutOrder but items also include name/description
 * @param {Object} [opts]
 * @param {string} [opts.accessToken]
 * @returns {Promise<{ order_id, payment_request_id, checkout_url, iframe_url, qr_data }>}
 */
export async function createNavePayment(payload, { accessToken } = {}) {
  const url = `${API_URL}/api/nave/create-payment`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify(payload),
  }, PAYMENT_TIMEOUT_MS);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error al crear el pago');
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Consulta el estado de pago de una orden a través de Nave.
 * @param {string} orderId
 * @returns {Promise<{ order_id, order_status, nave_status, payment_attempts }>}
 */
export async function getPaymentStatus(orderId) {
  const url = `${API_URL}/api/nave/payment-status/${orderId}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error al consultar estado');
    err.status = res.status;
    throw err;
  }
  return data;
}

const CHECKOUT_PROVIDER_KEY = 'solution_checkout_provider';

/** @param {'nave' | 'mercadopago'} provider */
export function setCheckoutPaymentProvider(provider) {
  try {
    sessionStorage.setItem(CHECKOUT_PROVIDER_KEY, provider);
  } catch {
    /* ignore */
  }
}

/** @returns {'nave' | 'mercadopago' | null} */
export function getCheckoutPaymentProvider() {
  try {
    const v = sessionStorage.getItem(CHECKOUT_PROVIDER_KEY);
    if (v === 'mercadopago' || v === 'nave') return v;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Mercado Pago: crea orden DB + preferencia MP (para Payment Brick con wallet).
 * @param {Object} payload - Checkout payload + callback_url
 * @param {Object} [opts]
 * @param {string} [opts.accessToken]
 * @returns {Promise<{ order_id: string, preference_id: string|null }>}
 */
export async function createMPPreference(payload, { accessToken } = {}) {
  const url = `${API_URL}/api/mercadopago/create-preference`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify(payload),
  }, PAYMENT_TIMEOUT_MS);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error al crear preferencia de pago');
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Mercado Pago: crea la orden en DB + procesa el pago con tarjeta en un solo request.
 * @param {Object} payload - { ...checkoutPayload, mp_payment, device_id?, mp_public_key?, order_id? }
 *                           Si se pasa `order_id`, reutiliza la orden existente (reintento).
 *                           Si no, se crea la orden con el resto de los campos del checkout.
 * @param {Object} [opts]
 * @param {string} [opts.accessToken]
 */
export async function processMPCardPayment(payload, { accessToken } = {}) {
  const url = `${API_URL}/api/mercadopago/process-card-payment`;
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify(payload),
  }, PAYMENT_TIMEOUT_MS);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error al procesar el pago');
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/**
 * @deprecated Usar createMPPreference + processMPCardPayment
 */
export async function createMPOrder(payload, { accessToken } = {}) {
  const url = `${API_URL}/api/mercadopago/create-order`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(accessToken) },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error al procesar el pago');
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

/**
 * Tracking público del pedido (sin auth). Devuelve { order, items }.
 * @param {string} orderId
 */
export async function getOrderTracking(orderId) {
  const url = `${API_URL}/api/checkout/track/${encodeURIComponent(orderId)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'No se pudo consultar el pedido');
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Estado de orden pagada con Mercado Pago (polling).
 * @param {string} orderId
 * @param {string} [paymentId] - Payment ID from wallet redirect (to verify on first check)
 */
export async function getMPOrderStatus(orderId, paymentId) {
  let url = `${API_URL}/api/mercadopago/order-status/${orderId}`;
  if (paymentId) url += `?payment_id=${encodeURIComponent(paymentId)}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error al consultar estado');
    err.status = res.status;
    throw err;
  }
  return data;
}
