# Secrets para wholesale-review

Configurar en **Supabase Dashboard → Edge Functions → wholesale-review → Secrets**:

| Secret | Obligatorio | Descripción |
|--------|-------------|-------------|
| `SUPABASE_URL` | Sí | URL del proyecto (ej. https://xxx.supabase.co). |
| `SUPABASE_ANON_KEY` | Sí | Anon key del proyecto. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role key (solo backend). |
| `RESEND_API_KEY` | Sí (prod) | API key de Resend (https://resend.com). Si falta, no se envían emails (solo log). |
| `RESEND_FROM_EMAIL` | Sí (prod) | Remitente (ej. `Solution <no-reply@solution.com>`). Si falta, no se envían emails (solo log). |
| `SITE_URL` | Recomendado | Origen del front (ej. https://solution.com o http://localhost:5173). Links en emails y redirect del invite. Se usa `VITE_SITE_URL` si `SITE_URL` no está. |
| `DISABLE_SUPABASE_INVITES` | Opcional | `"true"` = no llamar `inviteUserByEmail` (evitar rate limits en testing). `"false"` o no definido = flujo producción con invite + email Resend. |

## Resumen

- **Producción:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SITE_URL` (o `VITE_SITE_URL`). `DISABLE_SUPABASE_INVITES` en `"false"` o sin definir.
- **Testing:** `DISABLE_SUPABASE_INVITES=true` para no disparar invites de Supabase; los emails se envían igual por Resend si las keys están configuradas.
