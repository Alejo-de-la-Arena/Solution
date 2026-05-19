-- Parámetros UTM capturados en el frontend cuando el usuario llega al sitio.
-- Se persisten en la orden para atribución de campañas (origen del tráfico).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS utm_term TEXT;
