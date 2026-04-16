const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const multer = require('multer');
const router = express.Router();
const { supabase, supabaseAuth } = require('../lib/supabase');
const naveRouter = require('./nave');
const { sendRefundInitiatedEmail } = require('../services/email');

const PRODUCTS_BUCKET = 'solution-products';
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_ROLES = new Set(['store_default', 'store_hover', 'gallery']);

const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PRODUCT_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      return cb(new Error('Formato no soportado (jpeg/png/webp)'));
    }
    cb(null, true);
  },
});

function extForMime(mime) {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'bin';
}

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

/** Estados que el admin puede asignar manualmente (más prefijo nave_ para casos raros del webhook). */
const ALLOWED_ORDER_STATUSES = new Set([
  'pending',
  'pending_payment',
  'paid',
  'payment_failed',
  'refund_pending',
  'refunded',
  'chargeback',
  'draft',
  'cancelled',
  'shipped',
]);

function isAllowedAdminOrderStatus(status) {
  if (!status || typeof status !== 'string') return false;
  const s = status.trim();
  if (!s) return false;
  if (ALLOWED_ORDER_STATUSES.has(s)) return true;
  if (s.startsWith('nave_')) return true;
  return false;
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
  } else {
    // Por defecto ocultamos las órdenes que sólo iniciaron la pasarela y no
    // llegaron a pagar (el usuario abandonó antes de completar el checkout).
    query = query.neq('status', 'payment_initiated');
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
 * PATCH /api/admin/orders/:orderId/status
 * Body: { "status": "paid" | "shipped" | ... }
 */
router.patch('/orders/:orderId/status', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  const { orderId } = req.params;
  const nextStatus = (req.body?.status ?? '').trim();

  if (!orderId) {
    return res.status(400).json({ error: 'orderId requerido' });
  }
  if (!isAllowedAdminOrderStatus(nextStatus)) {
    return res.status(400).json({
      error: 'Estado no permitido',
      hint: 'Usá un valor conocido (pending, paid, shipped, …) o nave_* si vino del webhook.',
    });
  }

  const { data: existing, error: fetchErr } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }

  const { data: updated, error: upErr } = await supabase
    .from('orders')
    .update({ status: nextStatus })
    .eq('id', orderId)
    .select('*')
    .single();

  if (upErr) {
    console.error('[admin] PATCH order status:', upErr);
    return res.status(500).json({ error: 'No se pudo actualizar el estado' });
  }

  return res.json({ ok: true, order: updated });
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

// ===========================================================================
// PRODUCTOS (admin)
// ===========================================================================

const PRODUCT_EDITABLE_FIELDS = {
  name:              { type: 'string',  maxLen: 120 },
  tagline:           { type: 'string',  maxLen: 200 },
  short_description: { type: 'string',  maxLen: 2000 },
  price_retail:      { type: 'number',  min: 0 },
  price_wholesale:   { type: 'number',  min: 0 },
  is_active:         { type: 'boolean' },
};

function validateProductPatch(body) {
  const update = {};
  const errors = [];
  for (const [key, rule] of Object.entries(PRODUCT_EDITABLE_FIELDS)) {
    if (!(key in body)) continue;
    const value = body[key];
    if (value === null || value === undefined) {
      update[key] = null;
      continue;
    }
    if (rule.type === 'string') {
      if (typeof value !== 'string') { errors.push(`${key} debe ser string`); continue; }
      if (rule.maxLen && value.length > rule.maxLen) { errors.push(`${key} excede ${rule.maxLen} chars`); continue; }
      update[key] = value;
    } else if (rule.type === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n)) { errors.push(`${key} debe ser numérico`); continue; }
      if (rule.min !== undefined && n < rule.min) { errors.push(`${key} no puede ser menor que ${rule.min}`); continue; }
      update[key] = n;
    } else if (rule.type === 'boolean') {
      if (typeof value !== 'boolean') { errors.push(`${key} debe ser boolean`); continue; }
      update[key] = value;
    }
  }
  return { update, errors };
}

async function fetchProductWithImages(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(id, storage_path, role, sort_order, created_at)')
    .eq('id', productId)
    .single();
  if (error) return { data: null, error };
  if (data?.product_images) {
    data.product_images.sort((a, b) => {
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }
  return { data, error: null };
}

/**
 * GET /api/admin/products — lista todos los productos con imágenes (incluye inactivos).
 */
router.get('/products', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(id, storage_path, role, sort_order, created_at)')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[admin] GET /products:', error);
    return res.status(500).json({ error: 'No se pudieron listar los productos' });
  }
  for (const p of data || []) {
    if (p.product_images) {
      p.product_images.sort((a, b) => {
        if (a.role !== b.role) return a.role.localeCompare(b.role);
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
    }
  }
  return res.json({ products: data || [] });
});

/**
 * GET /api/admin/products/:id — detalle con imágenes.
 */
router.get('/products/:id', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  const { data, error } = await fetchProductWithImages(req.params.id);
  if (error || !data) return res.status(404).json({ error: 'Producto no encontrado' });
  return res.json({ product: data });
});

/**
 * PATCH /api/admin/products/:id — actualiza campos editables.
 */
router.patch('/products/:id', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  const { update, errors } = validateProductPatch(req.body || {});
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Datos inválidos', details: errors });
  }
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'Nada para actualizar' });
  }
  // short_description es el campo visible en /tienda (profile_general) y en
  // /producto/:slug. Mantenemos ambas columnas sincronizadas así el admin edita
  // un único "descripción corta".
  if ('short_description' in update) {
    update.profile_general = update.short_description;
  }
  update.updated_at = new Date().toISOString();

  const { error: upErr } = await supabase
    .from('products')
    .update(update)
    .eq('id', req.params.id);
  if (upErr) {
    console.error('[admin] PATCH /products/:id:', upErr);
    return res.status(500).json({ error: 'No se pudo actualizar el producto' });
  }

  const { data } = await fetchProductWithImages(req.params.id);
  return res.json({ product: data });
});

/**
 * POST /api/admin/products/:id/images — sube archivo al bucket + inserta fila.
 * multipart/form-data: file, role (store_default|store_hover|gallery), sort_order?
 * Para roles de tienda (store_default/store_hover) reemplaza la fila existente.
 */
router.post('/products/:id/images', productImageUpload.single('file'), async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  if (!req.file) return res.status(400).json({ error: 'Falta archivo (file)' });

  const role = (req.body?.role || '').trim();
  if (!ALLOWED_IMAGE_ROLES.has(role)) {
    return res.status(400).json({ error: 'role inválido' });
  }

  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('id, slug')
    .eq('id', req.params.id)
    .single();
  if (pErr || !product) return res.status(404).json({ error: 'Producto no encontrado' });

  const ext = extForMime(req.file.mimetype);
  const storagePath = `${product.slug}/admin/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
  if (upErr) {
    console.error('[admin] storage upload:', upErr);
    return res.status(502).json({ error: 'No se pudo subir la imagen' });
  }

  let sortOrder = 0;
  if (role === 'gallery') {
    const parsed = Number.parseInt(req.body?.sort_order, 10);
    if (Number.isFinite(parsed)) {
      sortOrder = parsed;
    } else {
      const { data: maxRow } = await supabase
        .from('product_images')
        .select('sort_order')
        .eq('product_id', product.id)
        .eq('role', 'gallery')
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      sortOrder = (maxRow?.sort_order ?? -1) + 1;
    }
  }

  // Para roles únicos (store_default/store_hover) reemplazamos el anterior.
  if (role === 'store_default' || role === 'store_hover') {
    const { data: existing } = await supabase
      .from('product_images')
      .select('id, storage_path')
      .eq('product_id', product.id)
      .eq('role', role);
    for (const row of existing || []) {
      await supabase.storage.from(PRODUCTS_BUCKET).remove([row.storage_path]).catch(() => {});
      await supabase.from('product_images').delete().eq('id', row.id);
    }
  }

  const { data: inserted, error: insErr } = await supabase
    .from('product_images')
    .insert({
      product_id: product.id,
      storage_path: storagePath,
      role,
      sort_order: sortOrder,
    })
    .select('*')
    .single();
  if (insErr) {
    console.error('[admin] insert product_image:', insErr);
    await supabase.storage.from(PRODUCTS_BUCKET).remove([storagePath]).catch(() => {});
    return res.status(500).json({ error: 'No se pudo registrar la imagen' });
  }

  return res.json({ image: inserted });
});

/**
 * PATCH /api/admin/products/:id/images/reorder
 * Body: { items: [{ id, sort_order }] }
 */
router.patch('/products/:id/images/reorder', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  const items = Array.isArray(req.body?.items) ? req.body.items : null;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'items[] requerido' });
  }

  const productId = req.params.id;
  const imageIds = items.map((it) => it?.id).filter(Boolean);
  const { data: owned, error: ownErr } = await supabase
    .from('product_images')
    .select('id')
    .eq('product_id', productId)
    .in('id', imageIds);
  if (ownErr) return res.status(500).json({ error: 'Error verificando imágenes' });
  if ((owned || []).length !== imageIds.length) {
    return res.status(400).json({ error: 'Hay imágenes que no pertenecen al producto' });
  }

  for (const it of items) {
    const so = Number.parseInt(it.sort_order, 10);
    if (!Number.isFinite(so)) continue;
    await supabase.from('product_images').update({ sort_order: so }).eq('id', it.id);
  }

  return res.json({ ok: true });
});

/**
 * DELETE /api/admin/products/:id/images/:imageId
 */
router.delete('/products/:id/images/:imageId', async (req, res) => {
  const user = await assertAdmin(req, res);
  if (!user) return;

  const { id: productId, imageId } = req.params;

  const { data: img, error: fErr } = await supabase
    .from('product_images')
    .select('id, storage_path, product_id')
    .eq('id', imageId)
    .single();
  if (fErr || !img) return res.status(404).json({ error: 'Imagen no encontrada' });
  if (img.product_id !== productId) {
    return res.status(400).json({ error: 'La imagen no pertenece al producto' });
  }

  await supabase.storage.from(PRODUCTS_BUCKET).remove([img.storage_path]).catch(() => {});
  const { error: dErr } = await supabase.from('product_images').delete().eq('id', imageId);
  if (dErr) {
    console.error('[admin] delete product_image:', dErr);
    return res.status(500).json({ error: 'No se pudo borrar la imagen' });
  }
  return res.json({ ok: true });
});

// multer error handler (tamaño, mime, etc.)
router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.message && err.message.startsWith('Formato no soportado')) {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
});

module.exports = router;
