/**
 * Meta Conversions API (CAPI) — server-side events.
 *
 * Complementa el pixel de navegador. Es la fuente PRIMARIA y confiable del
 * evento Purchase: el pixel de navegador se pierde con frecuencia (iOS ITP,
 * ad-blockers, usuario que no vuelve al sitio tras pagar en MP). El webhook
 * de Mercado Pago dispara este evento siempre que la orden quede `paid`.
 *
 * Deduplicación: usa el mismo event_id 'purchase_{orderId}' que el pixel
 * del navegador → Meta descarta el duplicado automáticamente.
 *
 * Referencia: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Variables de entorno requeridas:
 *   META_PIXEL_ID      — ID del pixel (número, sin prefijo)
 *   META_CAPI_TOKEN    — Token de acceso de Conversions API (Events Manager)
 *   META_TEST_EVENT_CODE — (opcional) código de Test Events para depurar
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
 * Construye el valor `fbc` que Meta espera.
 * Si ya viene un fbc completo (formato fb.1.<ts>.<fbclid>) se usa tal cual.
 * Si solo hay fbclid, se reconstruye usando el timestamp del click (fbclidTs)
 * para que coincida con el `_fbc` que generó el navegador.
 */
function buildFbc({ fbc, fbclid, fbclidTs }) {
  if (fbc && String(fbc).startsWith('fb.')) return String(fbc);
  if (!fbclid) return null;
  const ts = Number(fbclidTs) > 0 ? Number(fbclidTs) : Date.now();
  return `fb.1.${ts}.${fbclid}`;
}

/**
 * Envía un evento Purchase a la Conversions API de Meta.
 *
 * @param {object} opts
 * @param {string}  opts.orderId           — UUID de la orden (event_id y dedup con pixel)
 * @param {number}  opts.value             — Monto total de la compra
 * @param {string}  [opts.currency]        — 'ARS' por defecto
 * @param {string}  [opts.userEmail]       — Email del comprador (se hashea SHA-256)
 * @param {string}  [opts.userPhone]       — Teléfono del comprador (se hashea SHA-256)
 * @param {string}  [opts.userName]        — Nombre completo (se separa y hashea fn/ln)
 * @param {string}  [opts.fbp]             — Cookie _fbp capturada en el navegador
 * @param {string}  [opts.fbc]             — Cookie _fbc capturada en el navegador
 * @param {string}  [opts.fbclid]          — fbclid del anuncio (fallback para fbc)
 * @param {number}  [opts.fbclidTs]        — timestamp del click del anuncio
 * @param {string}  [opts.userAgent]       — User-Agent del navegador del comprador
 * @param {string}  [opts.clientIpAddress] — IP del comprador
 * @param {string}  [opts.sourceUrl]       — URL donde ocurrió la conversión
 * @param {number}  [opts.eventTime]       — epoch (s) del pago real; default ahora
 * @returns {Promise<boolean>} true si Meta aceptó el evento
 */
async function sendPurchaseEvent({
  orderId,
  value,
  currency = 'ARS',
  userEmail,
  userPhone,
  userName,
  fbp,
  fbc,
  fbclid,
  fbclidTs,
  userAgent,
  clientIpAddress,
  sourceUrl,
  eventTime,
}) {
  const pixelId = (process.env.META_PIXEL_ID  || '').trim();
  const token   = (process.env.META_CAPI_TOKEN || '').trim();

  if (!pixelId || !token) {
    // No configurado → silencio total. No es un error de negocio.
    return false;
  }

  if (!orderId || !value || Number(value) <= 0) {
    console.warn('[CAPI] sendPurchaseEvent: orderId o value inválidos, saltando');
    return false;
  }

  // event_time: el del pago real si lo conocemos. Si el webhook llega tarde
  // (reintento de MP), esto evita reportar la compra con la hora equivocada.
  let evtTime = Number(eventTime);
  if (!Number.isFinite(evtTime) || evtTime <= 0) {
    evtTime = Math.floor(Date.now() / 1000);
  }

  // ── user_data: cuanto más completo, mejor match quality y menos drops ──
  const userData = {};
  const hashedEmail = sha256(userEmail);
  if (hashedEmail) userData.em = hashedEmail;
  const hashedPhone = sha256(normalizePhone(userPhone));
  if (hashedPhone) userData.ph = hashedPhone;

  if (userName) {
    const parts = String(userName).trim().split(/\s+/).filter(Boolean);
    if (parts.length > 0) {
      const fn = sha256(parts[0]);
      if (fn) userData.fn = fn;
      if (parts.length > 1) {
        const ln = sha256(parts[parts.length - 1]);
        if (ln) userData.ln = ln;
      }
    }
  }

  if (fbp) userData.fbp = String(fbp);
  const resolvedFbc = buildFbc({ fbc, fbclid, fbclidTs });
  if (resolvedFbc) userData.fbc = resolvedFbc;
  if (userAgent)       userData.client_user_agent = String(userAgent);
  if (clientIpAddress) userData.client_ip_address  = String(clientIpAddress);

  const event = {
    event_name:    'Purchase',
    event_time:    evtTime,
    event_id:      `purchase_${orderId}`,
    action_source: 'website',
    user_data:     userData,
    custom_data: {
      value:    Number(value),
      currency: String(currency),
      order_id: String(orderId),
    },
  };
  if (sourceUrl) event.event_source_url = String(sourceUrl);

  const payload = { data: [event] };
  const testCode = (process.env.META_TEST_EVENT_CODE || '').trim();
  if (testCode) payload.test_event_code = testCode;

  try {
    const url = `${GRAPH_URL}/${pixelId}/events?access_token=${token}`;
    const response = await axios.post(url, payload, { timeout: 8000 });
    const received = response?.data?.events_received;
    console.log(`[CAPI] Purchase enviado para orden ${orderId} (events_received=${received})`);
    return true;
  } catch (err) {
    // Loguear pero NUNCA propagar: CAPI es additive, no debe romper el flujo.
    const detail = err?.response?.data || err?.message || err;
    console.error(`[CAPI] Error al enviar Purchase para orden ${orderId}:`, detail);
    return false;
  }
}

module.exports = { sendPurchaseEvent };
