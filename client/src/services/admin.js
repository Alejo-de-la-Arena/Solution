import { supabase } from '../lib/supabaseClient';

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
