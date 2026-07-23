const SUPABASE_STORAGE_BASE = import.meta.env.VITE_SUPABASE_STORAGE_BASE;

// Videos migraron a R2 (bucket plano, sin subcarpetas); imágenes siguen en Supabase.
const R2_VIDEO_BASE = import.meta.env.VITE_R2_BASE_URL || 'https://pub-83d3712d47a849629a299c4d9f15a5b6.r2.dev';
const VIDEO_EXT_RE = /\.(mp4|webm|mov)$/i;

export function mediaUrl(path) {
  if (VIDEO_EXT_RE.test(path)) {
    const basename = path.split('/').pop();
    return `${R2_VIDEO_BASE}/${basename}`;
  }
  return `${SUPABASE_STORAGE_BASE}/${path}`;
}