import { supabase } from '../lib/supabaseClient';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Lista pedidos (retail/mayorista) vía backend. Requiere JWT de admin.
 * @param {{ channel?: string, status?: string, dateFrom?: string, dateTo?: string, q?: string }} filters
 */
export async function getAdminOrders(filters = {}) {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
  if (!session?.access_token) {
    throw new Error('No session / missing access token');
  }

  const params = new URLSearchParams();
  if (filters.channel) params.set('channel', filters.channel);
  if (filters.status) params.set('status', filters.status);
  if (filters.dateFrom) params.set('date_from', filters.dateFrom);
  if (filters.dateTo) params.set('date_to', filters.dateTo);
  if (filters.q) params.set('q', filters.q);
  const qs = params.toString();
  const url = `${API_URL}/api/admin/orders${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data.orders ?? [];
}

/**
 * Actualiza el estado de un pedido (admin).
 * @param {string} orderId
 * @param {string} status
 */
export async function updateAdminOrderStatus(orderId, status) {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
  if (!session?.access_token) {
    throw new Error('No session / missing access token');
  }

  const url = `${API_URL}/api/admin/orders/${encodeURIComponent(orderId)}/status`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.hint || `Error ${res.status}`);
  }
  return data;
}

/**
 * Solicita reembolso Nave para una orden en estado paid (admin).
 * @param {string} orderId - UUID de orders
 */
export async function refundNaveOrder(orderId) {
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;
  if (!session?.access_token) {
    throw new Error('No session / missing access token');
  }

  const url = `${API_URL}/api/admin/orders/${encodeURIComponent(orderId)}/refund`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.detail?.message || `Error ${res.status}`);
  }
  return data;
}

/**
 * Lista solicitudes mayoristas con filtro opcional por status.
 * Requiere sesión de admin (RLS).
 */
export async function listWholesaleApplications(status = null) {
  let query = supabase
    .from('wholesale_applications')
    .select('*')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Aprueba o rechaza una solicitud mayorista.
 * Usa session.access_token (no refresh_token). Refresca la sesión antes para enviar un token válido
 * cuando el gateway tiene verify_jwt=true.
 * @param {string} applicationId - UUID de wholesale_applications
 * @param {'approve'|'reject'} decision
 * @param {'A'|'B'} [plan] - Obligatorio si decision === 'approve'
 */
export async function reviewWholesaleApplication(applicationId, decision, plan = null) {
  // Refrescar sesión para tener access_token válido (evita "Invalid JWT" si el gateway valida)
  const { data: refreshData } = await supabase.auth.refreshSession();
  const session = refreshData?.session ?? (await supabase.auth.getSession()).data?.session;

  if (!session?.access_token) {
    throw new Error('No session / missing access token');
  }

  // Siempre usar access_token (nunca refresh_token)
  const accessToken = session.access_token;

  if (import.meta.env.DEV) {
    const tokenLength = accessToken?.length ?? 0;
    const tokenPrefix = accessToken ? accessToken.substring(0, 10) + '…' : '(none)';
    console.debug('[admin] reviewWholesaleApplication: tokenLength=', tokenLength, 'tokenPrefix=', tokenPrefix);
  }

  const body = {
    application_id: applicationId,
    decision,
    plan: decision === 'approve' ? plan : undefined,
  };

  const url = `${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/functions/v1/wholesale-review`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey || '',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message ?? data?.error ?? `Error ${res.status}`);
  }

  if (data?.error) {
    throw new Error(data.message || data.error || 'Error en la función');
  }

  return data;
}

export async function listWholesaleOrdersForUser(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("channel", "wholesale")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}