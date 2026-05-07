-- Integración Gestionar (logística): tracking del push y mapeo de SKUs.
-- Las órdenes pagas con shipping_provider='gestionar' son levantadas por un
-- batch que las sube a Gestionar (creación de paquete fullfilment). El flag
-- gestionar_pushed_at IS NULL marca pendientes; idempotente como el patrón
-- payment_confirmation_email_sent_at.

-- ========== products: SKU canónico + ID interno en Gestionar ==========
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS gestionar_product_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique
  ON products (sku) WHERE sku IS NOT NULL;

COMMENT ON COLUMN products.sku IS 'SKU canónico que comparte con Gestionar (formato XXX-Y-COLOR-Z).';
COMMENT ON COLUMN products.gestionar_product_id IS 'ID interno del producto en Gestionar; se completa via /admin/gestionar/link-catalog.';

-- Seed de los 5 SKUs reales (mapeo por color → slug)
UPDATE products SET sku = 'BLA-N-NEG-A' WHERE slug = 'black-code'   AND sku IS NULL;
UPDATE products SET sku = 'RED-N-ROJ-D' WHERE slug = 'red-desire'   AND sku IS NULL;
UPDATE products SET sku = 'YEL-N-AMA-D' WHERE slug = 'yellow-bloom' AND sku IS NULL;
UPDATE products SET sku = 'WHI-D-BLA-F' WHERE slug = 'white-ice'    AND sku IS NULL;
UPDATE products SET sku = 'DEE-D-AZU-F' WHERE slug = 'deep-blue'    AND sku IS NULL;

-- ========== orders: tracking del push a Gestionar ==========
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS gestionar_package_id TEXT,
  ADD COLUMN IF NOT EXISTS gestionar_pushed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gestionar_error TEXT,
  ADD COLUMN IF NOT EXISTS gestionar_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gestionar_last_attempt_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.gestionar_package_id IS 'ID del paquete devuelto por Gestionar tras crear con éxito.';
COMMENT ON COLUMN orders.gestionar_pushed_at IS 'Timestamp del push exitoso. NULL = pendiente. Idempotencia del batch.';
COMMENT ON COLUMN orders.gestionar_error IS 'Último mensaje de error si el push falló (limpia al éxito).';

-- Index parcial para que el batch query sea barato
CREATE INDEX IF NOT EXISTS orders_gestionar_pending
  ON orders (created_at)
  WHERE status = 'paid'
    AND shipping_provider = 'gestionar'
    AND gestionar_pushed_at IS NULL;
