const { supabase } = require('./supabase');

/**
 * Enriquece filas de order_items con cogs_unit leyendo products.cost_price
 * vigente al momento de la creación. Devuelve un array nuevo (no muta).
 *
 * Si products.cost_price es null, cogs_unit queda en null (orden registrada
 * sin costo definido — la Calculadora lo reportará como "costo no definido").
 */
async function attachCogsToOrderItemRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  const pids = [...new Set(rows.map((r) => r && r.product_id).filter(Boolean))];
  if (pids.length === 0) return rows;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, cost_price')
      .in('id', pids);
    if (error) {
      console.error('[orderItems] Error leyendo cost_price:', error);
      return rows;
    }
    const costById = Object.fromEntries((data || []).map((p) => [p.id, p.cost_price]));
    return rows.map((r) => ({
      ...r,
      cogs_unit: r && r.product_id != null ? (costById[r.product_id] ?? null) : null,
    }));
  } catch (err) {
    console.error('[orderItems] Excepción leyendo cost_price:', err);
    return rows;
  }
}

module.exports = { attachCogsToOrderItemRows };
