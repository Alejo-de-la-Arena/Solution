function isTestModeEnabled() {
  return process.env.TEST_MODE === 'true';
}

function getTestUnitPrice() {
  const v = Number(process.env.TEST_MODE_UNIT_PRICE);
  return Number.isFinite(v) && v > 0 ? v : 150;
}

function applyTestMode(cleanItems, shippingCost, { tag = '' } = {}) {
  if (!isTestModeEnabled()) {
    return { items: cleanItems, shipping: shippingCost, applied: false };
  }
  const price = getTestUnitPrice();
  const items = cleanItems.map((i) => ({ ...i, unit_price: price }));
  console.warn(
    `[TEST_MODE]${tag ? ' ' + tag : ''} override: unit_price=${price}, shipping_cost=0 (original shipping=${shippingCost})`
  );
  return { items, shipping: 0, applied: true };
}

module.exports = { isTestModeEnabled, getTestUnitPrice, applyTestMode };
