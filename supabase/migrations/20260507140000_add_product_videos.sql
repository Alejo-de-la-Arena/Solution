-- Videos de producto: el cliente sube clips cortos (mp4/webm hasta 50 MB) que
-- se muestran en la galería del detalle de cada producto. Schema mirror de
-- product_images, sin la columna `role` (todos los videos van al carrusel del
-- detalle; v1 no soporta videos en /tienda).

CREATE TABLE IF NOT EXISTS public.product_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    poster_storage_path TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_videos_product_sort
    ON public.product_videos (product_id, sort_order);

COMMENT ON TABLE public.product_videos IS
    'Videos asociados a un producto, ordenados para la galería de /producto/:slug.';
COMMENT ON COLUMN public.product_videos.storage_path IS
    'Path dentro del bucket solution-products (ej: deep-blue/admin/videos/{uuid}.mp4).';
COMMENT ON COLUMN public.product_videos.poster_storage_path IS
    'Path opcional al frame de portada (no se usa en v1; reservado para futuro).';

-- RLS: SELECT público (igual que product_images). El admin escribe via service
-- role del server (bypassea RLS).
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_public_select_product_videos"
    ON public.product_videos
    FOR SELECT
    TO anon, authenticated
    USING (true);
