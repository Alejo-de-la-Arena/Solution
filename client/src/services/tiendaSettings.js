import { supabase } from '../lib/supabaseClient';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// ─── Defaults (fallback si la query falla o no hay fila) ─────────────────────
// Reflejan EXACTAMENTE el contenido hardcodeado original de Tienda.jsx, así
// la tienda nunca queda vacía aunque el backend/DB no respondan.
export const TIENDA_DEFAULTS = {
  hero_title:             'Cinco fragancias.',
  hero_subtitle:          'Tu momento.',
  coleccion_eyebrow:      'La colección',
  coleccion_title:        'Elegí tu fragancia.',
  coleccion_row1_label:   'Noche & Salidas',
  coleccion_row1_subtitle: null,
  coleccion_row2_label:   'Día & Movimiento',
  coleccion_row2_subtitle: null,
  videos_eyebrow:         'En sus palabras',
  videos_title:           'Lo que dicen',
  videos_title_em:        'ellos',
  videos_subtitle:        null,
  videos_description:     null,
  testimonios_eyebrow:    'Voces reales',
  testimonios_title:      'Lo que dicen quienes lo usan',
  cta_eyebrow:            'Encontrá el tuyo',
  cta_title:              '¿Cuál es tu momento?',
  cta_description:        'Cada fragancia tiene un propósito. Elegí la que va con tu día.',
};

/**
 * Normaliza una fila cruda de tienda_settings al shape amigable que consume
 * Tienda.jsx, aplicando defaults campo por campo (nunca devuelve null).
 */
export function normalizeTiendaSettings(row) {
  const d = TIENDA_DEFAULTS;
  if (!row) return { ...d };
  return {
    hero_title:             row.hero_title             ?? d.hero_title,
    hero_subtitle:          row.hero_subtitle          ?? d.hero_subtitle,
    coleccion_eyebrow:      row.coleccion_eyebrow      ?? d.coleccion_eyebrow,
    coleccion_title:        row.coleccion_title        ?? d.coleccion_title,
    coleccion_row1_label:   row.coleccion_row1_label   ?? d.coleccion_row1_label,
    coleccion_row1_subtitle: row.coleccion_row1_subtitle ?? d.coleccion_row1_subtitle,
    coleccion_row2_label:   row.coleccion_row2_label   ?? d.coleccion_row2_label,
    coleccion_row2_subtitle: row.coleccion_row2_subtitle ?? d.coleccion_row2_subtitle,
    videos_eyebrow:         row.videos_eyebrow         ?? d.videos_eyebrow,
    videos_title:           row.videos_title           ?? d.videos_title,
    videos_title_em:        row.videos_title_em        ?? d.videos_title_em,
    videos_subtitle:        row.videos_subtitle        ?? d.videos_subtitle,
    videos_description:     row.videos_description     ?? d.videos_description,
    testimonios_eyebrow:    row.testimonios_eyebrow    ?? d.testimonios_eyebrow,
    testimonios_title:      row.testimonios_title      ?? d.testimonios_title,
    cta_eyebrow:            row.cta_eyebrow            ?? d.cta_eyebrow,
    cta_title:              row.cta_title              ?? d.cta_title,
    cta_description:        row.cta_description        ?? d.cta_description,
  };
}

// ─── Lectura pública (tienda) — directo de Supabase, igual que getComboSettings ─
export async function getTiendaSettings() {
  const { data, error } = await supabase
    .from('tienda_settings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data; // fila cruda (o null)
}

// ─── Admin — escritura/lectura vía backend (service role) ────────────────────
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

/** Lee el singleton para el admin. */
export async function getTiendaSettingsAdmin() {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/tienda-settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleJson(res);
  return data.tienda;
}

/** Actualiza el singleton (solo admin). */
export async function updateTiendaSettings(fields) {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/tienda-settings`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const data = await handleJson(res);
  return data.tienda;
}
