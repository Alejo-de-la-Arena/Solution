import { supabase } from '../lib/supabaseClient';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function getAccessToken() {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
  if (!session?.access_token) throw new Error('No session / missing access token');
  return session.access_token;
}

/**
 * Trae las métricas del dashboard admin (facturación, ventas, usuarios, serie 30d).
 * GET /api/admin/metrics — requiere JWT de admin.
 */
export async function getMetrics() {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}
