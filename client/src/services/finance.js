import { supabase } from '../lib/supabaseClient';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function adminFetch(path, init = {}) {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
  if (!session?.access_token) {
    throw new Error('No session / missing access token');
  }
  const url = `${API_URL}/api/admin/finance${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${session.access_token}`,
      ...(init.body && !(init.headers && init.headers['Content-Type'])
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}

// ── Costos por producto ─────────────────────────────────────────────────────

export async function listProductCosts() {
  const data = await adminFetch('/costs');
  return data.items || [];
}

export async function updateProductCost(productId, costPrice) {
  return adminFetch(`/costs/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: JSON.stringify({ cost_price: costPrice }),
  });
}

// ── Gastos fijos ────────────────────────────────────────────────────────────

export async function listFixedExpenses({ history = false } = {}) {
  const data = await adminFetch(`/expenses${history ? '?history=true' : ''}`);
  return data.items || [];
}

export async function createFixedExpense(expense) {
  return adminFetch('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
}

export async function updateFixedExpense(id, expense) {
  return adminFetch(`/expenses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(expense),
  });
}

export async function deleteFixedExpense(id) {
  return adminFetch(`/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// ── Reporte ────────────────────────────────────────────────────────────────

export async function getFinanceReport(from, to) {
  const params = new URLSearchParams({ from, to });
  return adminFetch(`/report?${params.toString()}`);
}
