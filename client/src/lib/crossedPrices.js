/**
 * Precios de referencia (tachados) por slug de perfume.
 * Representa el "precio anterior" / precio sin descuento.
 */
export const CROSSED_PRICES = {
  'black-code':   58499,
  'red-desire':   51999,
  'yellow-bloom': 51999,
  'deep-blue':    45499,
  'white-ice':    45499,
};

/**
 * Formatea un precio cruzado como "$58.499 ARS".
 * Devuelve null si no hay precio tachado para ese slug.
 */
export function getCrossedPrice(slug) {
  const n = CROSSED_PRICES[(slug || '').toLowerCase().trim()];
  if (!n) return null;
  return `$${n.toLocaleString('es-AR')}`;
}
