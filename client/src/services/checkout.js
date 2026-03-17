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
