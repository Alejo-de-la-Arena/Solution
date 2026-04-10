-- Yellow Bloom: precio retail tras testeos (DB puede tener $1 u otro valor).
-- Todos los perfumes: volumen de presentación 60 ml (antes 100 ml en seed/UI).

UPDATE public.products
SET
  price_retail = 49999,
  price_wholesale = 34999,
  updated_at = now()
WHERE slug = 'yellow-bloom';

UPDATE public.products
SET
  volumen_ml = 60,
  updated_at = now()
WHERE slug IN ('black-code', 'red-desire', 'deep-blue', 'yellow-bloom', 'white-ice');
