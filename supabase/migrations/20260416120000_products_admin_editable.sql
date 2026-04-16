-- Admin product editor: columnas faltantes + tabla product_images.
-- Hoy el contenido rico (párrafos, notas top/heart/base, personalidad, etc.)
-- vive en client/src/data/perfumes.js y pisa a la DB en productToPerfume().
-- Esta migración agrega esas columnas y crea la tabla de imágenes para
-- que el panel admin pueda gestionar textos e imágenes desde la DB.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS description_paragraphs text[],
  ADD COLUMN IF NOT EXISTS profile_general text,
  ADD COLUMN IF NOT EXISTS personality text,
  ADD COLUMN IF NOT EXISTS family text,
  ADD COLUMN IF NOT EXISTS notes_top text[],
  ADD COLUMN IF NOT EXISTS notes_heart text[],
  ADD COLUMN IF NOT EXISTS notes_base text[];

COMMENT ON COLUMN public.products.short_description IS 'Resumen corto (equivale al shortDescription / profileGeneral de perfumes.js)';
COMMENT ON COLUMN public.products.description_paragraphs IS 'Array de párrafos para el detalle del producto';
COMMENT ON COLUMN public.products.profile_general IS 'Perfil general de la fragancia';
COMMENT ON COLUMN public.products.personality IS 'Rasgos de personalidad (texto libre)';
COMMENT ON COLUMN public.products.family IS 'Familia olfativa descriptiva (puede diferir de perfil_olfativo)';
COMMENT ON COLUMN public.products.notes_top IS 'Notas de salida';
COMMENT ON COLUMN public.products.notes_heart IS 'Notas de corazón';
COMMENT ON COLUMN public.products.notes_base IS 'Notas de fondo';

-- Tabla product_images: relación 1-N con products.
-- role: store_default | store_hover | gallery
--   - store_default / store_hover: 1 fila por producto (usadas en /tienda)
--   - gallery: N filas, ordenadas por sort_order (usadas en /producto/:slug)
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  role text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_images_role_check CHECK (role IN ('store_default', 'store_hover', 'gallery'))
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_role
  ON public.product_images (product_id, role, sort_order);

-- Lectura pública (frontend anónimo), escritura solo vía service role
-- desde el server (service role bypassa RLS, así que no hace falta policy write).
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_product_images" ON public.product_images;
CREATE POLICY "allow_public_select_product_images"
ON public.product_images
FOR SELECT
TO anon, authenticated
USING (true);
