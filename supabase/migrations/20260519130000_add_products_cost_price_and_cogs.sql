-- Calculadora: costo unitario por producto + snapshot del costo al momento de la venta.
--
-- 1) products.cost_price: costo actual del producto en ARS, editable desde
--    el módulo Calculadora del admin. Se usa al crear un nuevo order_item
--    como valor inicial de cogs_unit.
-- 2) order_items.cogs_unit: snapshot inmutable del costo al momento de la
--    venta. Cambios futuros en products.cost_price NO alteran el cogs_unit
--    de órdenes ya creadas — fundamental para que reportes históricos no
--    se modifiquen al ajustar precios de costo.
--
-- Estrictamente aditiva. No hace seed: los costos iniciales se cargan
-- desde la UI de Calculadora (o un script separado), no desde la migration.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric(12,2);

COMMENT ON COLUMN public.products.cost_price IS
  'Costo unitario actual del producto en ARS. Editable desde admin/calculadora. Snapshot copiado a order_items.cogs_unit al crear un item.';

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS cogs_unit numeric(12,2);

COMMENT ON COLUMN public.order_items.cogs_unit IS
  'Snapshot del costo unitario al momento de la venta. Inmutable: cambios posteriores en products.cost_price NO se reflejan en items ya creados.';
