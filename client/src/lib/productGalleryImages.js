const BASE_FOLDER = 'medium';

const GALLERY_MAP = {
  'black-code': [
    { path: 'black-code/medium/black-code.webp', type: 'packshot' },
    { path: 'black-code/medium/bc-arriba.webp', type: 'detail' },
    { path: 'modelo/black-code-modelo.webp', type: 'scene' },
    { path: 'black-code/medium/bc-notas.webp', type: 'notes' },
  ],
  'deep-blue': [
    { path: 'deep-blue/medium/deep-blue.webp', type: 'packshot' },
    { path: 'deep-blue/medium/db-arriba.webp', type: 'detail' },
    { path: 'modelo/deep-blue-modelo.webp', type: 'scene' },
    { path: 'deep-blue/medium/dp-notas.webp', type: 'notes' },
  ],
  'white-ice': [
    { path: 'white-ice/medium/white-ice.webp', type: 'packshot' },
    { path: 'white-ice/medium/wi-arriba.webp', type: 'detail' },
    { path: 'modelo/white-ice-modelo.webp', type: 'scene' },
    { path: 'white-ice/medium/wi-notas.webp', type: 'notes' },
  ],
  'yellow-bloom': [
    { path: 'yellow-bloom/medium/yellow-bloom.webp', type: 'packshot' },
    { path: 'yellow-bloom/yellow-bloom-bw.webp', type: 'scene' },
    { path: 'modelo/modelo-yellow-bloom.webp', type: 'detail' },
    { path: 'yellow-bloom/medium/yb-notas.webp', type: 'notes' },
  ],
  'red-desire': [
    { path: 'red-desire/medium/red-desire.webp', type: 'packshot' },
    { path: 'red-desire/medium/rd-arriba.webp', type: 'detail' },
    { path: 'modelo/red-desire-modelo.webp', type: 'scene' },
    { path: 'modelo/red-desire-atomizacion-2.webp', type: 'scene' },
    { path: 'red-desire/medium/rd-notas.webp', type: 'notes' },
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

