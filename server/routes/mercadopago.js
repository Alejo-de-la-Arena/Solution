const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { supabase } = require('../lib/supabase');
const { sendPaymentConfirmationEmail } = require('../services/email');

const router = express.Router();
const MP_API = 'https://api.mercadopago.com';

function toDecimalString(num) {
  return Number(num).toFixed(2);
}

function getAccessToken() {
  const t = (process.env.MP_ACCESS_TOKEN || '').trim();
  if (!t) throw new Error('MP_ACCESS_TOKEN no configurado');
  return t;
}

function extractFirstPayment(mpOrder) {
  const payments = mpOrder?.transactions?.payments;
  return Array.isArray(payments) && payments[0] ? payments[0] : null;
}

/** Map MP Orders API response fields into our orders columns */
function mpOrderToMpColumns(mpOrder) {
  const pay = extractFirstPayment(mpOrder);
  const pm = pay?.payment_method || {};
  const row = {
    mp_order_id: mpOrder?.id || null,
    mp_payment_id: pay?.id || null,
    mp_status: mpOrder?.status || pay?.status || null,
    mp_status_detail: mpOrder?.status_detail || pay?.status_detail || null,
    mp_card_brand: pm.id || null,
    mp_card_last4: pm.last_four_digits || null,
    mp_installments: pm.installments != null && Number.isFinite(Number(pm.installments))
      ? Number(pm.installments)
      : null,
  };
  const paid =
    (mpOrder?.status === 'processed' && mpOrder?.status_detail === 'accredited')
    || (pay?.status === 'processed' && pay?.status_detail === 'accredited');
  if (paid) {
    row.mp_paid_at = mpOrder?.last_updated_date || mpOrder?.created_date || new Date().toISOString();
  }
  return row;
}

/** Derive internal orders.status from MP order payload */
function deriveOrderStatus(mpOrder) {
  const oStatus = (mpOrder?.status || '').toLowerCase();
  const oDetail = (mpOrder?.status_detail || '').toLowerCase();
  const pay = extractFirstPayment(mpOrder);
  const pStatus = (pay?.status || '').toLowerCase();
  const pDetail = (pay?.status_detail || '').toLowerCase();

  if (oStatus === 'processed' && oDetail === 'accredited') return 'paid';
  if (pStatus === 'processed' && pDetail === 'accredited') return 'paid';
  if (oStatus === 'failed' || pStatus === 'failed') return 'payment_failed';
  return 'pending_payment';
}

function buildSyntheticPaymentForEmail(mpOrder) {
  const pay = extractFirstPayment(mpOrder);
  const pm = pay?.payment_method || {};
  return {
    payment_code: pay?.id || mpOrder?.id || null,
    payment_method: {
      card_brand: pm.id,
      card_type: pm.type,
      card_last4: pm.last_four_digits,
      installment_plan: {
        installments: pm.installments,
        name: null,
      },
    },
  };
}

/**
 * Validate Mercado Pago webhook x-signature (HMAC-SHA256).
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integration/notifications/webhooks
 */
function verifyWebhookSignature({ secret, xSignature, xRequestId, dataId }) {
  if (!secret) return true;
  if (!xSignature || !xRequestId || !dataId) return false;

  let ts;
  let v1;
  String(xSignature).split(',').forEach((part) => {
    const [key, ...rest] = part.split('=');
    const value = rest.join('=').trim();
    const k = (key || '').trim();
    if (k === 'ts') ts = value;
    if (k === 'v1') v1 = value;
  });
  if (!ts || !v1) return false;

  const dataIdLower = String(dataId).toLowerCase();
  const manifest = `id:${dataIdLower};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
  } catch {
    return false;
  }
}

async function fetchMpOrder(orderId, accessToken) {
  const { data } = await axios.get(`${MP_API}/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data;
}

async function applyMpOrderToDb(orderRowId, mpOrder, { sendEmailIfPaid }) {
  const mpCols = mpOrderToMpColumns(mpOrder);
  const nextStatus = deriveOrderStatus(mpOrder);
  const update = {
    ...mpCols,
    status: nextStatus,
  };

  const { data: prevOrder, error: prevErr } = await supabase
    .from('orders')
    .select('id, status, customer_email, customer_name, total, currency, payment_confirmation_email_sent_at, payment_method')
    .eq('id', orderRowId)
    .maybeSingle();

  if (prevErr || !prevOrder) {
    console.error('[MP] applyMpOrderToDb: orden no encontrada', orderRowId, prevErr);
    return;
  }

  const { error } = await supabase.from('orders').update(update).eq('id', orderRowId);
  if (error) {
    console.error('[MP] applyMpOrderToDb: error update', error);
    return;
  }

  console.log(`[MP] Orden ${orderRowId} → ${nextStatus} (mp ${mpOrder?.id})`);

  if (sendEmailIfPaid && nextStatus === 'paid' && !prevOrder.payment_confirmation_email_sent_at) {
    const to = (prevOrder.customer_email || '').trim();
    if (!to) {
      console.warn('[MP] Pago acreditado sin email:', orderRowId);
      return;
    }

    const { data: rawItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price')
      .eq('order_id', orderRowId);
    let itemsForEmail = rawItems || [];
    const pids = [...new Set(itemsForEmail.map((i) => i.product_id))];
    if (pids.length > 0) {
      const { data: products } = await supabase.from('products').select('id, name').in('id', pids);
      const nameById = Object.fromEntries((products || []).map((p) => [p.id, p.name]));
      itemsForEmail = itemsForEmail.map((i) => ({
        ...i,
        product_name: nameById[i.product_id] || null,
      }));
    }

    const payment = buildSyntheticPaymentForEmail(mpOrder);
    const sent = await sendPaymentConfirmationEmail({ to, order: prevOrder, items: itemsForEmail, payment });
    if (sent) {
      await supabase
        .from('orders')
        .update({ payment_confirmation_email_sent_at: new Date().toISOString() })
        .eq('id', orderRowId);
    }
  }
}

// ── POST /api/mercadopago/create-order ─────────────────────────────────────

router.post('/mercadopago/create-order', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  let accessToken;
  try {
    accessToken = getAccessToken();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }

  const {
    customer_name, customer_email, customer_phone,
    shipping_address_line1, shipping_address_line2,
    shipping_city, shipping_state, shipping_postal_code,
    shipping_country, shipping_notes, shipping_method, shipping_cost,
    items,
    shipping_provider, shipping_mode, shipping_service_type,
    shipping_is_free, shipping_agency_code, shipping_agency_name,
    shipping_customer_id, shipping_quote_payload, shipping_quote_response,
    mp_payment,
    device_id,
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
    return res.status(400).json({ error: 'Faltan datos de envío obligatorios para crear el pago' });
  }
  if (!Number.isFinite(shippingCostNum) || shippingCostNum < 0) {
    return res.status(400).json({ error: 'shipping_cost inválido' });
  }

  const mp = mp_payment && typeof mp_payment === 'object' ? mp_payment : {};
  const token = (mp.token || '').trim();
  const paymentMethodId = (mp.payment_method_id || mp.id || '').trim();
  const paymentType = (mp.payment_type_id || mp.type || '').trim();
  const installments = Number(mp.installments) || 1;
  const payerEmail = (mp.payer?.email || email).trim();
  const identification = mp.payer?.identification;

  if (!token || !paymentMethodId || !paymentType) {
    return res.status(400).json({ error: 'Faltan datos del Brick de Mercado Pago (token, medio de pago)' });
  }
  if (!payerEmail) return res.status(400).json({ error: 'Email del pagador requerido' });
  if (!identification?.type || !identification?.number) {
    return res.status(400).json({ error: 'Identificación del pagador requerida' });
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
  const totalStr = toDecimalString(orderTotal);

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
    payment_method: 'mercadopago',
    shipping_provider: shippingProvider || null,
    shipping_mode: shippingMode || null,
    shipping_service_type: shippingServiceType || null,
    shipping_is_free: shipping_is_free === true || shipping_is_free === 'true' || false,
    shipping_agency_code: (shipping_agency_code || '').trim() || null,
    shipping_agency_name: (shipping_agency_name || '').trim() || null,
    shipping_customer_id: (shipping_customer_id || '').trim() || null,
    shipping_quote_payload: shipping_quote_payload || null,
    shipping_quote_response: shipping_quote_response || null,
  };

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('id, status, total, currency, created_at')
    .single();
  if (orderErr) {
    console.error('[MP] Error creando orden:', orderErr);
    return res.status(500).json({ error: 'Error al crear la orden' });
  }

  const rows = cleanItems.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));
  const { error: itemsErr } = await supabase.from('order_items').insert(rows);
  if (itemsErr) console.error('[MP] Error guardando items:', itemsErr);

  const idempotencyKey = crypto.randomUUID();
  const mpBody = {
    type: 'online',
    processing_mode: 'automatic',
    external_reference: order.id,
    total_amount: totalStr,
    payer: {
      email: payerEmail,
      identification: {
        type: identification.type,
        number: String(identification.number).replace(/\D/g, '') || String(identification.number),
      },
    },
    transactions: {
      payments: [{
        amount: totalStr,
        payment_method: {
          id: paymentMethodId,
          type: paymentType,
          token,
          installments,
        },
      }],
    },
  };

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'X-Idempotency-Key': idempotencyKey,
  };
  const did = (device_id || '').trim();
  if (did) headers['X-meli-session-id'] = did;

  let mpOrder;
  try {
    ({ data: mpOrder } = await axios.post(`${MP_API}/v1/orders`, mpBody, { headers }));
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error('[MP] POST /v1/orders error:', detail);
    await supabase.from('orders').update({ status: 'payment_failed', mp_status: 'failed', mp_status_detail: 'api_error' }).eq('id', order.id);
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error al procesar el pago';
    return res.status(err.response?.status || 502).json({ error: typeof msg === 'string' ? msg : 'Error al procesar el pago', order_id: order.id });
  }

  const nextStatus = deriveOrderStatus(mpOrder);
  const mpCols = mpOrderToMpColumns(mpOrder);
  await supabase.from('orders').update({ ...mpCols, status: nextStatus }).eq('id', order.id);

  if (nextStatus === 'paid') {
    const { data: prevOrder } = await supabase
      .from('orders')
      .select('id, status, customer_email, customer_name, total, currency, payment_confirmation_email_sent_at')
      .eq('id', order.id)
      .single();

    if (prevOrder && !prevOrder.payment_confirmation_email_sent_at) {
      const to = (prevOrder.customer_email || '').trim();
      if (to) {
        const { data: rawItems } = await supabase
          .from('order_items')
          .select('product_id, quantity, unit_price')
          .eq('order_id', order.id);
        let itemsForEmail = rawItems || [];
        const pids = [...new Set(itemsForEmail.map((i) => i.product_id))];
        if (pids.length > 0) {
          const { data: products } = await supabase.from('products').select('id, name').in('id', pids);
          const nameById = Object.fromEntries((products || []).map((p) => [p.id, p.name]));
          itemsForEmail = itemsForEmail.map((i) => ({
            ...i,
            product_name: nameById[i.product_id] || null,
          }));
        }
        const payment = buildSyntheticPaymentForEmail(mpOrder);
        const sent = await sendPaymentConfirmationEmail({ to, order: prevOrder, items: itemsForEmail, payment });
        if (sent) {
          await supabase
            .from('orders')
            .update({ payment_confirmation_email_sent_at: new Date().toISOString() })
            .eq('id', order.id);
        }
      }
    }
  }

  return res.status(201).json({
    order_id: order.id,
    mp_order_id: mpOrder?.id || null,
    order_status: nextStatus,
    mp_status: mpOrder?.status || null,
    mp_status_detail: mpOrder?.status_detail || null,
  });
});

// ── GET /api/mercadopago/order-status/:orderId ─────────────────────────────

router.get('/mercadopago/order-status/:orderId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });
  const { orderId } = req.params;
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, payment_method, mp_order_id, mp_status, mp_status_detail')
      .eq('id', orderId)
      .single();
    if (error || !order) return res.status(404).json({ error: 'Orden no encontrada' });
    if ((order.payment_method || '') !== 'mercadopago') {
      return res.status(400).json({ error: 'Esta orden no es de Mercado Pago' });
    }
    return res.json({
      order_id: order.id,
      order_status: order.status,
      mp_status: order.mp_status,
      mp_status_detail: order.mp_status_detail,
      nave_status: null,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Error' });
  }
});

// ── Webhook handler (mounted from index with raw body) ─────────────────────

async function handleMercadoPagoWebhook(req, res, _next) {
  try {
    await handleMercadoPagoWebhookCore(req, res);
  } catch (e) {
    console.error('[MP Webhook] Error no manejado:', e);
    if (!res.headersSent) res.status(500).json({ error: 'Internal error' });
  }
}

async function handleMercadoPagoWebhookCore(req, res) {
  const secret = (process.env.MP_WEBHOOK_SECRET || '').trim();
  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];

  let body = req.body;
  if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString('utf8') || '{}');
    } catch {
      body = {};
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      body = {};
    }
  }

  const qDataId = req.query['data.id'];
  const dataIdRaw =
    body?.data?.id
    || (Array.isArray(qDataId) ? qDataId[0] : qDataId)
    || req.query.data_id;
  const dataId = dataIdRaw != null ? String(dataIdRaw).trim() : '';

  if (!dataId) {
    console.warn('[MP Webhook] Sin data.id en body ni query');
    return res.status(400).json({ error: 'Missing data.id' });
  }

  const okSig = verifyWebhookSignature({
    secret,
    xSignature,
    xRequestId: xRequestId || '',
    dataId,
  });
  if (secret && !okSig) {
    console.warn('[MP Webhook] Firma inválida');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  res.sendStatus(200);

  if (!supabase) {
    console.error('[MP Webhook] Supabase no configurado');
    return;
  }

  let accessToken;
  try {
    accessToken = getAccessToken();
  } catch (e) {
    console.error('[MP Webhook]', e.message);
    return;
  }

  try {
    const mpOrder = await fetchMpOrder(dataId, accessToken);
    const extRef = (mpOrder?.external_reference || '').trim();
    if (!extRef) {
      console.warn('[MP Webhook] Orden MP sin external_reference', dataId);
      return;
    }

    await applyMpOrderToDb(extRef, mpOrder, { sendEmailIfPaid: true });
  } catch (err) {
    console.error('[MP Webhook] Error:', err.response?.data || err.message);
  }
}

router.handleMercadoPagoWebhook = handleMercadoPagoWebhook;

module.exports = router;
