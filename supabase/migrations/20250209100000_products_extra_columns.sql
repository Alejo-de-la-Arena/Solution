-- Campos extra para la UI de producto (tagline, uso, ocasión, intensidad, notas, etc.)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS tipo_de_uso text,
  ADD COLUMN IF NOT EXISTS ocasion text,
  ADD COLUMN IF NOT EXISTS intensidad int4,
  ADD COLUMN IF NOT EXISTS perfil_olfativo text,
  ADD COLUMN IF NOT EXISTS notas_principales text[],
  ADD COLUMN IF NOT EXISTS momento_ideal text,
  ADD COLUMN IF NOT EXISTS volumen_ml int4 DEFAULT 100,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ARS',
  ADD COLUMN IF NOT EXISTS sort_order int4 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accent_color text;

COMMENT ON COLUMN public.products.tagline IS 'Subtítulo / tagline del producto';
COMMENT ON COLUMN public.products.tipo_de_uso IS 'Ej: Noche / Eventos';
COMMENT ON COLUMN public.products.ocasion IS 'Ej: Formal / Elegante';
COMMENT ON COLUMN public.products.intensidad IS 'Escala 1-10';
COMMENT ON COLUMN public.products.perfil_olfativo IS 'Texto corto del perfil';
COMMENT ON COLUMN public.products.notas_principales IS 'Array de notas (Lavanda, Bergamota, etc.)';
COMMENT ON COLUMN public.products.momento_ideal IS 'Texto momento ideal';
COMMENT ON COLUMN public.products.sort_order IS 'Orden de aparición (1..n)';

-- Necesario para seed con ON CONFLICT (slug)
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON public.products (slug);
