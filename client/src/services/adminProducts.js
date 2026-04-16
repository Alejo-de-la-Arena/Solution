import { supabase } from '../lib/supabaseClient';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function getAccessToken() {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
  if (!session?.access_token) throw new Error('No session / missing access token');
  return session.access_token;
}

async function handleJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || (Array.isArray(data?.details) ? data.details.join(' · ') : null) || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function listAdminProducts() {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleJson(res);
  return data.products ?? [];
}

export async function getAdminProduct(productId) {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/products/${encodeURIComponent(productId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await handleJson(res);
  return data.product;
}

export async function updateAdminProduct(productId, fields) {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const data = await handleJson(res);
  return data.product;
}

export async function uploadAdminProductImage(productId, file, role, sortOrder = null) {
  const token = await getAccessToken();
  const form = new FormData();
  form.append('file', file);
  form.append('role', role);
  if (sortOrder !== null && sortOrder !== undefined) form.append('sort_order', String(sortOrder));

  const res = await fetch(`${API_URL}/api/admin/products/${encodeURIComponent(productId)}/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await handleJson(res);
  return data.image;
}

export async function reorderAdminProductImages(productId, items) {
  const token = await getAccessToken();
  const res = await fetch(`${API_URL}/api/admin/products/${encodeURIComponent(productId)}/images/reorder`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return handleJson(res);
}

export async function deleteAdminProductImage(productId, imageId) {
  const token = await getAccessToken();
  const res = await fetch(
    `${API_URL}/api/admin/products/${encodeURIComponent(productId)}/images/${encodeURIComponent(imageId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  );
  return handleJson(res);
}
