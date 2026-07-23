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

/**
 * Elimina un gasto fijo.
 *  - purge=false (default): cierre suave (effective_until = hoy). Deja de
 *    aplicar pero sigue impactando los meses donde ya estuvo vigente.
 *  - purge=true: borrado real de TODOS los períodos (gastos de prueba/error).
 */
export async function deleteFixedExpense(id, { purge = false } = {}) {
  const qs = purge ? '?purge=true' : '';
  return adminFetch(`/expenses/${encodeURIComponent(id)}${qs}`, { method: 'DELETE' });
}

// ── Pauta publicitaria (gasto diario variable) ───────────────────────────────

export async function listDailyPauta(from, to) {
  const params = new URLSearchParams({ from, to });
  const data = await adminFetch(`/daily-expenses?${params.toString()}`);
  return data.items || [];
}

/** Carga (upsert) la pauta de un día. amount puede ser 0 (= confirmado sin pauta). */
export async function setDailyPauta(date, amount, { category = 'pauta', notes } = {}) {
  return adminFetch(`/daily-expenses/${encodeURIComponent(date)}`, {
    method: 'PUT',
    body: JSON.stringify({ amount, category, ...(notes != null ? { notes } : {}) }),
  });
}

/** Borra la pauta de un día → vuelve a estado "no cargado" (reactiva el aviso). */
export async function clearDailyPauta(date, { category = 'pauta' } = {}) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return adminFetch(`/daily-expenses/${encodeURIComponent(date)}${qs}`, { method: 'DELETE' });
}

// ── Cargo mensual sobre facturación (switch on/off + %) ──────────────────────

/** Prende/apaga y fija el % del cargo sobre facturación de un mes (YYYY-MM). */
export async function setMonthlyCharge(month, { enabled, percentage }) {
  return adminFetch(`/monthly-charges/${encodeURIComponent(month)}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled, percentage }),
  });
}

// ── Reporte ────────────────────────────────────────────────────────────────

export async function getFinanceReport(from, to, { daily = false } = {}) {
  const params = new URLSearchParams({ from, to });
  if (daily) params.set('daily', 'true');
  return adminFetch(`/report?${params.toString()}`);
}
