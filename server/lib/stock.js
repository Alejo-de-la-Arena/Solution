const { supabase } = require('./supabase');

/**
 * Verifica que ningún item del carrito corresponda a un producto marcado
 * is_out_of_stock=true. Se llama antes de crear la orden en cada endpoint de
 * checkout/pago, para que no se pueda comprar por URL directa o con el
 * carrito ya cargado antes de que el admin marcara el producto sin stock.
 *
 * Devuelve { ok: true } o { ok: false, error }.
 */
async function assertItemsInStock(cleanItems) {
  const productIds = [...new Set((cleanItems || []).map((i) => i.product_id).filter(Boolean))];
  if (productIds.length === 0) return { ok: true };

  const { data, error } = await supabase
    .from('products')
    .select('id, name, is_out_of_stock')
    .in('id', productIds);

  if (error) {
    console.error('[stock] Error verificando stock:', error);
    return { ok: false, error: 'No se pudo verificar el stock de los productos' };
  }

  const outOfStock = (data || []).filter((p) => p.is_out_of_stock);
  if (outOfStock.length > 0) {
    const names = outOfStock.map((p) => p.name || p.id).join(', ');
    return { ok: false, error: `Sin stock: ${names}` };
  }
  return { ok: true };
}

module.exports = { assertItemsInStock };
