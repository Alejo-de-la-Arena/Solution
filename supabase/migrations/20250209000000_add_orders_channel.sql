-- Permite distinguir pedidos minoristas de mayoristas.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS channel text DEFAULT 'retail';

COMMENT ON COLUMN public.orders.channel IS 'retail | wholesale';
