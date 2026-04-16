import { supabase } from '../lib/supabaseClient';
import { mediaUrl } from '../lib/mediaUrl';

/**
 * Productos activos para la tienda pública. Orden por sort_order.
 * Incluye product_images para que la UI pueda elegir por role (store_default,
 * store_hover, gallery) sin ida y vuelta extra.
 */
export async function getPublicProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(id, storage_path, role, sort_order)')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Un producto por slug (para página /producto/:slug).
 */
export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(id, storage_path, role, sort_order)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

/**
 * Mapea una fila de `products` (con product_images) al shape `perfume`
 * que consumen Tienda, Producto, HeroSection, etc.
 * DB es la única fuente de verdad.
 */
export function productToPerfume(p) {
  if (!p) return null;

  const images = Array.isArray(p.product_images) ? p.product_images : [];
  const rawFallback =
    images.find((i) => i.role === 'store_default')?.storage_path ||
    images[0]?.storage_path ||
    p.image_url ||
    '';
  const fallbackImage = rawFallback
    ? (rawFallback.startsWith('http') ? rawFallback : mediaUrl(rawFallback))
    : '';

  return {
    id: p.slug,
    productId: p.id,
    slug: p.slug,
    name: p.name || '',
    tagline: p.tagline || '',
    price: Number(p.price_retail) || 0,
    price_wholesale: Number(p.price_wholesale) || 0,
    image: fallbackImage,
    images,
    intensity: Number(p.intensidad || 0),
    family: p.family || p.perfil_olfativo || '',
    feeling: p.perfil_olfativo || p.family || '',
    personality: p.personality || '',
    tipo_de_uso: p.tipo_de_uso || '',
    ocasion: p.ocasion || '',
    usage: p.momento_ideal || p.tipo_de_uso || '',
    description: p.description || '',
    descriptionParagraphs: Array.isArray(p.description_paragraphs) ? p.description_paragraphs : [],
    shortDescription: p.short_description || p.description || '',
    profileGeneral: p.profile_general || '',
    accent_color: p.accent_color || '',
    notes: {
      top: Array.isArray(p.notes_top) ? p.notes_top : (Array.isArray(p.notas_principales) ? p.notas_principales : []),
      heart: Array.isArray(p.notes_heart) ? p.notes_heart : [],
      base: Array.isArray(p.notes_base) ? p.notes_base : [],
    },
  };
}
