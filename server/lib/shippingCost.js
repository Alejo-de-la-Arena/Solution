/**
 * Costo REAL del envío (lo que le pagamos a Correo Argentino), que NO es lo
 * mismo que `orders.shipping_cost` (lo que le cobramos al comprador).
 *
 * Con envío gratis le cobramos $0 al cliente pero el flete se paga igual: si la
 * calculadora usa `shipping_cost` como costo, ese gasto desaparece y la
 * ganancia sale inflada. El costo real viaja en la cotización que el checkout
 * adjunta a la orden, en `selectedOption.originalPrice` (ver
 * services/providers/correo/correo.provider.js: `price` es 0 cuando aplica
 * envío gratis, `originalPrice` siempre trae la tarifa de Correo).
 *
 * Fuentes por orden de preferencia:
 *   1. shipping_quote_payload.selectedOption.originalPrice  → la opción elegida
 *   2. shipping_quote_payload.selectedOption.raw.price      → tarifa cruda de Correo
 *   3. shipping_quote_response.raw.rates[]                  → match por modo + servicio
 *
 * Devuelve null si no se puede determinar; quien consume decide el fallback.
 */

function toPositiveNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param {object|null} quotePayload  orders.shipping_quote_payload
 * @param {object|null} quoteResponse orders.shipping_quote_response
 * @param {{ mode?: string, serviceType?: string }} [hint] modo/servicio de la
 *        orden, para desempatar en rates[] cuando no hay selectedOption.
 * @returns {number|null} costo real en ARS, o null si no se pudo determinar.
 */
function extractRealShippingCost(quotePayload, quoteResponse, hint = {}) {
  const selected = quotePayload && typeof quotePayload === 'object'
    ? quotePayload.selectedOption
    : null;

  if (selected && typeof selected === 'object') {
    const fromOriginal = toPositiveNumber(selected.originalPrice);
    if (fromOriginal != null) return fromOriginal;
    const fromRaw = toPositiveNumber(selected.raw?.price);
    if (fromRaw != null) return fromRaw;
  }

  // Sin selectedOption utilizable: reconstruir desde la respuesta cruda de
  // Correo buscando la tarifa que corresponde al envío que se despachó.
  const rates = quoteResponse && typeof quoteResponse === 'object'
    ? (Array.isArray(quoteResponse.raw?.rates) ? quoteResponse.raw.rates : null)
    : null;
  if (!rates) return null;

  const mode = hint.mode || selected?.mode || null;
  const serviceType = hint.serviceType || selected?.serviceType || null;
  // deliveredType: 'S' = sucursal, 'D' = domicilio (Correo).
  const wantDelivered = mode === 'branch' ? 'S' : 'D';

  const match = rates.find(
    (r) => r?.deliveredType === wantDelivered && (!serviceType || r?.productType === serviceType)
  ) || rates.find((r) => r?.deliveredType === wantDelivered);

  return match ? toPositiveNumber(match.price) : null;
}

module.exports = { extractRealShippingCost };
