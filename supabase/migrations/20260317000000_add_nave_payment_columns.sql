ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS nave_payment_request_id TEXT,
  ADD COLUMN IF NOT EXISTS nave_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS nave_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'pending';
