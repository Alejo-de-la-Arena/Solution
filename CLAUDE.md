# Solution Platform — Contexto del proyecto

Tienda e-commerce de perfumes **Solution** con dos canales:
- **Retail**: compra anónima (sin login). Checkout con Mercado Pago o Nave.
- **Mayorista**: portal con login + aprobación, flujo de aplicación separado.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 7 + Tailwind 3 · `react-router-dom` 7 · `motion`/Framer · Recharts |
| Backend | Node + Express 5 · Axios · Morgan · dotenv |
| Datos | Supabase (PostgreSQL) + Storage para assets |
| Pagos | Mercado Pago (`@mercadopago/sdk-js`) + Nave / Naranja X (`@ranty/ranty-sdk`) |
| Logística | Correo Argentino (cotización + etiqueta) + Gestionar (retiros/depósitos) |
| Emails | Integración custom en `server/services/email.js` |

## Estructura

```
Solution/
├── client/                  # React + Vite
│   └── src/
│       ├── pages/           # Tienda, Producto, Checkout, Mayorista, Admin, …
│       ├── components/
│       │   ├── checkout/    # MercadoPagoBrick, NaveEmbed
│       │   ├── cart/        # CartDrawer
│       │   └── layout/      # Navbar, Footer, ScrollToTop
│       ├── contexts/        # CartContext, AuthContext
│       ├── guards/          # RoleRoute, WholesaleRoute
│       ├── hooks/           # useAuth, usePageTracking, …
│       └── services/        # checkout.js, shipping.js, …
├── server/                  # Express API
│   ├── routes/              # checkout, mercadopago, nave, shipping, correo, gestionar, admin
│   ├── services/email.js
│   ├── lib/supabase.js
│   └── index.js             # monta rutas + webhooks raw-body
├── supabase/
│   ├── migrations/          # SQL versionado
│   ├── functions/           # Edge functions (wholesale-review)
│   └── seed/
├── MercadoContext.md        # Docs MP Orders API
├── MercadoPagoContext.md    # Plan de despliegue MP
├── naveContext.MD           # Docs Nave/Ranty API
└── gestionarContext.md      # Docs Gestionar
```

## Rutas del cliente

Definidas en `client/src/App.jsx`.

| Path | Componente | Acceso |
|---|---|---|
| `/` | `Home` | público |
| `/tienda` | `Tienda` | público |
| `/producto/:id` | `Producto` | público |
| `/checkout` | `Checkout` | público (compra anónima) |
| `/mi-pedido/:orderId` | `MiPedido` | público (tracking por UUID) |
| `/acceso` | `Acceso` | público (login mayorista) |
| `/aplicar-mayorista` | `WholesaleApply` | público |
| `/programa-mayorista` | `WholesaleLanding` | público |
| `/mayorista` | `WholesalePortal` | requiere `isWholesaleApproved` |
| `/admin` + sub-rutas | `AdminLayout` | requiere rol admin |
| `/set-password` | `SetPassword` | invitación admin |

## Endpoints del server

Montados en `server/index.js` con prefijo `/api` (excepto webhooks).

| Prefijo | Router | Propósito |
|---|---|---|
| `/api/checkout` | `routes/checkout.js` | Orden retail simple + endpoint público de tracking |
| `/api/mercadopago/*` | `routes/mercadopago.js` | Orders API, preference, process-card-payment, order-status |
| `/api/nave/*` | `routes/nave.js` | create-payment, payment-status, webhook alternativo |
| `/webhooks/mercadopago` | `routes/mercadopago.js::handleMercadoPagoWebhook` | Notificaciones MP (raw body + HMAC) |
| `/webhooks/nave` | `routes/nave.js::handleNaveWebhook` | Notificaciones Nave (raw body) |
| `/api/shipping/*` | `routes/shipping.js` | Cotización unificada (Correo + Gestionar) |
| `/api/correo/*` | `routes/correo.js` | Correo Argentino directo |
| `/api/gestionar/*` | `routes/gestionar.js` | Gestionar logística |
| `/api/admin/*` | `routes/admin.js` | Panel admin (requiere auth Supabase) |

Los webhooks se montan ANTES de `express.json()` con `express.raw()` para poder validar firmas/parsear payloads con `Content-Type` no-JSON.

## Tabla `orders`

Creada por `supabase/migrations/*.sql` (ver `20250209000000_add_orders_channel.sql` y siguientes). Columnas relevantes:

- **Core**: `id` (UUID), `user_id`, `status`, `currency`, `total`, `channel` (`retail` / `wholesale`), `created_at`, `updated_at`, `payment_method` (`mercadopago` / `nave`).
- **Estados**: `pending_payment` (transacción iniciada en la pasarela, esperando webhook), `paid`, `payment_failed`, `cancelled`, `refunded`, `chargeback`.
- **Cliente**: `customer_name`, `customer_email`, `customer_phone`.
- **Envío**: `shipping_address_line1/2`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`, `shipping_notes`, `shipping_method`, `shipping_cost`, `shipping_provider`, `shipping_mode`, `shipping_service_type`, `shipping_is_free`, `shipping_agency_code`, `shipping_agency_name`, `shipping_customer_id`, `shipping_quote_payload` (JSONB), `shipping_quote_response` (JSONB).
- **Mercado Pago**: `mp_order_id`, `mp_payment_id`, `mp_status`, `mp_status_detail`, `mp_card_brand`, `mp_card_last4`, `mp_installments`, `mp_paid_at`.
- **Nave**: `nave_payment_request_id`, `nave_payment_id`, `nave_checkout_url`, `nave_payment_code`, `nave_status`, `nave_card_brand`, `nave_card_type`, `nave_card_last4`, `nave_card_issuer`, `nave_installments`, `nave_installments_name`, `nave_status_reason`, `nave_paid_at`.
- **Emails**: `payment_confirmation_email_sent_at` (idempotencia).

Tabla `order_items`: `order_id` (FK), `product_id` (FK), `quantity`, `unit_price`.

## Flujo de compra end-to-end

### 1. Carrito
`CartContext` persiste items en `localStorage['cart']` y sincroniza precios con la DB al montar.

### 2. Checkout (`/checkout`)
El usuario completa email, nombre, dirección, CP + provincia. Un `useEffect` debounced llama a `/api/shipping/quote` que consulta **Correo Argentino** y/o **Gestionar** y devuelve opciones (home / branch). Se auto-selecciona la primera de home.

### 3. Método de pago

#### Mercado Pago
- **Tarjeta (Card Payment Brick)**: el Brick se renderiza con `amount` + `VITE_MP_PUBLIC_KEY`. Al submit, `MercadoPagoBrick` envía `{ checkout_payload, mp_payment, device_id }` a `POST /api/mercadopago/process-card-payment`. El server crea la orden en DB, llama `POST /v1/payments` y aplica el resultado sincrónico (approved → `paid`, rejected → `payment_failed`).
- **Wallet (Checkout Pro)**: al click del botón "Pagar con dinero en cuenta u otros medios", el cliente llama `POST /api/mercadopago/create-preference` (crea orden + preference MP) y redirige a `init_point`. Vuelve a `/checkout?order_id=X` y espera el webhook.

#### Nave / Naranja X
- Al click "Pagar", `Checkout.jsx` llama `POST /api/nave/create-payment`. El server crea la orden + payment request en Nave.
- Si hay `VITE_NAVE_PUBLIC_KEY`, se muestra `NaveEmbed` (SDK embebido). Si no, redirige a `checkout_url`.

### 4. Confirmación
Los webhooks (`/webhooks/mercadopago`, `/webhooks/nave`) reciben la notificación, validan firma si aplica, consultan la API del proveedor para confirmar estado y hacen `UPDATE orders SET status = 'paid'` (o `payment_failed`). Si la orden se marca `paid` por primera vez, se dispara email de confirmación (`sendPaymentConfirmationEmail`) con idempotencia vía `payment_confirmation_email_sent_at`.

### 5. Tracking post-compra
Tras cualquier compra exitosa, el cliente guarda la orden en `localStorage['solution_tracked_orders']` (helpers en `client/src/services/orderTracking.js`). La `Navbar` muestra un ícono con dot de status. El usuario puede volver en cualquier momento a `/mi-pedido/:orderId` que hace polling sobre el endpoint público `GET /api/checkout/track/:orderId`.

## Variables de entorno

### `server/.env`
- `PORT` (default 3000)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`
- `NAVE_ENV` (`testing` | `production`), `NAVE_CLIENT_ID`, `NAVE_CLIENT_SECRET`, `NAVE_AUDIENCE`, `NAVE_POS_ID`, `NAVE_PAYMENT_DURATION_SECS`
- Correo Argentino / Gestionar: ver `routes/correo.js` y `routes/gestionar.js`

### `client/.env`
- `VITE_API_URL` (URL del server, sin trailing slash)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_MP_PUBLIC_KEY` (Mercado Pago)
- `VITE_NAVE_PUBLIC_KEY` (opcional — habilita checkout embebido de Nave)

## Dev

```bash
# Terminal 1 — backend
cd Solution/server
npm install
npm run dev            # nodemon en :3000

# Terminal 2 — frontend
cd Solution/client
npm install
npm run dev            # Vite en :5173
```

Testear webhooks en dev con un túnel (ngrok / cloudflared) y registrarlo en los paneles de Mercado Pago y Nave (sandbox).

## Documentación adicional

- `MercadoContext.md` — referencia Orders API, Payments API, testing cards y webhooks.
- `MercadoPagoContext.md` — fases 0–7 del rollout, credenciales, checklist prod.
- `naveContext.MD` — OAuth2 M2M, payment requests, estados del webhook (APPROVED / REJECTED / CANCELLED / REFUNDED / CHARGED_BACK).
- `gestionarContext.md` — API de Gestionar (ventas, paquetes, retiros).
