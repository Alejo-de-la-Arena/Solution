import { supabase } from '../lib/supabaseClient';

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
  return {
    id: p.slug,
    name: p.name,
    tagline: p.tagline || '',
    price: Number(p.price_retail) || 0,
    image: p.image_url || '',
    intensity: Number(p.intensidad) ?? 0,
    feeling: p.perfil_olfativo || '',
    notes: { top: p.notas_principales || [] },
    usage: p.momento_ideal || p.tipo_de_uso || '',
    tipo_de_uso: p.tipo_de_uso || '',
    ocasion: p.ocasion || '',
    description: p.description || '',
    accent_color: p.accent_color,
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
