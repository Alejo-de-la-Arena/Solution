# Mercado Pago — Pasos para producción (cliente)

Guía breve para activar pagos reales con Mercado Pago en esta plataforma. Está alineada con la integración actual (API de órdenes, webhooks y checkout en el sitio).

---

## Qué vas a conseguir al final

| Dato | Dónde lo usa la plataforma |
|------|----------------------------|
| **Public Key** (producción) | Sitio web (frontend) — variable `VITE_MP_PUBLIC_KEY` |
| **Access Token** (producción) | Servidor (backend) — variable `MP_ACCESS_TOKEN` |
| **Clave secreta de webhooks** | Servidor — variable `MP_WEBHOOK_SECRET` |
| **URL pública HTTPS del webhook** | La configurás en el panel de Mercado Pago (ver más abajo) |

> **Importante:** el *Access Token* y la *clave secreta de webhooks* son secretos. No los compartas por email ni los subas a repositorios públicos. Solo deben estar en el servidor o en variables de entorno del hosting.

---

## 1. Cuenta y aplicación en Mercado Pago

1. Ingresá a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app) con la cuenta del negocio que va a cobrar.
2. En **Tus integraciones**, creá o elegí la **aplicación** que usa este proyecto (una sola app suele alcanzar).

---

## 2. Activar credenciales de producción

Los pagos de prueba y los de producción usan la **misma URL de API**; lo que cambia son las **credenciales** (prueba vs producción).

1. En el panel: **Tus integraciones → tu aplicación → Producción → Credenciales de producción**.
2. Seguí el asistente para **activar** producción: Mercado Pago pedirá **datos del negocio** (razón social, datos fiscales, etc.) hasta dejar la cuenta habilitada para cobrar de verdad.
3. Cuando esté activo, copiá:
   - **Public Key** (producción)
   - **Access Token** (producción)

Las credenciales de **prueba** siguen en: **Tus integraciones → tu app → Pruebas → Credenciales de prueba** (solo para desarrollo; no generan cobros reales).

---

## 3. Configurar webhooks (notificaciones)

Así Mercado Pago avisa al servidor cuando cambia el estado de un pago u orden.

1. En el panel: **Tus integraciones → tu app → Webhooks → Configurar notificaciones**.
2. **URL:** debe ser **HTTPS** y apuntar al endpoint público del backend, por ejemplo:

   `https://TU-DOMINIO-DEL-API/api/webhook-mp`

   (Reemplazá `TU-DOMINIO-DEL-API` por la URL pública real de tu API en Railway u otro host.)  
   **Compatibilidad:** el mismo servidor también acepta notificaciones en `/webhooks/mercadopago` por si ya estaba configurado así.

3. Activá el evento **Order (Mercado Pago)** (y, si lo recomiendan para tu caso, **Chargebacks**).
4. Al guardar, el panel te dará una **clave secreta** para validar que las notificaciones son auténticas. Esa clave es la que corresponde a **`MP_WEBHOOK_SECRET`** en el servidor.

Si no respondemos correctamente (por ejemplo HTTP 200), Mercado Pago **reintenta** el envío de la notificación.

---

## 4. Dónde pegar cada valor en el código / hosting

### Sitio web (frontend — proyecto `client`)

Archivo de entorno (por ejemplo `.env` o `.env.production`, según cómo desplieguen):

| Variable | Valor |
|----------|--------|
| `VITE_MP_PUBLIC_KEY` | **Public Key de producción** |

Es la clave pública: puede estar en el navegador; sirve para el SDK de Mercado Pago en el checkout.

### Servidor (backend — proyecto `server`)

Variables de entorno del hosting (Railway, VPS, etc.):

| Variable | Valor |
|----------|--------|
| `MP_ACCESS_TOKEN` | **Access Token de producción** |
| `MP_WEBHOOK_SECRET` | **Clave secreta** del webhook del panel |
| `MP_NOTIFICATION_URL` | *(Opcional)* URL pública del webhook, por ejemplo `https://TU-API/api/webhook-mp` — útil si el flujo de preferencias de Mercado Pago debe conocer esa URL |

Después de cambiar variables en el frontend, suele hacer falta **volver a compilar** el sitio. En el backend, **reiniciar** el servicio para que lea el `.env` o las variables del panel.

---

## 5. Requisitos técnicos antes de cobrar en vivo

- **HTTPS** obligatorio en producción (sitio y API).
- Reemplazá **todas** las claves de prueba por las de **producción** (frontend y backend a la vez).
- **Probar** un pago real chico o con un monto mínimo para validar fin a fin (creación de orden, acreditación y webhook).

Mercado Pago sugiere, además, **medir la calidad de la integración** desde el panel (**Tus integraciones → tu app → Probar la integración → Medir calidad**), usando un `order_id` de una prueba; el puntaje mínimo recomendado suele rondar **73** (ideal acercarse a **100**).

---

## 6. Checklist rápido para el cliente

- [ ] Cuenta de Mercado Pago del negocio lista y aplicación creada en **Tus integraciones**
- [ ] **Producción** activada y datos del negocio completos
- [ ] Copiados **Public Key** y **Access Token** de **Producción**
- [ ] Webhook configurado con URL **HTTPS** correcta y evento **Order**
- [ ] Copiada la **clave secreta** del webhook
- [ ] `VITE_MP_PUBLIC_KEY` = Public Key producción (frontend)
- [ ] `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` = valores de producción (backend)
- [ ] Deploy con HTTPS y prueba de compra real controlada

---

## 7. Ayuda y documentación

- Panel de integraciones: [https://www.mercadopago.com.ar/developers/panel/app](https://www.mercadopago.com.ar/developers/panel/app)
- Documentación oficial: [https://www.mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers)
- Soporte: [https://www.mercadopago.com.ar/developers/es/support](https://www.mercadopago.com.ar/developers/es/support)

---

*Contenido basado en el contexto técnico del proyecto (`MercadoContext.md`) y en la configuración actual de esta solución (Orders API, webhooks y variables `MP_*` / `VITE_MP_PUBLIC_KEY`).*
