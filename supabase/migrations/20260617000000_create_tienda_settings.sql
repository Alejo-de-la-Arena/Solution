-- Textos editables de /tienda desde el admin.
-- Todos los títulos, subtítulos y eyebrows de las secciones de Tienda.jsx
-- viven hardcodeados. Esta tabla los mueve a la DB para que el panel admin
-- pueda editarlos. Singleton (una sola fila, igual que combo_settings).
--
-- Patrón de seguridad (idéntico a combo_settings):
--   - Lectura pública (anon, authenticated) vía RLS.
--   - Escritura SOLO desde el server con service role (bypassa RLS).

CREATE TABLE IF NOT EXISTS public.tienda_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Sección hero
  hero_title        text NULL,
  hero_subtitle     text NULL,

  -- Sección colección (sliders de productos)
  coleccion_eyebrow       text NULL,
  coleccion_title         text NULL,
  coleccion_row1_label    text NULL,
  coleccion_row1_subtitle text NULL,
  coleccion_row2_label    text NULL,
  coleccion_row2_subtitle text NULL,

  -- Sección videos ("Lo que dicen ellos")
  videos_eyebrow      text NULL,
  videos_title        text NULL,
  videos_title_em     text NULL,   -- parte en cursiva del título
  videos_subtitle     text NULL,
  videos_description  text NULL,

  -- Sección testimonios
  testimonios_eyebrow text NULL,
  testimonios_title   text NULL,

  -- Sección CTA final ("¿Cuál es tu momento?")
  cta_eyebrow      text NULL,
  cta_title        text NULL,
  cta_description  text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tienda_settings_pkey PRIMARY KEY (id)
);

-- Trigger updated_at (idéntico al de combo_settings).
DROP TRIGGER IF EXISTS set_tienda_settings_updated_at ON public.tienda_settings;
CREATE TRIGGER set_tienda_settings_updated_at
BEFORE UPDATE ON public.tienda_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS: lectura pública, escritura solo service role (server).
ALTER TABLE public.tienda_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_public_select_tienda_settings" ON public.tienda_settings;
CREATE POLICY "allow_public_select_tienda_settings"
ON public.tienda_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Fila default con los textos actuales hardcodeados en Tienda.jsx.
-- NOT EXISTS evita duplicar la fila si la migración se corre de nuevo.
INSERT INTO public.tienda_settings (
  hero_title, hero_subtitle,
  coleccion_eyebrow, coleccion_title,
  coleccion_row1_label, coleccion_row1_subtitle,
  coleccion_row2_label, coleccion_row2_subtitle,
  videos_eyebrow, videos_title, videos_title_em,
  videos_subtitle, videos_description,
  testimonios_eyebrow, testimonios_title,
  cta_eyebrow, cta_title, cta_description
)
SELECT
  'Cinco fragancias.',
  'Tu momento.',
  'La colección',
  'Elegí tu fragancia.',
  'Noche & Salidas',
  NULL,
  'Día & Movimiento',
  NULL,
  'En sus palabras',
  'Lo que dicen',
  'ellos',
  NULL,
  NULL,
  'Voces reales',
  'Lo que dicen quienes lo usan',
  'Encontrá el tuyo',
  '¿Cuál es tu momento?',
  'Cada fragancia tiene un propósito. Elegí la que va con tu día.'
WHERE NOT EXISTS (SELECT 1 FROM public.tienda_settings);
