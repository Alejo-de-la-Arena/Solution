const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Crea una orden retail en el servidor.
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
