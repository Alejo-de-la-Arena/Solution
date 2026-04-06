-- Evita duplicados de email de "pago confirmado" y permite reintentar si el primer envío falló
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_confirmation_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.payment_confirmation_email_sent_at IS 'Set when Resend payment confirmation email was sent successfully (Nave webhook)';
