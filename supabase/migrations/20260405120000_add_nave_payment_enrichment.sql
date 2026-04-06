-- Enriched Nave payment data (from GET /ranty-payments/payments/:id after webhook)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS nave_payment_code TEXT,
  ADD COLUMN IF NOT EXISTS nave_card_brand TEXT,
  ADD COLUMN IF NOT EXISTS nave_card_type TEXT,
  ADD COLUMN IF NOT EXISTS nave_card_last4 TEXT,
  ADD COLUMN IF NOT EXISTS nave_card_issuer TEXT,
  ADD COLUMN IF NOT EXISTS nave_installments INTEGER,
  ADD COLUMN IF NOT EXISTS nave_installments_name TEXT,
  ADD COLUMN IF NOT EXISTS nave_status_reason TEXT,
  ADD COLUMN IF NOT EXISTS nave_paid_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.nave_payment_code IS 'Nave operation code (e.g. G40852846) for support/reconciliation';
COMMENT ON COLUMN orders.nave_paid_at IS 'Payment completion time from Nave (updated_date when approved)';
