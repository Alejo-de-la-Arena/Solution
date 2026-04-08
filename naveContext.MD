# Nave API — Contexto para Cursor

> API de pagos de **Nave Negocios** (powered by Ranty / Naranja X / Galicia).  
> Permite generar intenciones de pago, renderizar QR, redirigir a checkout y recibir notificaciones en tiempo real.

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Ambientes y base URLs](#2-ambientes-y-base-urls)
3. [Autenticación](#3-autenticación)
4. [Productos disponibles](#4-productos-disponibles)
   - [4.1 Checkout con Nave (ecommerce)](#41-checkout-con-nave-ecommerce)
   - [4.2 Link de pago](#42-link-de-pago)
5. [Crear intención de pago](#5-crear-intención-de-pago)
6. [Respuesta de la intención de pago](#6-respuesta-de-la-intención-de-pago)
7. [Opciones de presentación del pago](#7-opciones-de-presentación-del-pago)
8. [Notificaciones (Webhooks)](#8-notificaciones-webhooks)
9. [Recuperar un pago](#9-recuperar-un-pago)
10. [Consultar una intención de pago](#10-consultar-una-intención-de-pago)
11. [Cancelar una intención de pago](#11-cancelar-una-intención-de-pago)
12. [Cancelar un pago](#12-cancelar-un-pago)
13. [Renderizar QR embebido](#13-renderizar-qr-embebido)
14. [Checkout embebido (SDK)](#14-checkout-embebido-sdk)
15. [Estados de una intención de pago](#15-estados-de-una-intención-de-pago)
16. [Estados de un pago](#16-estados-de-un-pago)
17. [Errores comunes](#17-errores-comunes)
18. [Motivos de rechazo más frecuentes](#18-motivos-de-rechazo-más-frecuentes)
19. [Tarjetas de prueba](#19-tarjetas-de-prueba)
20. [Alta y credenciales](#20-alta-y-credenciales)

---

## 1. Visión general

La API de Nave permite a comercios integrar cobros digitales en sus sitios web o aplicaciones. Soporta tres modalidades de presentación del pago:

- **Checkout redirect**: redirigir al usuario a una URL de pago hosteada por Nave.
- **QR renderizado**: mostrar un QR en el frontend del comercio que el usuario escanea con su billetera virtual o banco.
- **SDK embebido (low-code)**: incrustar el checkout de Nave directamente en la app o sitio del comercio.

El stack tecnológico subyacente es **Ranty** (infraestructura de Naranja X), con adquirencia de Galicia.

**Ciclo de vida básico:**
```
1. POST /oauth → access_token
2. POST /api/payment_request/{tipo} → payment_request_id + checkout_url + qr_data
3. Usuario paga → Nave notifica tu webhook (POST)
4. GET /ranty-payments/payments/{payment_id} → validar estado
```

---

## 2. Ambientes y base URLs

| Recurso | Sandbox | Producción |
|---|---|---|
| **Auth** | `https://homoservices.apinaranja.com` | `https://services.apinaranja.com` |
| **API principal** | `https://api-sandbox.ranty.io` | `https://api.ranty.io` |
| **Checkout hosteado (ecommerce)** | `https://sandbox-ecommerce.ranty.io` | `https://ecommerce.ranty.io` |
| **Checkout hosteado (payment link)** | `https://sandbox-hosted-checkout.ranty.io` | `https://hosted-checkout.ranty.io` |

---

## 3. Autenticación

La API usa **OAuth2 client_credentials** para obtener un JWT Bearer.  
El token tiene una duración de **86400 segundos (24 hs)**.  
Se recomienda implementar una política de reintentos ante fallos transitorios.

### Endpoint

```
POST {AUTH_BASE_URL}/security-ms/api/security/auth0/b2b/m2msPrivate
Content-Type: application/json
```

### Request body

```json
{
  "client_id": "eGXu7VV...LsXWylDmrE",
  "client_secret": "BAdRFax_McS...JLBTH-n",
  "audience": "https://naranja.com/ranty/merchants/api"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `client_id` | String | Sí | Clave pública de la aplicación |
| `client_secret` | String | Sí | Clave privada (nunca exponer en frontend) |
| `audience` | String | Sí | Audiencia fija provista por Nave |

### Response

```json
{
  "access_token": "eyJhbGciOiJS...1A",
  "scope": "read... write...",
  "expires_in": "86400",
  "token_type": "Bearer"
}
```

### Uso del token en requests

```
Authorization: Bearer {access_token}
Content-Type: application/json
```

> ⚠️ Las credenciales de sandbox y producción son **diferentes**. Cada entorno tiene su propio set.

---

## 4. Productos disponibles

### 4.1 Checkout con Nave (ecommerce)

Integración pensada para tiendas online. El comercio genera la intención de pago y puede:
- Mostrar un QR en su sitio para pagar con billetera/banco.
- Redirigir al usuario a la URL de checkout de Nave.
- Embeber el SDK de Nave en su frontend.

**En desktop**: se muestra QR para escanear + opción de ingreso manual de tarjeta (si está habilitado).  
**En mobile**: redirige automáticamente a MODO; el usuario elige pagar desde la app de MODO o apps bancarias.

**Endpoint de creación:**
```
POST https://api-sandbox.ranty.io/api/payment_request/ecommerce        (Sandbox)
POST https://api.ranty.io/api/payment_request/ecommerce                (Producción)
```

### 4.2 Link de pago

Modalidad para cobrar enviando un enlace por email, SMS o WhatsApp. El cliente accede desde cualquier dispositivo y completa el pago.

**Endpoint de creación:**
```
POST https://api-sandbox.ranty.io/api/payment_request/payment_link     (Sandbox)
POST https://api.ranty.io/api/payment_request/payment_link             (Producción)
```

---

## 5. Crear intención de pago

El body es idéntico para ambos tipos (`ecommerce` y `payment_link`). La diferencia está solo en la URL del endpoint.

### Request body completo

```json
{
  "external_payment_id": "order-111",
  "seller": {
    "pos_id": "f71ba756-1d80-4ab3-9f43-5dc247fd6c4a"
  },
  "transactions": [
    {
      "amount": {
        "currency": "ARS",
        "value": "177.00"
      },
      "products": [
        {
          "name": "Nave product",
          "description": "Nave description",
          "quantity": 1,
          "unit_price": {
            "currency": "ARS",
            "value": "177.00"
          }
        }
      ]
    }
  ],
  "buyer": {
    "doc_type": "DNI",
    "doc_number": "XXXXXXXX",
    "name": "User Platform",
    "user_email": "user.platform@platform.com",
    "user_id": "userplatform_id",
    "phone": "+541122334455",
    "session_id": "session_id",
    "billing_address": {
      "street_1": "Platform 110",
      "street_2": "N/A",
      "city": "Santa Fe",
      "region": "Santa Fe",
      "country": "AR",
      "zipcode": "3000"
    }
  },
  "additional_info": {
    "callback_url": "https://tuplatform.com/order_status/order-111"
  },
  "duration_time": 3000
}
```

### Referencia de atributos

| Atributo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `external_payment_id` | String | **Sí** | ID del pago en tu plataforma (máx. 36 caracteres) |
| `seller.pos_id` | String | **Sí** | ID del punto de venta en Nave |
| `transactions` | Array | **Sí** | Datos de la operación |
| `transactions[].amount.currency` | String | **Sí** | Moneda (usar `"ARS"`) |
| `transactions[].amount.value` | String | **Sí** | Monto total. **Siempre con dos decimales** (ej. `"177.00"`) |
| `transactions[].products[].name` | String | **Sí** | Nombre del producto |
| `transactions[].products[].description` | String | No | Descripción del producto |
| `transactions[].products[].quantity` | Number | **Sí** | Cantidad |
| `transactions[].products[].unit_price.currency` | String | **Sí** | Moneda del precio unitario |
| `transactions[].products[].unit_price.value` | String | No | Precio unitario con dos decimales |
| `buyer` | Object | No | Datos del comprador |
| `buyer.user_id` | String | No | ID del usuario en tu plataforma |
| `buyer.session_id` | String | No | ID de la sesión del usuario |
| `buyer.user_email` | String | No | Email del comprador |
| `buyer.name` | String | No | Nombre completo |
| `buyer.doc_type` | String | No | Tipo de documento (ej. `"DNI"`, `"CUIT"`) |
| `buyer.doc_number` | String | No | Número de documento |
| `buyer.phone` | String | No | Teléfono con código de país (ej. `"+541122334455"`) |
| `buyer.billing_address.street_1` | String | No | Dirección (línea 1) |
| `buyer.billing_address.street_2` | String | No | Dirección (línea 2, opcional) |
| `buyer.billing_address.city` | String | No | Ciudad |
| `buyer.billing_address.region` | String | No | Provincia/región |
| `buyer.billing_address.country` | String | No | País (ej. `"AR"`) |
| `buyer.billing_address.zipcode` | String | No | Código postal |
| `additional_info.callback_url` | String | No | URL de redirección post-pago (redirige automáticamente a los 5 seg. tras la aprobación, o al presionar "Volver a la tienda") |
| `duration_time` | Number | No | Tiempo de expiración en segundos. Default: 1 semana |

> 💡 Para obtener los `pos_id` disponibles: **Nave > Integraciones > Sistema de gestión > descargar archivo con IDs de puntos de venta**.

---

## 6. Respuesta de la intención de pago

```json
{
  "id": "ebac56ab-89f2-4419-941e-670f801d9c7b",
  "external_payment_id": "order-111",
  "checkout_url": "https://sandbox-hosted-checkout.ranty.io/nave/sdk?payment_request_id=...",
  "qr_data": "00020101021...-670f801d9c8b6304C0AA"
}
```

| Campo | Descripción |
|---|---|
| `id` | UUID de la intención de pago en Nave (`payment_request_id`) |
| `external_payment_id` | El mismo ID que enviaste en el request |
| `checkout_url` | URL para redirigir al usuario al checkout hosteado por Nave |
| `qr_data` | String codificado para renderizar el QR en tu frontend |

---

## 7. Opciones de presentación del pago

Una vez obtenida la respuesta con `checkout_url` y `qr_data`, tenés tres caminos:

### A) Redirigir al checkout hosteado

Simplemente redirigir al usuario a `checkout_url`. Nave maneja toda la UI.

### B) Renderizar QR propio

Usar el campo `qr_data` con cualquier librería de QR de tu elección para mostrar el código en tu frontend.

### C) Usar la URL de QR de Nave

Insertar un `<iframe>` que apunte a:

```
# Sandbox
https://sandbox-ecommerce.ranty.io/galicia/nave/checkout?payment_request_id={id}&qr_data={qr_data}

# Producción
https://ecommerce.ranty.io/galicia/nave/checkout?payment_request_id={id}&qr_data={qr_data}
```

Se conecta vía **WebSockets** para actualizaciones de estado en tiempo real.

#### Eventos del modal (postMessage)

```js
// El iframe emite eventos que podés capturar con window.addEventListener("message", ...)

// Cerrar modal
{ "type": "PAYMENT_MODAL_RESPONSE", "data": { "success": true, "closeModal": true } }

// Pago aprobado
{ "type": "PAYMENT_MODAL_RESPONSE", "data": { "success": true } }

// Intención vencida
{ "type": "PAYMENT_MODAL_RESPONSE", "data": { "success": false, "expiration": true } }

// Pago rechazado
{ "type": "PAYMENT_MODAL_RESPONSE", "data": { "success": false, "rejected": true } }
```

---

## 8. Notificaciones (Webhooks)

Nave envía un `POST` a tu `notification_url` configurada **cada vez que el estado de un pago cambia**.

> La `notification_url` se configura al dar de alta las credenciales. Se deben proveer dos URLs: una para sandbox y otra para producción.

### Payload recibido

```json
{
  "payment_id": "ID DEL PAGO",
  "payment_check_url": "api.ranty.io/ranty-payments/payments/:id",
  "external_payment_id": "ID SISTEMA EXTERNO"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `payment_id` | String | ID del pago en Nave |
| `payment_check_url` | String | Endpoint para consultar el detalle completo del pago |
| `external_payment_id` | String | Tu ID de pago (el que enviaste al crear la intención) |

### Confirmación de recepción

**Respondé con HTTP `200 OK`** para confirmar la recepción. Si respondés con cualquier otro código, Nave reintentará la entrega:

| Intento | Frecuencia |
|---|---|
| 1 | 10 segundos |
| 2 | 70 segundos |
| 3 | 490 segundos |
| 4 | 3.340 segundos |
| 5 | 24.010 segundos |

---

## 9. Recuperar un pago

Una vez recibido el webhook, hacé un GET para obtener el detalle completo y validar el estado antes de confirmar la orden en tu sistema.

```
GET https://api-sandbox.ranty.io/ranty-payments/payments/{payment_id}   (Sandbox)
GET https://api.ranty.io/ranty-payments/payments/{payment_id}           (Producción)
Authorization: Bearer {token}
Content-Type: application/json
```

### Response (resumen de campos clave)

```json
{
  "id": "dc1c28b5-86af-44f0-89e6-63fac289a770",
  "payment_code": "G40852846",
  "creation_date": "2025-09-30T21:17:48.695Z",
  "updated_date": "2025-09-30T21:17:58.305Z",
  "external_payment_id": "order-111",
  "payment_request_id": "ee3597b4-f392-4698-a6e8-df1a7bb1babf",
  "payment_input": "card_on_file",
  "payment_type": "ecommerce",
  "status": {
    "name": "APPROVED",
    "reason_code": "transaction_successful",
    "reason_name": "Transaction successful"
  },
  "lifecycle_stages": ["AUTHORIZATION"],
  "available_balance": { "value": "50.00", "currency": "ARS" },
  "payment_method": {
    "type": "card_payment",
    "pan": "541333********0011",
    "card_brand": "MASTERCARD",
    "card_type": "DEBIT",
    "card_last4": "4590",
    "issuer": "BANCO DE GALICIA Y BUENOS AIRES S.A.U.",
    "installment_plan": {
      "installments": 1,
      "total_amount": { "value": "50.00", "currency": "ARS" },
      "name": "1 CUOTA",
      "has_interest": false
    }
  },
  "transactions": [
    {
      "transaction_type": "PURCHASE",
      "amount": { "value": "50.00", "currency": "ARS" },
      "auth_data": {
        "auth_id": "383470",
        "status": "APPROVED",
        "code": "transaction_successful"
      }
    }
  ],
  "seller": { "pos_id": "b179b1ba-0c13-4862-9e17-1386847be771" },
  "buyer": { "user_email": "alan@gmail.com", "name": "Alan Di Masi" }
}
```

---

## 10. Consultar una intención de pago

Alternativa para cuando el webhook no llega o falla. Consultá por `payment_request_id`.

```
GET https://api-sandbox.ranty.io/api/payment_requests/{payment_request_id}   (Sandbox)
GET https://api.ranty.io/api/payment_requests/{payment_request_id}           (Producción)
Authorization: Bearer {token}
Content-Type: application/json
```

### Ejemplo curl

```bash
curl --location \
  'https://api-sandbox.ranty.io/api/payment_requests/0082f42b-29e3-4f74-8675-815feb72bb02' \
  --header 'Authorization: Bearer {token}'
```

La respuesta incluye el estado actual de la intención, datos del seller/buyer, intentos de pago, `checkout_url` y `qr_data` vigentes.

---

## 11. Cancelar una intención de pago

Solo se puede cancelar si la intención **no fue utilizada** aún.

```
DELETE https://api-sandbox.ranty.io/api/payment_requests/{payment_request_id}   (Sandbox)
DELETE https://api.ranty.io/api/payment_requests/{payment_request_id}           (Producción)
Authorization: Bearer {token}
Content-Type: application/json
```

### Response exitoso

```json
{ "message": "Payment request deleted" }
```

---

## 12. Cancelar un pago

Solo se puede cancelar un pago en estado **`APPROVED`**.

```
DELETE https://api-sandbox.ranty.io/api/payments/{payment_id}   (Sandbox)
DELETE https://api.ranty.io/api/payments/{payment_id}           (Producción)
Authorization: Bearer {token}
Content-Type: application/json
```

### Response inicial

```json
{
  "status": "CANCELLING",
  "message": "Payment {payment_id} pending to cancel"
}
```

> ⚠️ `CANCELLING` indica que el proceso está **en curso**, no que ya fue cancelado. El estado final llegará por webhook como `CANCELLED` o `REFUNDED`. Si ocurre un error, el estado vuelve a `APPROVED`.

---

## 13. Renderizar QR en el frontend

Dos opciones:

**Opción A — Renderizado propio:** usar el campo `qr_data` de la respuesta con cualquier librería de QR (ej. `qrcode`, `qrcodejs`).

**Opción B — URL de Nave con diseño incluido:**

```
# Sandbox
https://sandbox-ecommerce.ranty.io/galicia/nave/checkout?payment_request_id={payment_request_id}&qr_data={qr_data}

# Producción
https://ecommerce.ranty.io/galicia/nave/checkout?payment_request_id={payment_request_id}&qr_data={qr_data}
```

Caso de uso típico: insertar un `<iframe>` en tu web apuntando a esta URL. Se conecta por WebSockets para recibir actualizaciones en tiempo real sin polling.

---

## 14. Checkout embebido (SDK — `@ranty/ranty-sdk`)

Librería frontend basada en **Web Components** que permite embeber el checkout de Nave directamente en tu sitio o app. Expone el custom element `<payfac-sdk>` y soporta dos modos de pago:

- **Default**: pagos tradicionales sin tokenización.
- **Secure Card On File** (Visa / Mastercard): pagos tokenizados.

### Instalación

**npm**
```bash
npm install @ranty/ranty-sdk
```
```js
import '@ranty/ranty-sdk'
```

**CDN (jsDelivr)**
```html
<script type="module">
  import rantyrantySdk from 'https://cdn.jsdelivr.net/npm/@ranty/ranty-sdk@latest/+esm'
</script>
```

---

### Atributos del componente

#### Obligatorios

| Atributo | Tipo | Descripción |
|---|---|---|
| `publicKey` | String | Llave pública provista por Nave para autenticar el checkout |
| `paymentRequestId` | String (UUID v4) | ID de la intención de pago generado en tu backend |

#### Opcionales

| Atributo | Tipo | Valores | Descripción |
|---|---|---|---|
| `env` | String | `"production"` / `"staging"` | Ambiente de ejecución. Staging = homologación/pruebas. **Requerido para producción.** |
| `mode` | String | `"card_on_file"` | Activa el modo de pagos tokenizados (Secure Card On File) |
| `settings` | Object (JSON string) | Ver abajo | Controla visibilidad de componentes del checkout |

#### Objeto `settings`

```js
{
  "show_title": false,          // muestra/oculta el título
  "show_subtitle": false,       // muestra/oculta el subtítulo
  "show_order_detail": false,   // muestra/oculta el detalle de la compra
  "enable_auto_redirect": false // activa/desactiva redirección automática a la tienda (default: 5s o botón "Volver a la tienda")
}
```

Si no se incluye `settings`, **todos los componentes se muestran por defecto**.

---

### Recomendación de contenedor

Siempre envolver `<payfac-sdk>` en un `div` con los siguientes estilos para una experiencia óptima:

```html
<div style="height: 94vh; background: #F4F4F4;">
  <payfac-sdk ...></payfac-sdk>
</div>
```

---

### Pagos tradicionales (Default)

**Producción**
```html
<div style="height: 94vh; background: #F4F4F4;">
  <payfac-sdk
    paymentRequestId="uuid-v4"
    publicKey="publicKey-merchant"
    settings='{"show_title":true,"show_order_detail":true,"enable_auto_redirect":true}'
    env="production"
  ></payfac-sdk>
</div>
```

**Staging (homologación)**
```html
<div style="height: 94vh; background: #F4F4F4;">
  <payfac-sdk
    paymentRequestId="uuid-v4"
    publicKey="publicKey-merchant"
    settings='{"show_title":true,"show_order_detail":true}'
    env="staging"
  ></payfac-sdk>
</div>
```

---

### Pagos tokenizados — Secure Card On File (Visa / Mastercard)

Se activa agregando `mode="card_on_file"`.

**Producción**
```html
<div style="height: 94vh; background: #F4F4F4;">
  <payfac-sdk
    paymentRequestId="uuid-v4"
    publicKey="publicKey-merchant"
    mode="card_on_file"
    env="production"
  ></payfac-sdk>
</div>
```

**Staging (homologación)**
```html
<div style="height: 94vh; background: #F4F4F4;">
  <payfac-sdk
    paymentRequestId="uuid-v4"
    publicKey="publicKey-merchant"
    mode="card_on_file"
    env="staging"
  ></payfac-sdk>
</div>
```

---

### Manejo de eventos

El SDK emite eventos vía `window.postMessage`. Escuchalos con:

```html
<script>
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
      console.log('Evento del SDK:', event.data);

      switch (event.data.type) {
        case 'SUCCESS_PROCESSED':
          // Pago aprobado — confirmar orden en tu sistema
          break;
        case 'FAILURE_PROCESSED':
          // Pago rechazado — mostrar mensaje al usuario
          console.log('Detalle del rechazo:', event.data.detail);
          break;
        case 'BLOCKED':
          // Intención bloqueada
          console.log('Detalle del bloqueo:', event.data.detail);
          break;
        case 'PAYMENT_REQUEST_ERROR':
        case 'AUTH_ERROR':
        case 'DIRECT_PAYMENT_ERROR':
          // Errores — manejar o reintentar
          break;
      }
    }
  });
</script>
```

#### Tabla completa de eventos

| Tipo | Detalle | Descripción |
|---|---|---|
| `AUTH_ERROR` | `"Authentication failed."` | Falló la autenticación del checkout |
| `AUTH_PAYMENT_REQUEST` | `"Payment request failed."` | Falló la solicitud de pago por auth |
| `LOAD_DATA_ERROR` | `"Load data failed."` | Error al cargar los datos de la intención |
| `PROMOTIONS_ERROR` | `"Promotions failed."` | Error al cargar promociones |
| `PAYMENT_REQUEST_ERROR` | `"Payment request failed."` | Error al procesar la solicitud de pago |
| `INSTALLMENT_PLAN_ERROR` | `"Installment plan failed."` | Error al cargar el plan de cuotas |
| `WEB_SOCKET_ERROR` | `"Web socket connection failed."` | Error de conexión WebSocket |
| `DIRECT_PAYMENT_ERROR` | `"Direct payment failed."` | Error al ejecutar el pago directo |
| `FAILURE_PROCESSED` | Detalle del rechazo | Pago rechazado (con datos del motivo) |
| `SUCCESS_PROCESSED` | _(ninguno)_ | Pago aprobado exitosamente |
| `BLOCKED` | Detalle del bloqueo | Intención bloqueada por fraude o intentos excedidos |
| `INVOICE_ERROR` | `"Open invoice failed."` | Error al abrir el comprobante |

---

## 15. Estados de una intención de pago

| Estado | Descripción |
|---|---|
| `PENDING` | Solicitud creada, sin pagos asociados aún |
| `PROCESSED` | Solicitud con un pago iniciado |
| `DISABLED` | Intención desactivada antes de usarse |
| `SUCCESS_PROCESSED` | Pago aprobado |
| `FAILURE_PROCESSED` | Pago rechazado |
| `EXPIRED` | Intención vencida |
| `BLOCKED` | Intención bloqueada por fraude o intentos excedidos |

---

## 16. Estados de un pago

| Estado | Descripción |
|---|---|
| `PENDING` | Transacción iniciada, sin resultado final |
| `APPROVED` | Pago aprobado |
| `REJECTED` | Pago rechazado |
| `CANCELLED` | Cancelación manual antes del cierre del lote |
| `REFUNDED` | Devolución total emitida |
| `PURCHASE_REVERSED` | Reversado antes de liquidarse |
| `CHARGEBACK_REVIEW` | Disputa en proceso por contracargo |
| `CHARGED_BACK` | Contracargo confirmado por la entidad emisora |

### Ejemplos de respuesta por estado

```json
// APPROVED
{ "id": "...", "status": { "name": "APPROVED", "reason_code": "transaction_successful", "reason_name": "Transaction successful" } }

// REJECTED
{ "id": "...", "status": { "name": "REJECTED", "reason_code": "gateway_not_available", "reason_name": "Rejected (Gateway not available)" } }

// CANCELLED
{ "id": "...", "status": { "name": "CANCELLED", "reason_code": "transaction_successful", "reason_name": "Transaction successful" } }

// REFUNDED
{ "id": "...", "status": { "name": "REFUNDED", "reason_code": "transaction_successful", "reason_name": "Transaction successful" } }
```

---

## 17. Errores comunes

```json
// Pago no encontrado
{ "code": "payment_not_found", "message": "Payment not found" }

// Intento de cancelar un pago no aprobado
{ "code": "only_approved_operations_can_be_canceled", "message": "Only Approved operations can be canceled. Payment status {payment.status}" }

// Error interno
{ "code": "internal_server_error", "message": "Servicio no disponible, por favor intente más tarde." }
```

---

## 18. Motivos de rechazo más frecuentes

| Código de error | Mensaje visible al usuario |
|---|---|
| `denied` | Error con el proveedor de la tarjeta. Inténtalo de nuevo. |
| `no_amount_available` | La tarjeta no tiene fondos suficientes. |
| `account_identity_validation_error` | La información de la tarjeta no es válida. |
| `expired_card_invalid_expiry_date` | La fecha de vencimiento no es válida. |
| `denied_hold_card` | Tu banco rechazó la operación. |
| `gateway_not_available` | Hubo un error al intentar procesar el pago. Intentalo nuevamente. |
| `check_the_system_transaction_not_allowed_to_that_card` | La tarjeta fue rechazada. Intentá otro medio o contactá al banco. |
| `invalid_merchant`, `system_error`, `gateway_timeout` | Error interno o con el proveedor de la tarjeta. |

---

## 19. Tarjetas de prueba

Usar en el entorno **sandbox** únicamente.

| Marca | Número | Vencimiento | CVV | Resultado |
|---|---|---|---|---|
| Naranja crédito | `5895 6248 4026 3355` | 04/40 | 928 | ✅ APPROVED |
| Naranja crédito | `5895 6248 9347 1379` | 07/40 | 374 | ❌ REJECTED |
| Naranja crédito | `5895 6134 3478 9277` | 04/40 | 990 | ❌ REJECTED |
| Visa crédito (1 cuota) | `4025 2200 0000 0139` | Cualquiera | Cualquiera | ✅ APPROVED |
| Visa crédito (6 cuotas) | `4761 2299 9900 0231` | 12/31 | 078 | ✅ APPROVED |
| Visa crédito (1 cuota) | `4025 2200 0000 0127` | Cualquiera | Cualquiera | ❌ REJECTED |
| Visa crédito (1 cuota) | `4025 2200 0000 1040` | Cualquiera | Cualquiera | ❌ REJECTED |

---

## 20. Alta y credenciales

Para obtener tus credenciales necesitás proveer:

1. **CUIT del comercio**
2. **Dos URLs de notificación (`notification_url`):** una para sandbox y otra para producción.
3. **Código de vinculación** (se obtiene en Nave > Integraciones > Tienda Online Propia > completar el proceso de vinculación).

Enviá esta información a:
- Tu **ejecutivo Galicia**
- O por email a **integraciones@navenegocios.com**

> Las credenciales de sandbox y producción son **siempre distintas**.

---

## Resumen de todos los endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `{AUTH_URL}/security-ms/api/security/auth0/b2b/m2msPrivate` | Obtener token JWT |
| `POST` | `/api/payment_request/ecommerce` | Crear intención de pago (checkout) |
| `POST` | `/api/payment_request/payment_link` | Crear intención de pago (link de pago) |
| `GET` | `/ranty-payments/payments/{payment_id}` | Recuperar detalle de un pago |
| `GET` | `/api/payment_requests/{payment_request_id}` | Consultar estado de una intención |
| `DELETE` | `/api/payment_requests/{payment_request_id}` | Cancelar una intención de pago |
| `DELETE` | `/api/payments/{payment_id}` | Cancelar un pago aprobado |

---

*Documentación basada en [navenegocios.ar/home/developers](https://navenegocios.ar/home/developers) — API powered by Ranty / Naranja X / Galicia.*  
*Soporte: integraciones@navenegocios.com*