const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { sendOrderEmail } = require('../services/email');
/**
 * POST /api/checkout
 * Crea una orden retail (channel: 'retail') y sus order_items.
 * Body: customer_name, customer_email, customer_phone?, shipping_*, items: [{ product_id, quantity, unit_price }]
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

  const total = cleanItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const shipping = shipping_cost != null ? Number(shipping_cost) : 0;
  const orderTotal = total + shipping;

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

  // Enriquecer ítems con metadata de producto para el email (nombre).
  let itemsWithMeta = cleanItems;
  try {
    const productIds = [...new Set(cleanItems.map((i) => i.product_id))];
    if (productIds.length > 0) {
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      if (!prodErr && products) {
        const nameById = Object.fromEntries(
          products.map((p) => [p.id, p.name])
        );
        itemsWithMeta = cleanItems.map((i) => ({
          ...i,
          product_name: nameById[i.product_id] || null,
        }));
      }
    }
  } catch (e) {
    console.warn('No se pudo enriquecer metadata de productos para el email:', e?.message || e);
  }

  // Enviar email de confirmación al cliente (best-effort; no rompe la respuesta si falla).
  if (email) {
    sendOrderEmail(email, order, itemsWithMeta, name).catch((err) => {
      console.error('Order email send error:', err?.message || err);
    });
  }

  return res.status(201).json({ order });
});

module.exports = router;
