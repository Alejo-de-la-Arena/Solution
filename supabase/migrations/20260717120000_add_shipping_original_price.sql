-- Calculadora: costo REAL del envío, separado de lo que se le cobra al cliente.
--
-- `orders.shipping_cost` es lo que PAGA EL COMPRADOR por el envío: con envío
-- gratis vale 0 aunque el flete a Correo Argentino se pague igual. La
-- calculadora usaba esa columna como costo, así que todo el flete de los envíos
-- gratis (≈65% de los pedidos) desaparecía del reporte y la ganancia salía
-- inflada.
--
-- `shipping_original_price` guarda la tarifa real de Correo (el `originalPrice`
-- de la cotización, ver services/providers/correo/correo.provider.js). Con las
-- dos columnas el reporte puede mostrar envío cobrado, costo real y el
-- quebranto por envío gratis (= costo real − cobrado) por separado.
--
-- NOTA: la columna ya existía en la base de producción, creada a mano fuera de
-- migraciones y sin poblar (0 filas). Esta migración la versiona con IF NOT
-- EXISTS para que sea idempotente: no-op en prod, y las bases nuevas
-- (staging/local) quedan con el mismo esquema.
--
-- El backfill histórico se hace con scripts/backfill-shipping-cost.js, que lee
-- shipping_quote_payload->selectedOption->originalPrice. No requiere llamadas a
-- la API de Correo: el dato ya está guardado en cada orden.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_original_price numeric(12,2);

COMMENT ON COLUMN public.orders.shipping_original_price IS
  'Costo real del envío según la cotización de Correo Argentino (originalPrice), ANTES del descuento por envío gratis. Es lo que le pagamos al correo; shipping_cost es lo que le cobramos al comprador. Con envío gratis: shipping_cost = 0 y shipping_original_price = tarifa real. NULL si la orden no tiene cotización guardada.';

-- El reporte de la calculadora filtra por rango de fecha de pago y suma esta
-- columna; el índice parcial acompaña esos scans sin pesar sobre las filas que
-- no la tienen.
CREATE INDEX IF NOT EXISTS idx_orders_shipping_original_price
  ON public.orders (shipping_original_price)
  WHERE shipping_original_price IS NOT NULL;
