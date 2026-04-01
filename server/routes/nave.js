const express = require('express');
const axios = require('axios');
const { supabase } = require('../lib/supabase');

const router = express.Router();

// ── Environment-aware URL helpers ─────────────────────────────────────────

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
  return isProduction()
    ? 'https://api.ranty.io'
    : 'https://api-sandbox.ranty.io';
}

function getCheckoutBaseUrl() {
  return isProduction()
    ? 'https://ecommerce.ranty.io'
    : 'https://sandbox-ecommerce.ranty.io';
}

// ── Token cache (M2M) ────────────────────────────────────────────────────

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

  if (!clientId || !clientSecret) {
    throw new Error('NAVE_CLIENT_ID y NAVE_CLIENT_SECRET son requeridos');
  }

  const body = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  };
  if (audience) body.audience = audience;

  let data;
  try {
    ({ data } = await axios.post(getAuthUrl(), body, {
      headers: { 'Content-Type': 'application/json' },
    }));
  } catch (err) {
    const st = err.response?.status;
    const authErr = err.response?.data;
    console.error('[Nave] Error obteniendo token M2M:', {
      status: st,
      authUrl: getAuthUrl(),
      naveEnv: (process.env.NAVE_ENV || 'testing').toLowerCase(),
      hasAudience: Boolean(audience),
      detail: authErr || err.message,
    });
    throw err;
  }

  // Avoid logging full credentials/tokens
  console.log('[Nave] Auth response:', {
    token_type: data?.token_type,
    expires_in: data?.expires_in,
    scope: data?.scope,
    access_token_preview: data?.access_token
      ? `${String(data.access_token).slice(0, 12)}...`
      : null,
  });

  cachedToken = data.access_token;
  const expiresIn = parseInt(data.expires_in, 10) || 86400;
  tokenExpiresAt = Date.now() + (expiresIn - 60) * 1000;

  console.log('[Nave] Token obtenido, expira en', expiresIn, 's');
  return cachedToken;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function toDecimalString(num) {
  return Number(num).toFixed(2);
}

/**
 * `duration_time` en el alta de la intención de pago (Nave documenta segundos).
 * Override: NAVE_PAYMENT_DURATION_SECS=número | omit (no enviar el campo).
 */
function getPaymentRequestDurationPayload() {
  const raw = (process.env.NAVE_PAYMENT_DURATION_SECS || '').trim();
  if (raw.toLowerCase() === 'omit') {
    return {};
  }
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) {
      return { duration_time: n };
    }
  }
  return { duration_time: 600 }; // 10 minutos en segundos
}

// ── Routes ────────────────────────────────────────────────────────────────

/**
 * GET /api/nave/test-auth
 * Smoke test for M2M authentication.
 */
router.get('/nave/test-auth', async (_req, res) => {
  try {
    const token = await getNaveToken();
    const preview = token ? `${token.slice(0, 12)}...` : null;
    return res.json({ ok: true, access_token_preview: preview });
  } catch (error) {
    const status = error.response?.status || 500;
    return res.status(status).json({
      ok: false,
      error: error.response?.data || error.message,
    });
  }
});

/**
 * POST /api/nave/create-payment
 *
 * 1. Creates order in Supabase (status: pending_payment)
 * 2. Authenticates with Nave (cached token)
 * 3. Creates a payment request (intención de pago)
 * 4. Updates order with Nave references
 * 5. Returns checkout iframe URL to the frontend
 */
router.post('/nave/create-payment', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Base de datos no configurada' });
  }

  const posId = (process.env.NAVE_POS_ID || '').trim();
  if (!posId) {
    return res.status(500).json({ error: 'NAVE_POS_ID no configurado en el servidor' });
  }

  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_doc_type,
    customer_doc_number,
    shipping_address_line1,
    shipping_address_line2,
    shipping_city,
    shipping_state,
    shipping_postal_code,
    shipping_country,
    shipping_notes,
    shipping_method,
    shipping_cost,
    items,
    callback_url,
  } = req.body || {};

  const name = (customer_name || '').trim();
  const email = (customer_email || '').trim();
  if (!name || !email) {
    return res.status(400).json({ error: 'Nombre y email son obligatorios' });
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

  if (cleanItems.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  const subtotal = cleanItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const shipping = shipping_cost != null ? Number(shipping_cost) : 0;
  const orderTotal = subtotal + shipping;

  try {
    // ── 1. Create order in Supabase ──
    const orderPayload = {
      user_id: null,
      status: 'pending_payment',
      currency: 'ARS',
      total: orderTotal,
      channel: 'retail',
      customer_name: name,
      customer_email: email,
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
    };

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('id, status, total, currency, created_at')
      .single();

    if (orderErr) {
      console.error('[Nave] Error creando orden:', orderErr);
      return res.status(500).json({ error: 'Error al crear la orden' });
    }

    const rows = cleanItems.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));
    const { error: itemsErr } = await supabase.from('order_items').insert(rows);
    if (itemsErr) {
      console.error('[Nave] Error guardando items:', itemsErr);
    }

    // ── 2. Get Nave token ──
    const token = await getNaveToken();

    // ── 3. Create payment request at Nave ──
    const naveBody = {
      external_payment_id: order.id.slice(0, 36),
      seller: { pos_id: posId },
      transactions: [
        {
          amount: { currency: 'ARS', value: toDecimalString(orderTotal) },
          products: cleanItems.map((i) => ({
            name: i.name,
            description: i.description || i.name,
            quantity: i.quantity,
            unit_price: { currency: 'ARS', value: toDecimalString(i.unit_price) },
          })),
        },
      ],
      buyer: {
        doc_type: customer_doc_type || 'DNI',
        doc_number: customer_doc_number || '00000000',
        name,
        user_email: email,
        user_id: email,
        billing_address: {
          street_1: (shipping_address_line1 || '').trim() || 'N/A',
          street_2: (shipping_address_line2 || '').trim() || 'N/A',
          city: (shipping_city || '').trim() || 'N/A',
          region: (shipping_state || '').trim() || 'N/A',
          country: (shipping_country || '').trim() || 'AR',
          zipcode: (shipping_postal_code || '').trim() || '0000',
        },
      },
      additional_info: {
        callback_url: callback_url
          ? callback_url.replace('PLACEHOLDER', order.id)
          : undefined,
      },
      ...getPaymentRequestDurationPayload(),
    };

    const apiBase = getApiBaseUrl();
    console.log('[Nave] create-payment duration_time:', naveBody.duration_time ?? '(omitido)');

    const postPaymentRequest = (bearer) =>
      axios.post(`${apiBase}/api/payment_request/ecommerce`, naveBody, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bearer}`,
        },
      });

    let navePayment;
    try {
      ({ data: navePayment } = await postPaymentRequest(token));
    } catch (firstErr) {
      if (firstErr.response?.status === 401) {
        console.warn('[Nave] create-payment 401, limpiando token en caché y reintentando una vez');
        clearNaveTokenCache();
        const fresh = await getNaveToken();
        ({ data: navePayment } = await postPaymentRequest(fresh));
      } else {
        throw firstErr;
      }
    }

    console.log('[Nave] Payment request creado:', navePayment.id);

    // ── 4. Update order with Nave references ──
    await supabase
      .from('orders')
      .update({
        nave_payment_request_id: navePayment.id,
        nave_checkout_url: navePayment.checkout_url,
      })
      .eq('id', order.id);

    return res.status(201).json({
      order_id: order.id,
      payment_request_id: navePayment.id,
      checkout_url: navePayment.checkout_url,
      qr_data: navePayment.qr_data,
    });
  } catch (error) {
    console.error('[Nave] create-payment error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: error.response?.data?.message || error.message || 'Error al crear el pago',
    });
  }
});

/**
 * POST /api/nave/webhook
 * Receives async payment notifications from Nave.
 * Must respond 200 immediately; processing happens after.
 */
router.post('/nave/webhook', async (req, res) => {
  res.sendStatus(200);

  const { payment_id, external_payment_id } = req.body || {};
  if (!payment_id || !external_payment_id) {
    console.warn('[Nave Webhook] Payload incompleto:', req.body);
    return;
  }

  console.log('[Nave Webhook] Notificación recibida:', { payment_id, external_payment_id });

  try {
    const token = await getNaveToken();
    const apiBase = getApiBaseUrl();

    const { data: payment } = await axios.get(
      `${apiBase}/ranty-payments/payments/${payment_id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const naveStatus = payment?.status?.name;
    let orderStatus;
    switch (naveStatus) {
      case 'APPROVED':
        orderStatus = 'paid';
        break;
      case 'REJECTED':
        orderStatus = 'payment_failed';
        break;
      case 'CANCELLED':
      case 'REFUNDED':
        orderStatus = 'cancelled';
        break;
      case 'CHARGED_BACK':
        orderStatus = 'chargeback';
        break;
      default:
        orderStatus = `nave_${(naveStatus || 'unknown').toLowerCase()}`;
    }

    const { error } = await supabase
      .from('orders')
      .update({ status: orderStatus, nave_payment_id: payment_id })
      .eq('id', external_payment_id);

    if (error) {
      console.error('[Nave Webhook] Error actualizando orden:', error);
    } else {
      console.log(`[Nave Webhook] Orden ${external_payment_id} → ${orderStatus}`);
    }
  } catch (err) {
    console.error('[Nave Webhook] Error procesando:', err.response?.data || err.message);
  }
});

/**
 * GET /api/nave/payment-status/:orderId
 * Queries Nave for current payment request status (fallback if webhook fails).
 */
router.get('/nave/payment-status/:orderId', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Base de datos no configurada' });
  }

  const { orderId } = req.params;

  try {
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, status, nave_payment_request_id, nave_payment_id')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    if (!order.nave_payment_request_id) {
      return res.json({ order_id: order.id, order_status: order.status, nave_status: null });
    }

    const token = await getNaveToken();
    const apiBase = getApiBaseUrl();

    const { data: paymentRequest } = await axios.get(
      `${apiBase}/api/payment_requests/${order.nave_payment_request_id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return res.json({
      order_id: order.id,
      order_status: order.status,
      nave_status: paymentRequest?.status?.name || null,
      payment_attempts: paymentRequest?.payment_attempts || [],
    });
  } catch (error) {
    console.error('[Nave] payment-status error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      error: error.response?.data?.message || error.message || 'Error consultando estado',
    });
  }
});

module.exports = router;
