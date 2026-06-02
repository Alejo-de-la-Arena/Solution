import { supabase } from '../lib/supabaseClient';
import { mediaUrl } from '../lib/mediaUrl';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// ─── Defaults (fallback si la query falla o no hay fila) ─────────────────────
// Reflejan EXACTAMENTE el contenido hardcodeado original del combo, así la
// tienda nunca queda vacía aunque el backend/DB no respondan.
export const COMBO_DEFAULTS = {
  title: 'Llevá 2 perfumes.',
  subtitle: 'Pagá 30% menos.',
  description:
    'Armá tu combo con dos fragancias de la colección. Sumás un perfumero de regalo, envío gratis a todo el país y 30% OFF.',
  badges: ['Perfumero de regalo', 'Envío gratis', '30% OFF'],
  showcase_title: 'Colección completa',
  showcase_subtitle: 'Combo personalizable',
  image_1: 'all-products/large/all-perfumes-vidrio.webp',
  image_2: 'all-products/large/perfumes.webp',
  select_label_1: 'Primera fragancia',
  select_label_2: 'Segunda fragancia',
  options: {
    'red-desire': { name: 'RED DESIRE', reference: 'STRONGER WITH YOU' },
    'yellow-bloom': { name: 'YELLOW BLOOM', reference: 'ERBA PURA' },
    'black-code': { name: 'BLACK CODE', reference: 'CREED AVENTUS' },
    'deep-blue': { name: 'DEEP BLUE', reference: 'BLEU DE CHANEL' },
    'white-ice': { name: 'WHITE ICE', reference: 'ACQUA DI GIO' },
  },
  features: ['X2 perfumes a elección', 'Envío gratis a todo el país', '2 cuotas sin interés'],
  cta_text: 'Agregar combo al carrito',
};

/**
 * Resuelve una imagen del combo: si es URL absoluta la usa tal cual, si es un
 * storage_path lo resuelve con mediaUrl(). Devuelve null si está vacía.
 */
export function resolveComboImage(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return mediaUrl(value);
}

/**
 * Normaliza una fila cruda de combo_settings al shape amigable que consume la
 * tienda, aplicando defaults campo por campo (nunca devuelve null).
 */
export function normalizeComboSettings(row) {
  const d = COMBO_DEFAULTS;
  if (!row) return { ...d };
  const badges = Array.isArray(row.badges_json) ? row.badges_json : d.badges;
  const features = Array.isArray(row.features_json) ? row.features_json : d.features;
  const options =
    row.options_json && typeof row.options_json === 'object' && !Array.isArray(row.options_json)
      ? row.options_json
      : d.options;
  return {
    title: row.title ?? d.title,
    subtitle: row.subtitle ?? d.subtitle,
    description: row.description ?? d.description,
    badges,
    showcase_title: row.showcase_title ?? d.showcase_title,
    showcase_subtitle: row.showcase_subtitle ?? d.showcase_subtitle,
    image_1: row.image_1_url ?? d.image_1,
    image_2: row.image_2_url ?? null, // si está vacía → showcase estático
    select_label_1: row.select_label_1 ?? d.select_label_1,
    select_label_2: row.select_label_2 ?? d.select_label_2,
    options,
    features,
    cta_text: row.cta_text ?? d.cta_text,
  };
}

// ─── Lectura pública (tienda) — directo de Supabase, igual que products ──────
export async function getComboSettings() {
  const { data, error } = await supabase
    .from('combo_settings')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data; // fila cruda (o null)
}

// ─── Admin — escritura/subida vía backend (service role), patrón products ────
async function getAccessToken() {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
  if (!session?.access_token) throw new Error('No session / missing access token');
  return session.access_token;
}

async function handleJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.error ||
      (Array.isArray(data?.details) ? data.details.join(' · ') : null) ||
      `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

/** Lee el singleton para el admin (aunque esté inactivo). */
export async function getComboSettingsAdmin() {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/combo`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleJson(res);
  return data.combo;
}

/** Actualiza el singleton (solo admin). */
export async function updateComboSettings(fields) {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/combo`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const data = await handleJson(res);
  return data.combo;
}

/** Sube una imagen al bucket de productos. Devuelve { path, url }. */
export async function uploadComboImage(file) {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_URL}/api/admin/combo/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await handleJson(res);
  return data.image; // { path, url }
}
