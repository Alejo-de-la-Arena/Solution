const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { sendOrderEmail } = require('../services/email');

/**
 * POST /api/checkout
 * Crea una orden retail (channel: 'retail') y sus order_items.
 *
 * Campos de envío opcionales (cotizados en el checkout con Correo Argentino o Gestionar):
 *   shipping_provider, shipping_mode, shipping_service_type, shipping_is_free,
 *   shipping_agency_code, shipping_agency_name, shipping_customer_id,
 *   shipping_quote_payload, shipping_quote_response
 */
router.post('/', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Checkout no configurado' });
  }

  const {
    customer_name,
    customer_email,
    customer_phone,
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
    // ── Campos de cotización de envío (nuevos) ──
    shipping_provider,
    shipping_mode,
    shipping_service_type,
    shipping_is_free,
    shipping_agency_code,
    shipping_agency_name,
    shipping_customer_id,
    shipping_quote_payload,
    shipping_quote_response,
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
    }));

  if (cleanItems.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  const subtotal = cleanItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const shipping = shipping_cost != null ? Number(shipping_cost) : 0;
  const orderTotal = subtotal + shipping;

  const orderPayload = {
    user_id: null,
    status: 'pending',
    currency: 'ARS',
    total: orderTotal,
    channel: 'retail',
    customer_name: name || null,
    customer_email: email || null,
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
    .from('orders')
    .insert(orderPayload)
    .select('id, status, total, currency, created_at, customer_name, customer_email')
    .single();

  if (orderErr) {
    console.error('Checkout order error:', orderErr);
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
    console.error('Checkout order_items error:', itemsErr);
    return res.status(500).json({ error: 'Error al guardar los ítems de la orden' });
  }

  // Enriquecer ítems con nombre de producto para el email.
  let itemsWithMeta = cleanItems;
  try {
    const productIds = [...new Set(cleanItems.map((i) => i.product_id))];
    if (productIds.length > 0) {
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (!prodErr && products) {
        const nameById = Object.fromEntries(products.map((p) => [p.id, p.name]));
        itemsWithMeta = cleanItems.map((i) => ({
          ...i,
          product_name: nameById[i.product_id] || null,
        }));
      }
    }
  } catch (e) {
    console.warn('No se pudo enriquecer metadata de productos para el email:', e?.message || e);
  }

  if (email) {
    sendOrderEmail(email, order, itemsWithMeta, name).catch((err) => {
      console.error('Order email send error:', err?.message || err);
    });
  }

  return res.status(201).json({ order });
});

/**
 * GET /api/checkout/track/:orderId
 * Endpoint público para que el usuario siga el estado de su pedido sin login.
 * Devuelve solo campos seguros (sin phone, sin payment_id, sin tokens).
 */
router.get('/track/:orderId', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Base de datos no configurada' });

  const { orderId } = req.params;
  if (!orderId) return res.status(400).json({ error: 'orderId requerido' });

  const { data: order, error } = await supabase
    .from('orders')
    .select([
      'id', 'status', 'total', 'currency', 'payment_method', 'created_at',
      'customer_name',
      'mp_status', 'mp_status_detail', 'mp_card_brand', 'mp_card_last4', 'mp_installments', 'mp_paid_at',
      'nave_status', 'nave_card_brand', 'nave_card_last4', 'nave_installments', 'nave_paid_at',
      'shipping_method', 'shipping_address_line1', 'shipping_address_line2',
      'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_country',
      'shipping_provider', 'shipping_mode', 'shipping_agency_name', 'shipping_cost', 'shipping_is_free',
    ].join(', '))
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error('[checkout/track] error consultando orden:', error);
    return res.status(500).json({ error: 'Error al consultar la orden' });
  }
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

  const { data: rawItems, error: itemsErr } = await supabase
    .from('order_items')
    .select('product_id, quantity, unit_price')
    .eq('order_id', orderId);
  if (itemsErr) {
    console.error('[checkout/track] error consultando items:', itemsErr);
  }

  let items = rawItems || [];
  const productIds = [...new Set(items.map((i) => i.product_id))];
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, image_url')
      .in('id', productIds);
    const byId = Object.fromEntries((products || []).map((p) => [p.id, p]));
    items = items.map((i) => ({
      product_id: i.product_id,
      product_name: byId[i.product_id]?.name || null,
      product_image: byId[i.product_id]?.image_url || null,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));
  }

  return res.json({ order, items });
});

module.exports = router;