const { isRequestAdmin } = require('./adminAuth');

const ADMIN_TEST_UNIT_PRICE = 150;

/**
 * Si el request viene de un admin autenticado (bearer token validado contra
 * Supabase), sobrescribe cada item a unit_price=150 y shipping_cost=0 para
 * que el admin pueda hacer compras de prueba sin gastar plata. Si no es admin,
 * devuelve los items y shipping intactos.
 *
 * Devuelve: { items, shipping, applied: boolean }
 *  - applied: true si efectivamente se aplicó el override. Usar para marcar
 *    la orden con is_admin_test=true y skipear notificaciones al admin.
 */
async function applyAdminTestMode(req, cleanItems, shippingCost, { tag = '' } = {}) {
  const isAdmin = await isRequestAdmin(req);
  if (!isAdmin) {
    return { items: cleanItems, shipping: shippingCost, applied: false };
  }
  const items = cleanItems.map((i) => ({ ...i, unit_price: ADMIN_TEST_UNIT_PRICE }));
  // console.log (no warn) → Railway lo categoriza como [inf] y evita que parezca un error en los logs.
  console.log(
    `[ADMIN_TEST]${tag ? ' ' + tag : ''} override: unit_price=${ADMIN_TEST_UNIT_PRICE}, shipping_cost=0 (original shipping=${shippingCost})`
  );
  return { items, shipping: 0, applied: true };
}

module.exports = { applyAdminTestMode, ADMIN_TEST_UNIT_PRICE };
