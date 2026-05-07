/**
 * Galería del detalle del producto: imágenes (role='gallery') + videos.
 *
 * Devuelve items mixtos `{ kind: 'image' | 'video', path, id, poster? }`.
 * Imágenes primero (ordenadas por sort_order), luego videos (idem). El admin
 * gestiona cada lista por separado; v1 no soporta interleaving.
 *
 * Si no hay nada y se pasó `fallbackImage`, devuelve un único item imagen
 * para no romper el render (mismo patrón que getProductGalleryImages).
 */
export function getProductGalleryMedia(product, fallbackImage) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const videos = Array.isArray(product?.videos) ? product.videos : [];

  const galleryImages = images
    .filter((i) => i.role === 'gallery')
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((i) => ({ kind: 'image', path: i.storage_path, id: `i-${i.id}` }));

  const galleryVideos = videos
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((v) => ({
      kind: 'video',
      path: v.storage_path,
      id: `v-${v.id}`,
      poster: v.poster_storage_path || null,
    }));

  const items = [...galleryImages, ...galleryVideos];
  if (items.length > 0) return items;
  if (fallbackImage) return [{ kind: 'image', path: fallbackImage, id: 'fallback' }];
  return [];
}
