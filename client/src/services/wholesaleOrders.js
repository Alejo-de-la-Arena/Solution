import { supabase } from "../lib/supabaseClient";

/**
 * Productos activos para el portal mayorista (precios retail y wholesale).
 */
export async function getWholesaleProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, slug, image_url, price_retail, price_wholesale")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Precio por plan: A = price_wholesale, B = 10% adicional de descuento sobre wholesale.
 */
export function priceForPlan(product, plan) {
  const w = Number(product?.price_wholesale ?? 0);
  if (plan === "B") return Math.round(w * 0.9);
  return w;
}

/**
 * Guarda el pedido mayorista en orders + order_items con channel = 'wholesale'
 * y además persiste customer_name/customer_email/wholesale_plan (para admin/reporting).
 *
 * @param {string} userId
 * @param {{ full_name?: string, email?: string }} customer
 * @param {'A'|'B'} plan
 * @param {Array<{ product_id: string, quantity: number, unit_price: number }>} items
 * @param {string} currency
 */
export async function saveWholesaleOrder(userId, customer, plan, items, currency = "ARS") {
  const cleanItems = (items || []).filter((i) => Number(i.quantity) > 0);
  const total = cleanItems.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);

  const payload = {
    user_id: userId,
    status: "draft",
    currency,
    total,
    channel: "wholesale",
    customer_name: (customer?.full_name || "").trim() || null,
    customer_email: (customer?.email || "").trim() || null,
    wholesale_plan: plan || null,
  };

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert(payload)
    .select("id, user_id, status, currency, total, created_at, channel, customer_name, customer_email, wholesale_plan")
    .single();

  if (orderErr) throw orderErr;

  const rows = cleanItems.map((i) => ({
    order_id: order.id,
    product_id: i.product_id,
    quantity: Number(i.quantity),
    unit_price: Number(i.unit_price),
  }));

  if (rows.length) {
    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) throw itemsErr;
  }

  return order;
}

/**
 * Lista mis pedidos mayoristas (para el portal).
 */
export async function getMyWholesaleOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, user_id, status, currency, total, created_at, channel, customer_name, customer_email, wholesale_plan")
    .eq("channel", "wholesale")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Items de un pedido (para portal / admin).
 */
export async function getOrderItems(orderId) {
  const { data, error } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, quantity, unit_price")
    .eq("order_id", orderId)
    .order("id", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Admin: pedidos mayoristas de un usuario.
 * (Se asume que el admin tiene acceso por RLS o usa policies para admin.)
 */
export async function listWholesaleOrdersForUser(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, user_id, status, currency, total, created_at, channel, customer_name, customer_email, wholesale_plan")
    .eq("channel", "wholesale")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}