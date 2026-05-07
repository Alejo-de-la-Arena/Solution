import { supabase } from '../lib/supabaseClient';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function authHeader() {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
  if (!session?.access_token) {
    throw new Error('No session / missing access token');
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function gestionarDiscovery() {
  const headers = await authHeader();
  const res = await fetch(`${API_URL}/api/admin/gestionar/discovery`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}

export async function gestionarLinkCatalog() {
  const headers = await authHeader();
  const res = await fetch(`${API_URL}/api/admin/gestionar/link-catalog`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}

export async function gestionarDispatchNow({ orderId = null, limit = 50 } = {}) {
  const headers = await authHeader();
  const res = await fetch(`${API_URL}/api/admin/gestionar/dispatch-now`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, limit }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}
