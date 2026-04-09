const express = require('express');
const axios = require('axios');
const { supabase } = require('../lib/supabase');
const { sendPaymentConfirmationEmail } = require('../services/email');

const router = express.Router();

function isProduction() {
  const env = (process.env.NAVE_ENV || 'testing').toLowerCase();
  return env === 'production' || env === 'prod';
}
function getAuthUrl() {
  return isProduction()
    ? 'https://services.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate'
    : 'https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate';
}
function getApiBaseUrl() {
  return isProduction() ? 'https://api.ranty.io' : 'https://api-sandbox.ranty.io';
}
function getCheckoutBaseUrl() {
  return isProduction() ? 'https://ecommerce.ranty.io' : 'https://sandbox-ecommerce.ranty.io';
}

let cachedToken = null;
let tokenExpiresAt = 0;

function clearNaveTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

async function getNaveToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const clientId = (process.env.NAVE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.NAVE_CLIENT_SECRET || '').trim();
  const audience = (process.env.NAVE_AUDIENCE || '').trim();

  if (!clientId || !clientSecret) throw new Error('NAVE_CLIENT_ID y NAVE_CLIENT_SECRET son requeridos');

  const body = { client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' };
  if (audience) body.audience = audience;

  let data;
  try {
    ({ data } = await axios.post(getAuthUrl(), body, { headers: { 'Content-Type': 'application/json' } }));
  } catch (err) {
    console.error('[Nave] Error obteniendo token M2M:', {
      status: err.response?.status, authUrl: getAuthUrl(),
      naveEnv: (process.env.NAVE_ENV || 'testing').toLowerCase(),
      hasAudience: Boolean(audience), detail: err.response?.data || err.message,
    });
    throw err;
  }

  console.log('[Nave] Auth response:', {
    token_type: data?.token_type, expires_in: data?.expires_in, scope: data?.scope,
    access_token_preview: data?.access_token ? `${String(data.access_token).slice(0, 12)}...` : null,
  });

  cachedToken = data.access_token;
  const expiresIn = parseInt(data.expires_in, 10) || 86400;
  tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;
  console.log('[Nave] Token obtenido, expira en', expiresIn, 's');
  return cachedToken;
}

function toDecimalString(num) { return Number(num).toFixed(2); }

function getPaymentRequestDurationPayload() {
  const raw = (process.env.NAVE_PAYMENT_DURATION_SECS || '').trim();
  if (raw.toLowerCase() === 'omit') return {};
  if (raw) { const n = parseInt(raw, 10); if (!Number.isNaN(n) && n > 0) return { duration_time: n }; }
  return { duration_time: 600 };
}

// ── Routes ────────────────────────────────────────────────────────────────

router.get('/nave/test-auth', async (_req, res) => {
  try {
    const token = await getNaveToken();
    return res.json({ ok: true, access_token_preview: token ? `${token.slice(0, 12)}...` : null });
  } catch (error) {
    return res.status(error.response?.status || 500).json({ ok: false, error: error.response?.data || error.message });
  }
});

/**
 * POST /api/nave/create-payment
 * Crea la orden en Supabase + intención de pago en Nave.
 * Incluye campos de cotización de envío (Correo Argentino / Gestionar).
 */
router.post('/nave/create-payment', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const posId = (process.env.NAVE_POS_ID || '').trim();
  if (!posId) return res.status(500).json({ error: 'NAVE_POS_ID no configurado en el servidor' });

  const {
    customer_name, customer_email, customer_phone,
    customer_doc_type, customer_doc_number,
    shipping_address_line1, shipping_address_line2,
    shipping_city, shipping_state, shipping_postal_code,
    shipping_country, shipping_notes, shipping_method, shipping_cost,
    items, callback_url,
    // ── Campos de cotización de envío ──
    shipping_provider, shipping_mode, shipping_service_type,
    shipping_is_free, shipping_agency_code, shipping_agency_name,
    shipping_customer_id, shipping_quote_payload, shipping_quote_response,
  } = req.body || {};

  const name = (customer_name || '').trim();
  const email = (customer_email || '').trim();
  if (!name || !email) return res.status(400).json({ error: 'Nombre y email son obligatorios' });

  const shippingProvider = (shipping_provider || '').trim();
  const shippingMode = (shipping_mode || '').trim();
  const shippingServiceType = (shipping_service_type || '').trim();
  const hasShippingPayload = Boolean(shipping_quote_payload && typeof shipping_quote_payload === 'object');
  const hasShippingResponse = Boolean(shipping_quote_response && typeof shipping_quote_response === 'object');
  const shippingCostNum = Number(shipping_cost);

  if (!shippingProvider || !shippingMode || !shippingServiceType || !hasShippingPayload || !hasShippingResponse) {
    return res.status(400).json({ error: 'Faltan datos de envío obligatorios para crear el pago en Nave' });
  }
  if (!Number.isFinite(shippingCostNum) || shippingCostNum < 0) {
    return res.status(400).json({ error: 'shipping_cost inválido' });
  }

  const cleanItems = (Array.isArray(items) ? items : [])
    .filter((i) => i && i.product_id && Number(i.quantity) > 0)
    .map((i) => ({
      product_id: i.product_id,
      quantity: Math.max(1, Math.floor(Number(i.quantity))),
      unit_price: Number(i.unit_price) || 0,
      name: i.name || 'Producto',
      description: i.description || '',
    }));
  if (cleanItems.length === 0) return res.status(400).json({ error: 'El carrito está vacío' });

  const subtotal = cleanItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const shipping = shippingCostNum;
  const orderTotal = subtotal + shipping;

  try {
    // ── 1. Crear orden en Supabase ──
    const orderPayload = {
      user_id: null, status: 'pending_payment', currency: 'ARS',
      total: orderTotal, channel: 'retail',
      customer_name: name, customer_email: email,
      customer_phone: (customer_phone || '').trim() || null,
      shipping_address_line1: (shipping_address_line1 || '').trim() || null,
      shipping_address_line2: (shipping_address_line2 || '').trim() || null,
      shipping_city: (shipping_city || '').trim() || null,
      shipping_state: (shipping_state || '').trim() || null,
      shipping_postal_code: (shipping_postal_code || '').trim() || null,
      shipping_country: (shipping_country || '').trim() || 'AR',
      shipping_notes: (shipping_notes || '').trim() || null,
      shipping_method: (shipping_method || '').trim() || 'standard',
      shipping_cost: shipping,
      payment_method: 'nave',
      // ── Proveedor de envío cotizado ──
      shipping_provider: (shipping_provider || '').trim() || null,
      shipping_mode: (shipping_mode || '').trim() || null,
      shipping_service_type: (shipping_service_type || '').trim() || null,
      shipping_is_free: shipping_is_free === true || shipping_is_free === 'true' || false,
      shipping_agency_code: (shipping_agency_code || '').trim() || null,
      shipping_agency_name: (shipping_agency_name || '').trim() || null,
      shipping_customer_id: (shipping_customer_id || '').trim() || null,
      shipping_quote_payload: shipping_quote_payload || null,
      shipping_quote_response: shipping_quote_response || null,
    };

    const { data: order, error: orderErr } = await supabase
      .from('orders').insert(orderPayload)
      .select('id, status, total, currency, created_at').single();
    if (orderErr) { console.error('[Nave] Error creando orden:', orderErr); return res.status(500).json({ error: 'Error al crear la orden' }); }

    const rows = cleanItems.map((i) => ({ order_id: order.id, product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price }));
    const { error: itemsErr } = await supabase.from('order_items').insert(rows);
    if (itemsErr) console.error('[Nave] Error guardando items:', itemsErr);

    // ── 2. Token Nave ──
    const token = await getNaveToken();

    // ── 3. Crear intención de pago ──
    const naveBody = {
      external_payment_id: order.id.slice(0, 36),
      seller: { pos_id: posId },
      transactions: [{
        amount: { currency: 'ARS', value: toDecimalString(orderTotal) },
        products: cleanItems.map((i) => ({
          name: i.name, description: i.description || i.name, quantity: i.quantity,
          unit_price: { currency: 'ARS', value: toDecimalString(i.unit_price) },
        })),
      }],
      buyer: {
        doc_type: customer_doc_type || 'DNI', doc_number: customer_doc_number || '00000000',
        name, user_email: email, user_id: email,
        billing_address: {
          street_1: (shipping_address_line1 || '').trim() || 'N/A',
          street_2: (shipping_address_line2 || '').trim() || 'N/A',
          city: (shipping_city || '').trim() || 'N/A', region: (shipping_state || '').trim() || 'N/A',
          country: (shipping_country || '').trim() || 'AR', zipcode: (shipping_postal_code || '').trim() || '0000',
        },
      },
      additional_info: { callback_url: callback_url ? callback_url.replace('PLACEHOLDER', order.id) : undefined },
      ...getPaymentRequestDurationPayload(),
    };

    const apiBase = getApiBaseUrl();
    console.log('[Nave] create-payment duration_time:', naveBody.duration_time ?? '(omitido)');

    const postPaymentRequest = (bearer) =>
      axios.post(`${apiBase}/api/payment_request/ecommerce`, naveBody, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bearer}` },
      });

    let navePayment;
    try {
      ({ data: navePayment } = await postPaymentRequest(token));
    } catch (firstErr) {
      if (firstErr.response?.status === 401) {
        console.warn('[Nave] create-payment 401, reintentando con token fresco');
        clearNaveTokenCache();
        const fresh = await getNaveToken();
        ({ data: navePayment } = await postPaymentRequest(fresh));
      } else { throw firstErr; }
    }

    console.log('[Nave] Payment request creado:', navePayment.id);

    // ── 4. Actualizar orden con referencias Nave ──
    await supabase.from('orders').update({
      nave_payment_request_id: navePayment.id,
      nave_checkout_url: navePayment.checkout_url,
    }).eq('id', order.id);

    return res.status(201).json({
      order_id: order.id,
      payment_request_id: navePayment.id,
      checkout_url: navePayment.checkout_url,
      qr_data: navePayment.qr_data,
    });
  } catch (error) {
    console.error('[Nave] create-payment error:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message || 'Error al crear el pago',
    });
  }
});

// ── Webhook ───────────────────────────────────────────────────────────────

/** Normaliza el body del POST (Nave doc: payment_id, external_payment_id; algunos envíos usan camelCase o wrapper). */
function parseNaveWebhookPayload(body) {
  const root = body && typeof body === 'object' ? (body.data && typeof body.data === 'object' ? body.data : body) : {};
  const payment_id = root.payment_id || root.paymentId;
  const external_payment_id = root.external_payment_id || root.externalPaymentId;
  return { payment_id, external_payment_id };
}

function buildNaveOrderUpdate(payment, paymentId, orderStatus) {
  const pm = payment?.payment_method || {};
  const inst = pm?.installment_plan || {};
  const reason = payment?.status?.reason_code || payment?.status?.reason_name || null;
  const installments = inst?.installments;
  const row = {
    status: orderStatus, nave_payment_id: paymentId,
    nave_payment_code: payment?.payment_code ?? null,
    nave_card_brand: pm.card_brand ?? null, nave_card_type: pm.card_type ?? null,
    nave_card_last4: pm.card_last4 ?? null, nave_card_issuer: pm.issuer ?? null,
    nave_installments: installments != null && Number.isFinite(Number(installments)) ? Number(installments) : null,
    nave_installments_name: inst?.name ?? null, nave_status_reason: reason,
  };
  if (orderStatus === 'paid') {
    row.nave_paid_at = payment?.updated_date || payment?.creation_date || new Date().toISOString();
  }
  return row;
}

async function handleNaveWebhook(req, res) {
  console.log('[Nave Webhook] Request recibido:', {
    path: req.originalUrl || req.path,
    headers: { 'content-type': req.headers['content-type'], 'user-agent': req.headers['user-agent'] },
    rawLength: req.naveWebhookRawLength,
    jsonError: req.naveWebhookJsonError || null,
    body: req.body,
  });

  res.sendStatus(200);

  const { payment_id, external_payment_id } = parseNaveWebhookPayload(req.body);
  if (!payment_id || !external_payment_id) {
    console.warn('[Nave Webhook] Payload incompleto — campos esperados: payment_id, external_payment_id (o paymentId / externalPaymentId). Revisá notification_url en Nave (prod vs sandbox) y que apunte a este servidor (ej. …/webhooks/nave o …/api/nave/webhook).');
    return;
  }
  if (!supabase) { console.error('[Nave Webhook] Supabase no configurado'); return; }

  console.log('[Nave Webhook] Procesando:', { payment_id, external_payment_id });

  try {
    const token = await getNaveToken();
    const apiBase = getApiBaseUrl();

    const { data: payment } = await axios.get(
      `${apiBase}/ranty-payments/payments/${payment_id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const naveStatus = (payment?.status?.name || '').toUpperCase();
    let orderStatus;
    switch (naveStatus) {
      case 'APPROVED': orderStatus = 'paid'; break;
      case 'REJECTED': orderStatus = 'payment_failed'; break;
      case 'CANCELLED': orderStatus = 'cancelled'; break;
      case 'REFUNDED': orderStatus = 'refunded'; break;
      case 'CHARGED_BACK': orderStatus = 'chargeback'; break;
      default: orderStatus = `nave_${(naveStatus || 'unknown').toLowerCase()}`;
    }

    const { data: prevOrder, error: prevErr } = await supabase
      .from('orders')
      .select('id, status, customer_email, customer_name, total, currency, payment_confirmation_email_sent_at')
      .eq('id', external_payment_id).maybeSingle();

    if (prevErr || !prevOrder) { console.error('[Nave Webhook] Orden no encontrada:', external_payment_id, prevErr); return; }

    const { error } = await supabase.from('orders').update(buildNaveOrderUpdate(payment, payment_id, orderStatus)).eq('id', external_payment_id);
    if (error) { console.error('[Nave Webhook] Error actualizando orden:', error); return; }

    console.log(`[Nave Webhook] Orden ${external_payment_id} → ${orderStatus}`);

    if (orderStatus === 'paid' && !prevOrder.payment_confirmation_email_sent_at) {
      const to = (prevOrder.customer_email || '').trim() || (payment?.buyer?.user_email || '').trim();
      if (!to) { console.warn('[Nave Webhook] Pago aprobado sin email:', external_payment_id); return; }

      const { data: rawItems } = await supabase.from('order_items').select('product_id, quantity, unit_price').eq('order_id', external_payment_id);
      let itemsForEmail = rawItems || [];
      const pids = [...new Set(itemsForEmail.map((i) => i.product_id))];
      if (pids.length > 0) {
        const { data: products } = await supabase.from('products').select('id, name').in('id', pids);
        const nameById = Object.fromEntries((products || []).map((p) => [p.id, p.name]));
        itemsForEmail = itemsForEmail.map((i) => ({ ...i, product_name: nameById[i.product_id] || null }));
      }

      const sent = await sendPaymentConfirmationEmail({ to, order: prevOrder, items: itemsForEmail, payment });
      if (sent) {
        const { error: markErr } = await supabase.from('orders').update({ payment_confirmation_email_sent_at: new Date().toISOString() }).eq('id', external_payment_id);
        if (markErr) console.error('[Nave Webhook] Falló marcar payment_confirmation_email_sent_at:', markErr);
        else console.log('[Nave Webhook] Email de pago confirmado enviado a:', to);
      }
    }
  } catch (err) {
    console.error('[Nave Webhook] Error procesando:', err.response?.data || err.message);
  }
}

router.post('/nave/webhook', handleNaveWebhook);

router.handleNaveWebhook = handleNaveWebhook;
router.getNaveToken = getNaveToken;
router.getNaveApiBaseUrl = getApiBaseUrl;

router.get('/nave/payment-status/:orderId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });
  const { orderId } = req.params;
  try {
    const { data: order, error: orderErr } = await supabase.from('orders')
      .select('id, status, nave_payment_request_id, nave_payment_id').eq('id', orderId).single();
    if (orderErr || !order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (!order.nave_payment_request_id) return res.json({ order_id: order.id, order_status: order.status, nave_status: null });

    const token = await getNaveToken();
    const { data: paymentRequest } = await axios.get(
      `${getApiBaseUrl()}/api/payment_requests/${order.nave_payment_request_id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return res.json({
      order_id: order.id, order_status: order.status,
      nave_status: paymentRequest?.status?.name || null,
      payment_attempts: paymentRequest?.payment_attempts || [],
    });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message || 'Error consultando estado',
    });
  }
});

module.exports = router;