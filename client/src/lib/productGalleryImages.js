/**
 * Imágenes de la galería del detalle del producto.
 * Lee desde product.images (role = 'gallery'), ordenadas por sort_order.
 * Si no hay ninguna, cae al fallbackImage pasado por el caller.
 */
export function getProductGalleryImages(product, fallbackImage) {
  const images = Array.isArray(product?.images) ? product.images : [];
  const gallery = images
    .filter((i) => i.role === 'gallery')
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((i) => ({ path: i.storage_path, id: i.id }));

  if (gallery.length > 0) return gallery;
  if (fallbackImage) return [{ path: fallbackImage, id: 'fallback' }];
  return [];
}
