/**
 * Devuelve { default, hover } con los storage_path de las imágenes
 * de tienda para un producto. Lee desde product.images (role = store_default
 * / store_hover), que llega embebido desde productToPerfume().
 */
export function getStoreProductImages(product) {
    const images = Array.isArray(product?.images) ? product.images : [];
    const def = images.find((i) => i.role === 'store_default')?.storage_path || null;
    const hover = images.find((i) => i.role === 'store_hover')?.storage_path || null;
    return { default: def, hover };
}
