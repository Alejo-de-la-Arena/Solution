-- Permite marcar un producto como "sin stock" desde el admin sin ocultarlo de
-- /tienda: is_active controla visibilidad, is_out_of_stock controla si se
-- puede comprar. Un producto puede estar activo (visible) y sin stock
-- (no comprable) al mismo tiempo.
--
-- Default false: no cambia el comportamiento de ningún producto existente.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_out_of_stock boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.products.is_out_of_stock IS
  'true = el producto no se puede comprar (botón deshabilitado en tienda/detalle y rechazado en checkout), aunque siga visible si is_active=true.';
