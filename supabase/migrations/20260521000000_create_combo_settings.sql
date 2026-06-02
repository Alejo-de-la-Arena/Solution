-- Combo editable desde el admin.
-- Hoy el contenido del combo (títulos, badges, imágenes del showcase, labels de
-- los selects, nombres/referencias de las opciones, features y CTA) vive
-- hardcodeado en client/src/pages/Tienda.jsx. Esta tabla lo mueve a la DB para
-- que el panel admin pueda editarlo. Es un singleton (una sola fila activa).
--
-- Patrón de seguridad (igual que products / product_images):
--   - Lectura pública (anon, authenticated) vía RLS.
--   - Escritura SOLO desde el server con service role (bypassa RLS). No se crea
--     ninguna policy de escritura para el cliente.

-- Función genérica para mantener updated_at (idempotente).
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.combo_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NULL,
  subtitle text NULL,
  description text NULL,
  badges_json jsonb NULL,          -- ["Perfumero de regalo","Envío gratis","30% OFF"]
  showcase_title text NULL,
  showcase_subtitle text NULL,
  image_1_url text NULL,           -- storage_path en el bucket solution-products (o URL absoluta)
  image_2_url text NULL,           -- opcional: si null, showcase estático sin rotación
  select_label_1 text NULL,
  select_label_2 text NULL,
  options_json jsonb NULL,         -- { "<slug>": { "name": "...", "reference": "..." } }
  features_json jsonb NULL,        -- ["X2 perfumes a elección","Envío gratis...","2 cuotas..."]
  cta_text text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT combo_settings_pkey PRIMARY KEY (id)
);

-- Trigger updated_at (igual criterio que el resto de las tablas editables).
DROP TRIGGER IF EXISTS set_combo_settings_updated_at ON public.combo_settings;
CREATE TRIGGER set_combo_settings_updated_at
BEFORE UPDATE ON public.combo_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS: lectura pública, escritura solo service role (server).
ALTER TABLE public.combo_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_combo_settings" ON public.combo_settings;
CREATE POLICY "allow_public_select_combo_settings"
ON public.combo_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Fila default (singleton) con TODOS los valores actuales hardcodeados, para que
-- la tienda siga mostrando exactamente lo mismo apenas se aplique la migración.
-- El guard NOT EXISTS evita duplicar la fila si la migración se corre de nuevo.
INSERT INTO public.combo_settings (
  title, subtitle, description, badges_json,
  showcase_title, showcase_subtitle, image_1_url, image_2_url,
  select_label_1, select_label_2, options_json, features_json, cta_text, is_active
)
SELECT
  'Llevá 2 perfumes.',
  'Pagá 30% menos.',
  'Armá tu combo con dos fragancias de la colección. Sumás un perfumero de regalo, envío gratis a todo el país y 30% OFF.',
  '["Perfumero de regalo","Envío gratis","30% OFF"]'::jsonb,
  'Colección completa',
  'Combo personalizable',
  'all-products/large/all-perfumes-vidrio.webp',
  'all-products/large/perfumes.webp',
  'Primera fragancia',
  'Segunda fragancia',
  '{
    "red-desire":   { "name": "RED DESIRE",   "reference": "STRONGER WITH YOU" },
    "yellow-bloom": { "name": "YELLOW BLOOM", "reference": "ERBA PURA" },
    "black-code":   { "name": "BLACK CODE",   "reference": "CREED AVENTUS" },
    "deep-blue":    { "name": "DEEP BLUE",    "reference": "BLEU DE CHANEL" },
    "white-ice":    { "name": "WHITE ICE",    "reference": "ACQUA DI GIO" }
  }'::jsonb,
  '["X2 perfumes a elección","Envío gratis a todo el país","2 cuotas sin interés"]'::jsonb,
  'Agregar combo al carrito',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.combo_settings);
