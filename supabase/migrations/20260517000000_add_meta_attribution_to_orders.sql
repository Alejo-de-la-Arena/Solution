-- Atribución Meta completa para Conversions API (CAPI).
-- El fbclid ya existía (20260514120000); acá agregamos el resto de los
-- campos que Meta usa para hacer match del evento Purchase server-side:
--   fbp / fbc                  → cookies de Meta capturadas en el navegador
--   meta_client_ip_address     → IP del comprador al iniciar el checkout
--   meta_client_user_agent     → User-Agent del comprador al iniciar el checkout
--   meta_fbclid_ts             → timestamp del click del anuncio (para reconstruir fbc)
--   meta_capi_purchase_sent_at → idempotencia propia del evento CAPI Purchase,
--                                desacoplada del envío de email.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fbp TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fbc TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS meta_client_ip_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS meta_client_user_agent TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS meta_fbclid_ts BIGINT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS meta_capi_purchase_sent_at TIMESTAMPTZ;
