-- Mercado Pago Orders API (Checkout API vía Orders)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS mp_order_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_status TEXT,
  ADD COLUMN IF NOT EXISTS mp_status_detail TEXT,
  ADD COLUMN IF NOT EXISTS mp_card_brand TEXT,
  ADD COLUMN IF NOT EXISTS mp_card_last4 TEXT,
  ADD COLUMN IF NOT EXISTS mp_installments INTEGER,
  ADD COLUMN IF NOT EXISTS mp_paid_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.mp_order_id IS 'Mercado Pago order id (e.g. ORD01...)';
COMMENT ON COLUMN orders.mp_payment_id IS 'MP payment transaction id within the order';
