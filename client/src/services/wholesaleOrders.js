import { supabase } from '../lib/supabaseClient';

/**
 * Productos activos para el portal mayorista (precios retail y wholesale).
 */
export async function getWholesaleProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, image_url, price_retail, price_wholesale')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Precio por plan: A = price_wholesale, B = 10% adicional de descuento sobre wholesale.
 */
export function priceForPlan(product, plan) {
  const w = Number(product?.price_wholesale ?? 0);
  if (plan === 'B') return Math.round(w * 0.9);
  return w;
}

/**
 * Guarda el pedido mayorista en orders + order_items con channel = 'wholesale'.
 * @param {string} userId
 * @param {Array<{ product_id: string, quantity: number, unit_price: number }>} items
 * @param {string} currency
 */
export async function saveWholesaleOrder(userId, items, currency = 'ARS') {
  const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      status: 'draft',
      currency,
      total,
      channel: 'wholesale',
    })
    .select('id')
    .single();
  if (orderErr) throw orderErr;

  const rows = items
    .filter((i) => i.quantity > 0)
    .map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));
  if (rows.length) {
    const { error: itemsErr } = await supabase.from('order_items').insert(rows);
    if (itemsErr) throw itemsErr;
  }
  return order;
}
