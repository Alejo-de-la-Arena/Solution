# Checklist: wholesale-review Edge Function

## 1. Verificar que `verify_jwt` se aplica

- **Ubicación de config:**  
  - `supabase/config.toml` → sección `[functions.wholesale-review]` con `verify_jwt = false`.  
  - Opcional: `supabase/functions/wholesale-review/config.toml` con `verify_jwt = false`.
- **Deploy con flag (si la config no aplica):**
  ```bash
  supabase functions deploy wholesale-review --no-verify-jwt
  ```
- **Dashboard (fallback):** Si existe la opción, en **Supabase → Edge Functions → wholesale-review → Settings** desactivar "Verify JWT".

## 2. GET ping (diagnóstico)

- Abrir en el navegador:  
  `https://<project-ref>.supabase.co/functions/v1/wholesale-review`
- **Si `verify_jwt = false`:** respuesta **200** y body `{"pong":true,"authHeaderPresent":false}`.
- **Si `verify_jwt = true`:** respuesta **401** del gateway (p. ej. "Missing authorization header"); en Logs **no** aparece `FUNC_START_OK`.

## 3. Logs en Supabase

- **Supabase Dashboard → Edge Functions → wholesale-review → Logs.**
- Al hacer click en **Aprobar** en `/admin/mayoristas` debe aparecer una línea con `FUNC_START_OK` y `authHeaderPresent: true`.
- Si **no** aparece `FUNC_START_OK`, el 401 lo devuelve el gateway antes de ejecutar el handler.

## 4. curl con token (solo para probar)

- Obtener un `access_token` válido (p. ej. desde DevTools → Application → ver sesión o desde el log en dev `tokenPrefix` no sirve para copiar el token; usar Network o una extensión).
- Ejemplo (reemplazar `TOKEN` y `PROJECT_REF`):
  ```bash
  curl -i -X POST "https://PROJECT_REF.supabase.co/functions/v1/wholesale-review" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer TOKEN" \
    -H "apikey: ANON_KEY" \
    -d '{"application_id":"UUID","decision":"reject"}'
  ```
- Con `verify_jwt = false`: el request llega al handler; puede devolver 200 (rechazo) o 401/403 si el token es inválido o no es admin (nuestro código).
- Con `verify_jwt = true`: token inválido o expirado → 401 "Invalid JWT" del gateway; token válido → llega al handler.

## 5. Frontend: Aprobar en /admin/mayoristas

- Iniciar sesión como admin.
- Ir a **Admin → Mayoristas**, elegir una solicitud pendiente y hacer click en **Aprobar** (con plan A o B).
- **Esperado:** respuesta **200**, mensaje de éxito, lista se actualiza y en Logs aparece `FUNC_START_OK` con `authHeaderPresent: true`.
- En **dev**, en consola debe aparecer el log con `tokenLength` y `tokenPrefix`; al volver a iniciar sesión, `tokenPrefix` puede cambiar.

## 6. Secrets (emails Resend)

- Ver `SECRETS.md` en esta carpeta.
- Para que se envíen emails al aprobar/rechazar: agregar **RESEND_API_KEY** en Edge Functions → Secrets.
- Opcional: **RESEND_FROM_EMAIL** (remitente). **VITE_SITE_URL** o **SITE_URL** para links en el email.

## 7. Mini checklist flujo mayorista

- [ ] **Apruebo** → el registro sale de Pendientes, aparece en Aprobadas, llega email "Solicitud aprobada" con link a `/acceso`.
- [ ] **Rechazo** → el registro sale de Pendientes, aparece en Rechazadas, llega email "Solicitud rechazada" (sin link).
- [ ] **Usuario aprobado** (role=wholesale, wholesale_status=approved) entra a `/mayorista`; ve su plan (A/B) y precios.
- [ ] **Usuario no aprobado** o sin sesión que intenta `/mayorista` → redirige a `/programa-mayorista`.

## 8. Resumen de archivos tocados

- `supabase/config.toml` – `[functions.wholesale-review]` con `verify_jwt = false`.
- `supabase/functions/wholesale-review/config.toml` – comentarios y `verify_jwt = false`.
- `supabase/functions/wholesale-review/index.ts` – log seguro, GET pong, idempotencia 409, emails Resend (aprobado/rechazado).
- `client/src/pages/admin/AdminMayoristas.jsx` – 3 secciones (Pendientes/Aprobadas/Rechazadas), selects dark, loading, deshabilitar ya revisados.
- `client/src/guards/WholesaleRoute.jsx` – redirect a `/programa-mayorista` si no aprobado.
- `client/src/services/admin.js` – refetch ya manejado en el componente.
