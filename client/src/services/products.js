import { supabase } from '../lib/supabaseClient';
import { PERFUMES_BY_SLUG } from '../data/perfumes';

/**
 * Productos activos para la tienda pública. Orden por sort_order.
 * Devuelve filas de Supabase; la UI puede mapear a la forma esperada (ej. perfume).
 */
export async function getPublicProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Formato “perfume” para componentes que esperan la forma de perfumes.js.
 */
export function productToPerfume(p) {
  if (!p) return null;
  const localPerfume = PERFUMES_BY_SLUG[p.slug];
  const notes = localPerfume?.notes || { top: p.notas_principales || [], heart: [], base: [] };

  return {
    id: p.slug,             
    productId: p.id,         
    name: localPerfume?.name || p.name,
    tagline: localPerfume ? localPerfume.tagline : (p.tagline || ''),
    price: Number(p.price_retail) || 0,
    image: localPerfume?.image || p.image_url || '',
    intensity: localPerfume?.intensity ?? Number(p.intensidad || 0),
    feeling: localPerfume?.feeling || p.perfil_olfativo || '',
    family: localPerfume?.family || p.perfil_olfativo || '',
    personality: localPerfume?.personality || '',
    notes,
    usage: localPerfume?.usage || p.momento_ideal || p.tipo_de_uso || '',
    tipo_de_uso: localPerfume?.tipo_de_uso || p.tipo_de_uso || '',
    ocasion: localPerfume?.ocasion || p.ocasion || '',
    description: localPerfume?.description || p.description || '',
    descriptionParagraphs: localPerfume?.descriptionParagraphs || [],
    shortDescription: localPerfume?.shortDescription || p.description || '',
    profileGeneral: localPerfume?.profileGeneral || '',
    accent_color: p.accent_color || localPerfume?.accent_color,
    slug: p.slug,
    price_wholesale: Number(p.price_wholesale) || 0,
  };
}
/**
 * Un producto por slug (para página /producto/:slug).
 */
export async function getProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}
