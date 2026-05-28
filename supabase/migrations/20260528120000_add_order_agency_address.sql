-- Retiro en sucursal (Correo Argentino): guardar la dirección de la sucursal elegida.
-- El código (shipping_agency_code) y el nombre (shipping_agency_name) ya existen;
-- faltaba persistir la dirección de la calle para mostrarla en el panel admin sin
-- tener que re-consultar la API de Correo.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_agency_address TEXT;

COMMENT ON COLUMN public.orders.shipping_agency_address IS 'Dirección de la sucursal de Correo Argentino elegida para retiro (deliveryType S).';
