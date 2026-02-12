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

## 6. Resumen de archivos tocados

- `supabase/config.toml` – `[functions.wholesale-review]` con `verify_jwt = false`.
- `supabase/functions/wholesale-review/config.toml` – comentarios y `verify_jwt = false`.
- `supabase/functions/wholesale-review/index.ts` – log seguro `authHeaderPresent`, GET `{ pong, authHeaderPresent }`, uso de `authRaw`.
- `client/src/services/admin.js` – `refreshSession()` + `session.access_token`, log dev con `tokenLength` y `tokenPrefix`.
