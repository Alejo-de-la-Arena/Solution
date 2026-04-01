const BASE_FOLDER = 'medium';

const GALLERY_MAP = {
  'black-code': [
    { path: 'black-code/black-code-individual.jpg', type: 'packshot' },
    { path: 'black-code/black-code-combo.jpg', type: 'notes' },
    { path: 'black-code/large/bc-arriba.webp', type: 'detail' },
    { path: 'modelo/black-code-modelo.webp', type: 'scene' },
  ],
  'deep-blue': [
    { path: 'deep-blue/deep-blue-individual.jpg', type: 'packshot' },
    { path: 'deep-blue/deep-blue-combo.jpg', type: 'notes' },
    { path: 'deep-blue/large/db-arriba.webp', type: 'detail' },
    { path: 'modelo/deep-blue-modelo.webp', type: 'scene' },
  ],
  'white-ice': [
    { path: 'white-ice/white-ice-individual.jpg', type: 'packshot' },
    { path: 'white-ice/white-ice-combo.jpg', type: 'notes' },
    { path: 'white-ice/large/wi-arriba.webp', type: 'detail' },
    { path: 'modelo/white-ice-modelo.webp', type: 'scene' },
  ],
  'yellow-bloom': [
    { path: 'yellow-bloom/yellow-bloom-individual.jpg', type: 'packshot' },
    { path: 'yellow-bloom/yellow-bloom-combo.jpg', type: 'notes' },
    { path: 'yellow-bloom/yellow-bloom-bw.webp', type: 'scene' },
    { path: 'modelo/modelo-yellow-bloom.webp', type: 'detail' },
  ],
  'red-desire': [
    { path: 'red-desire/red-desire-individual.jpg', type: 'packshot' },
    { path: 'red-desire/red-desire-combo.jpg', type: 'notes' },
    { path: 'red-desire/large/rd-arriba.webp', type: 'detail' },
    { path: 'modelo/red-desire-modelo.webp', type: 'scene' },
    { path: 'modelo/red-desire-atomizacion-2.webp', type: 'scene' },
  ],
};

export function getProductGalleryImages(slug, fallbackImage) {
  const key = (slug || '').trim().toLowerCase();
  const items = GALLERY_MAP[key];

  if (items && items.length > 0) {
    return items;
  }

  if (fallbackImage) {
    return [{ path: fallbackImage, type: 'fallback' }];
  }

  return [];
}

export { GALLERY_MAP as PRODUCT_GALLERY_MAP, BASE_FOLDER as PRODUCT_GALLERY_BASE_FOLDER };

