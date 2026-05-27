const { supabase, supabaseAuth } = require('./supabase');

/**
 * Verifica que el request lleve un Bearer token de un usuario admin.
 * Si OK, devuelve el `user` de Supabase. Si no, responde con el status
 * apropiado (401/403/503) y devuelve null.
 *
 * Reglas de admin (cualquiera de las dos):
 *  - profiles.role = 'admin'
 *  - existe fila en admins con user_id
 */
async function assertAdmin(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Falta token de autorización' });
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    res.status(401).json({ error: 'Token inválido' });
    return null;
  }
  if (!supabaseAuth) {
    res.status(503).json({ error: 'Auth no configurado (SUPABASE_ANON_KEY)' });
    return null;
  }
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return null;
  }
  if (!supabase) {
    res.status(503).json({ error: 'Base de datos no configurada' });
    return null;
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const isAdminByRole = profile?.role === 'admin';
  const { data: adminRow } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
  const isAdmin = isAdminByRole || !!adminRow;
  if (!isAdmin) {
    res.status(403).json({ error: 'Solo administradores' });
    return null;
  }
  return user;
}

/**
 * Variante no-throwing de assertAdmin: NO escribe en res ni lanza. Devuelve
 * true si el bearer token del request pertenece a un admin, false en cualquier
 * otro caso (falta token, token inválido, user no admin, error transitorio).
 *
 * Pensado para endpoints que aceptan a cualquiera pero quieren saber si quien
 * llama es admin (ej. checkout: si admin, aplicar precio de prueba).
 */
async function isRequestAdmin(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token || !supabaseAuth || !supabase) return false;
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    if (error || !user) return false;
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role === 'admin') return true;
    const { data: adminRow } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return !!adminRow;
  } catch {
    return false;
  }
}

module.exports = { assertAdmin, isRequestAdmin };
