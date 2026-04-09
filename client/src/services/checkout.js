const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Crea una orden retail en el servidor (flujo legacy sin pasarela).
 * @param {Object} payload - customer_name, customer_email, customer_phone?, shipping_*, items: [{ product_id, quantity, unit_price }]
 * @returns {Promise<{ order: Object }>}
 */
export async function createCheckoutOrder(payload) {
  const url = `${API_URL}/api/checkout`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
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
 * @returns {Promise<{ order_id, payment_request_id, checkout_url, iframe_url, qr_data }>}
 */
export async function createNavePayment(payload) {
  const url = `${API_URL}/api/nave/create-payment`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
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
 * Mercado Pago: crea orden + POST /v1/orders en el servidor.
 * @param {Object} payload - Igual que createNavePayment + mp_payment + device_id opcional
 */
export async function createMPOrder(payload) {
  const url = `${API_URL}/api/mercadopago/create-order`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
 * Estado de orden pagada con Mercado Pago (polling).
 * @param {string} orderId
 */
export async function getMPOrderStatus(orderId) {
  const url = `${API_URL}/api/mercadopago/order-status/${orderId}`;
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Error al consultar estado');
    err.status = res.status;
    throw err;
  }
  return data;
}
