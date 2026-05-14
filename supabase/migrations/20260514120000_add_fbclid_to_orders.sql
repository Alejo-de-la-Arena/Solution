-- Almacena el fbclid capturado en el frontend cuando el usuario llega
-- desde un anuncio de Meta. Se persiste en la orden para poder incluirlo
-- en el evento Purchase de Conversions API (CAPI) al confirmar el webhook.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fbclid TEXT;
