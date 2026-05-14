/**
 * Meta Conversions API (CAPI) — server-side events.
 *
 * Complementa el pixel de navegador: cuando el usuario no regresa al sitio
 * después de pagar (ej. MP Wallet), el webhook llama a sendPurchaseEvent()
 * para que Meta pueda atribuir la compra igualmente.
 *
 * Deduplicación: usa el mismo event_id 'purchase_{orderId}' que el pixel
 * del navegador → Meta descarta el duplicado automáticamente.
 *
 * Referencia: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Variables de entorno requeridas:
 *   META_PIXEL_ID      — ID del pixel (número, sin prefijo)
 *   META_CAPI_TOKEN    — Token de acceso de Conversions API (generado en Events Manager)
 *
 * Si alguna falta, el módulo NO lanza errores: simplemente no envía nada.
 */

'use strict';

const crypto = require('crypto');
const axios  = require('axios');

const GRAPH_URL = 'https://graph.facebook.com/v19.0';

/** SHA-256 del valor normalizado, hex lowercase. Devuelve null si val está vacío. */
function sha256(val) {
  if (!val) return null;
  const normalized = String(val).toLowerCase().trim();
  if (!normalized) return null;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/** Normaliza un número de teléfono a dígitos puros con código de país (Argentina = 54). */
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  return digits.startsWith('54') ? digits : `54${digits}`;
}

/**
 * Envía un evento Purchase a la Conversions API de Meta.
 *
 * @param {object} opts
 * @param {string}  opts.orderId           — UUID de la orden (para event_id y dedup con pixel)
 * @param {number}  opts.value             — Monto total de la compra
 * @param {string}  [opts.currency]        — 'ARS' por defecto
 * @param {string}  [opts.userEmail]       — Email del comprador (se hashea con SHA-256)
 * @param {string}  [opts.userPhone]       — Teléfono del comprador (se hashea con SHA-256)
 * @param {string}  [opts.fbclid]          — fbclid capturado del parámetro de URL del ad
 * @param {string}  [opts.userAgent]       — User-Agent del navegador del cliente
 * @param {string}  [opts.clientIpAddress] — IP del cliente
 * @param {string}  [opts.sourceUrl]       — URL donde ocurrió la conversión
 */
async function sendPurchaseEvent({
  orderId,
  value,
  currency = 'ARS',
  userEmail,
  userPhone,
  fbclid,
  userAgent,
  clientIpAddress,
  sourceUrl,
}) {
  const pixelId = (process.env.META_PIXEL_ID  || '').trim();
  const token   = (process.env.META_CAPI_TOKEN || '').trim();

  if (!pixelId || !token) {
    // No configurado → silencio total. No es un error de negocio.
    return;
  }

  if (!orderId || !value || Number(value) <= 0) {
    console.warn('[CAPI] sendPurchaseEvent: orderId o value inválidos, saltando');
    return;
  }

  const eventTime = Math.floor(Date.now() / 1000);

  // user_data: solo campos disponibles y hasheados
  const userData = {};
  const hashedEmail = sha256(userEmail);
  if (hashedEmail) userData.em = hashedEmail;
  const hashedPhone = sha256(normalizePhone(userPhone));
  if (hashedPhone) userData.ph = hashedPhone;
  if (userAgent)       userData.client_user_agent = String(userAgent);
  if (clientIpAddress) userData.client_ip_address  = String(clientIpAddress);
  // fbc: formato estándar que Meta espera cuando viene de fbclid
  if (fbclid) userData.fbc = `fb.1.${Date.now()}.${fbclid}`;

  const event = {
    event_name:       'Purchase',
    event_time:       eventTime,
    event_id:         `purchase_${orderId}`,
    action_source:    'website',
    user_data:        userData,
    custom_data: {
      value:    Number(value),
      currency: String(currency),
      order_id: String(orderId),
    },
  };
  if (sourceUrl) event.event_source_url = String(sourceUrl);

  const payload = { data: [event] };

  try {
    const url = `${GRAPH_URL}/${pixelId}/events?access_token=${token}`;
    const response = await axios.post(url, payload, { timeout: 8000 });
    console.log(`[CAPI] Purchase enviado para orden ${orderId}:`, response.data);
  } catch (err) {
    // Loguear pero NUNCA propagar: CAPI es additive, no debe romper el flujo principal.
    const detail = err?.response?.data || err?.message || err;
    console.error(`[CAPI] Error al enviar Purchase para orden ${orderId}:`, detail);
  }
}

module.exports = { sendPurchaseEvent };
