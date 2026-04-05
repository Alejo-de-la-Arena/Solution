const express = require('express');
const axios = require('axios');
const router = express.Router();
const { supabase, supabaseAuth } = require('../lib/supabase');
const naveRouter = require('./nave');
const { sendRefundInitiatedEmail } = require('../services/email');

async function assertAdmin(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Falta token de autorización' });
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    res.status(401).json({ error: 'Token inválido' });
    return null;
  }
  if (!supabaseAuth) {
    res.status(503).json({ error: 'Auth no configurado (SUPABASE_ANON_KEY)' });
    return null;
  }
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return null;
  }
  if (!supabase) {
    res.status(503).json({ error: 'Base de datos no configurada' });
    return null;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const isAdminByRole = profile?.role === 'admin';
  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  const isAdmin = isAdminByRole || !!adminRow;
  if (!isAdmin) {
    res.status(403).json({ error: 'Solo administradores' });
    return null;
  }
  return user;
}

/**
 * GET /api/admin/orders
 * Lista órdenes con ítems y nombres de producto. Requiere Bearer JWT de admin.
 * Query: channel, status, date_from (YYYY-MM-DD), date_to (YYYY-MM-DD), q (buscar en nombre/email)
 */
router.get('/orders', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  const channel = req.query.channel;
  const status = req.query.status;
  const dateFrom = req.query.date_from;
  const dateTo = req.query.date_to;
  const q = (req.query.q || '').trim();

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (channel === 'retail' || channel === 'wholesale') {
    query = query.eq('channel', channel);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (dateFrom) {
    query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`);
  }
  if (dateTo) {
    query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);
  }
  if (q.length > 0) {
    const escaped = q.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const term = `"%${escaped}%"`;
    query = query.or(`customer_name.ilike.${term},customer_email.ilike.${term}`);
  }

  const { data: orders, error: ordersErr } = await query;
  if (ordersErr) {
    console.error('Admin orders error:', ordersErr);
    return res.status(500).json({ error: 'Error al listar pedidos' });
  }

  if (!orders || orders.length === 0) {
    return res.json({ orders: [] });
  }

  const orderIds = orders.map((o) => o.id);
  const { data: orderItems, error: itemsErr } = await supabase
    .from('order_items')
    .select('id, order_id, product_id, quantity, unit_price')
    .in('order_id', orderIds)
    .order('order_id')
    .order('id');

  if (itemsErr) {
    console.error('Admin order_items error:', itemsErr);
    return res.status(500).json({ error: 'Error al listar ítems' });
  }

  const productIds = [...new Set((orderItems || []).map((i) => i.product_id))];
  let productNameById = {};
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);
    if (products) {
      productNameById = Object.fromEntries(products.map((p) => [p.id, p.name]));
    }
  }

  const itemsByOrderId = {};
  for (const it of orderItems || []) {
    if (!itemsByOrderId[it.order_id]) itemsByOrderId[it.order_id] = [];
    itemsByOrderId[it.order_id].push({
      id: it.id,
      product_id: it.product_id,
      product_name: productNameById[it.product_id] || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
    });
  }

  const ordersWithItems = orders.map((o) => ({
    ...o,
    items: itemsByOrderId[o.id] || [],
  }));

  return res.json({ orders: ordersWithItems });
});

/**
 * POST /api/admin/orders/:orderId/refund
 * Inicia reembolso en Nave (DELETE /api/payments/{nave_payment_id}). Requiere admin.
 * La orden queda en refund_pending hasta que el webhook confirme refunded/cancelled.
 */
router.post('/orders/:orderId/refund', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ error: 'orderId requerido' });
  }

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }

  const pm = (order.payment_method || '').toLowerCase();
  if (pm !== 'nave') {
    return res.status(400).json({ error: 'Solo órdenes con pago Nave' });
  }
  if (!order.nave_payment_id) {
    return res.status(400).json({ error: 'La orden no tiene nave_payment_id' });
  }
  if (order.status !== 'paid') {
    return res.status(400).json({
      error: 'Solo se puede reembolsar una orden en estado paid',
      current_status: order.status,
    });
  }

  try {
    const token = await naveRouter.getNaveToken();
    const apiBase = naveRouter.getNaveApiBaseUrl();
    await axios.delete(`${apiBase}/api/payments/${order.nave_payment_id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    const st = e.response?.status || 502;
    const detail = e.response?.data || e.message;
    console.error('[admin refund] Nave DELETE error:', detail);
    return res.status(st).json({
      error: 'Error al solicitar reembolso en Nave',
      detail: typeof detail === 'object' ? detail : String(detail),
    });
  }

  const { error: upErr } = await supabase
    .from('orders')
    .update({ status: 'refund_pending' })
    .eq('id', orderId);

  if (upErr) {
    console.error('[admin refund] Supabase update:', upErr);
    return res.status(500).json({ error: 'Reembolso solicitado en Nave pero falló actualizar la orden' });
  }

  const email = (order.customer_email || '').trim();
  if (email) {
    sendRefundInitiatedEmail({ to: email, orderId }).catch((err) =>
      console.error('[admin refund] email:', err?.message || err),
    );
  }

  return res.json({ ok: true, status: 'refund_pending' });
});

module.exports = router;
