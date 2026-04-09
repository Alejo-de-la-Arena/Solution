# Mercado Pago API — Contexto para Cursor

> API de pagos de **Mercado Pago** (Checkout API vía Orders).  
> Permite integrar pagos con tarjeta, efectivo (Rapipago/Pago Fácil), gestionar órdenes, webhooks, reembolsos, contracargos y tarjetas guardadas.

---

## Tabla de contenidos

1. [Visión general](#1-visión-general)
2. [Ambientes y base URLs](#2-ambientes-y-base-urls)
3. [Credenciales](#3-credenciales)
4. [Autenticación](#4-autenticación)
5. [Configurar el ambiente de desarrollo](#5-configurar-el-ambiente-de-desarrollo)
6. [Modelo de integración (Orders)](#6-modelo-de-integración-orders)
7. [Crear una orden de pago](#7-crear-una-orden-de-pago)
8. [Medios de pago disponibles](#8-medios-de-pago-disponibles)
9. [Pago con tarjeta (Card Payment Brick)](#9-pago-con-tarjeta-card-payment-brick)
10. [Pago con tarjeta (Core Methods — Web)](#10-pago-con-tarjeta-core-methods--web)
11. [Pago con Rapipago y Pago Fácil](#11-pago-con-rapipago-y-pago-fácil)
12. [Webhooks (Notificaciones)](#12-webhooks-notificaciones)
13. [Consultar una orden](#13-consultar-una-orden)
14. [Estados de una orden](#14-estados-de-una-orden)
15. [Estados de una transacción](#15-estados-de-una-transacción)
16. [Reembolsos y cancelaciones](#16-reembolsos-y-cancelaciones)
17. [Reservar, capturar y cancelar fondos](#17-reservar-capturar-y-cancelar-fondos)
18. [Contracargos (Chargebacks)](#18-contracargos-chargebacks)
19. [Guardar tarjetas (Customers)](#19-guardar-tarjetas-customers)
20. [Mejoras para la aprobación de pagos](#20-mejoras-para-la-aprobación-de-pagos)
21. [Tarjetas y usuarios de prueba](#21-tarjetas-y-usuarios-de-prueba)
22. [Salir a producción](#22-salir-a-producción)
23. [MCP Server de Mercado Pago](#23-mcp-server-de-mercado-pago)
24. [Resumen de endpoints](#24-resumen-de-endpoints)

---

## 1. Visión general

Checkout API de Mercado Pago permite procesar pagos online directamente en tu sitio o app, sin redirigir al usuario a una página externa. Utiliza la **API de Orders** como modelo de integración principal (reemplaza a la vieja API de Payments).

**Flujo básico:**
```
1. Inicializar MercadoPago.js con tu Public Key (frontend)
2. El comprador ingresa datos de tarjeta → se genera un card token
3. Tu backend hace POST /v1/orders con el token → Mercado Pago procesa
4. Recibís el resultado vía respuesta + webhooks
```

**Modos de procesamiento:**
- **Automático** (`processing_mode: "automatic"`): todo en una sola request, modo por defecto.
- **Manual** (`processing_mode: "manual"`): la orden se crea primero y se procesa en un paso posterior.

---

## 2. Ambientes y base URLs

| Recurso | URL |
|---|---|
| **API principal** | `https://api.mercadopago.com` |
| **SDK JS** | `https://sdk.mercadopago.com/js/v2` |
| **SDK JS (npm)** | `@mercadopago/sdk-js` |

No hay una URL de sandbox separada — se diferencia por las **credenciales de prueba vs. producción** que uses.

---

## 3. Credenciales

Hay dos tipos de credenciales, ambas se obtienen en [Tus integraciones](https://mercadopago.com/developers/panel/app):

### Credenciales de prueba
- Se generan automáticamente al crear una aplicación.
- Se usan durante desarrollo y testing. No generan pagos reales.
- Acceso: **Tus integraciones → Tu app → Pruebas → Credenciales de prueba**

### Credenciales de producción
- Requieren activación completando datos del negocio.
- Acceso: **Tus integraciones → Tu app → Producción → Credenciales de producción**

### Tipos de claves

| Clave | Uso | Dónde |
|---|---|---|
| `Public Key` | Frontend — inicializar SDK, tokenizar tarjetas | Código cliente (expuesto) |
| `Access Token` | Backend — crear órdenes, consultar, reembolsar | Servidor (nunca exponer) |
| `Client ID` | OAuth / integraciones legacy | Según caso |
| `Client Secret` | OAuth — flujo client credentials | Servidor (nunca exponer) |

> ⚠️ **Nunca expongas el Access Token en el frontend.** Siempre enviarlo como header `Authorization: Bearer {ACCESS_TOKEN}` desde el backend.

---

## 4. Autenticación

Todas las requests al backend deben incluir:

```http
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

Para requests que crean recursos (POST), agregar también:

```http
X-Idempotency-Key: {UUID_V4_UNICO}
```

El `X-Idempotency-Key` garantiza que si la misma request se envía dos veces, solo se procese una vez. Usar un UUID v4 diferente por cada intención de pago.

---

## 5. Configurar el ambiente de desarrollo

### Incluir SDK JS (HTML)

```html
<body>
  <script src="https://sdk.mercadopago.com/js/v2"></script>
</body>
```

### Incluir SDK JS (npm)

```bash
npm install @mercadopago/sdk-js
```

```js
import { loadMercadoPago } from "@mercadopago/sdk-js";
await loadMercadoPago();
const mp = new window.MercadoPago("YOUR_PUBLIC_KEY");
```

### Inicializar con Public Key

```html
<script>
  const mp = new MercadoPago("YOUR_PUBLIC_KEY");
</script>
```

---

## 6. Modelo de integración (Orders)

La **API de Orders** reemplaza a la API de Payments. Diferencias clave:

| Funcionalidad | API de Payments (legacy) | API de Orders (actual) |
|---|---|---|
| Procesamiento | Solo automático | Automático y manual |
| Transacciones | Una por request | Múltiples por request |
| Operaciones | Solo pagos online | Pagos online + presenciales |
| Notificaciones | Via `notification_url` | Desde panel (Tus integraciones) |
| Errores | Un error a la vez | Lista con todos los errores |

### Modo automático

Se define con `processing_mode: "automatic"`. La orden se crea y procesa en una sola request. Requiere que `transactions.payments` incluya el `token` de tarjeta completo.

```json
{
  "type": "online",
  "processing_mode": "automatic",
  "external_reference": "order_123",
  "total_amount": "1000.00",
  "payer": { "email": "comprador@test.com" },
  "transactions": {
    "payments": [{
      "amount": "1000.00",
      "payment_method": {
        "id": "master",
        "type": "credit_card",
        "token": "677859ef5f18ea7e3a87c41d02c3fbe3",
        "installments": 1
      }
    }]
  }
}
```

### Modo manual

Se define con `processing_mode: "manual"`. La orden se crea primero (sin transacciones) y se procesa después con un endpoint separado. Útil cuando necesitás agregar info en pasos posteriores.

```json
{
  "type": "online",
  "processing_mode": "manual",
  "external_reference": "order_manual_123",
  "total_amount": "200.00",
  "payer": { "id": "840634289", "type": "registered" },
  "items": [{
    "title": "Producto ejemplo",
    "quantity": 1,
    "unit_price": "200.00"
  }]
}
```

La respuesta incluye un `client_token` para que el frontend agregue transacciones de forma segura.

---

## 7. Crear una orden de pago

```
POST https://api.mercadopago.com/v1/orders
Authorization: Bearer {ACCESS_TOKEN}
X-Idempotency-Key: {UUID_V4}
Content-Type: application/json
```

### Body completo

```json
{
  "type": "online",
  "processing_mode": "automatic",
  "external_reference": "ext_ref_1234",
  "total_amount": "200.00",
  "capture_mode": "automatic",
  "payer": {
    "email": "test@testuser.com",
    "identification": {
      "type": "DNI",
      "number": "12345678"
    }
  },
  "transactions": {
    "payments": [{
      "amount": "200.00",
      "payment_method": {
        "id": "master",
        "type": "credit_card",
        "token": "CARD_TOKEN",
        "installments": 1
      }
    }]
  }
}
```

### Parámetros clave

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | String | Sí | Siempre `"online"` para pagos online |
| `processing_mode` | String | Sí | `"automatic"` o `"manual"` |
| `external_reference` | String | Sí | Tu ID interno de la orden |
| `total_amount` | String | Sí | Monto total como string (`"200.00"`) |
| `capture_mode` | String | No | `"automatic"` o `"manual"` (para reservas) |
| `payer.email` | String | Sí | Email del comprador |
| `transactions.payments[].amount` | String | Sí | Monto del pago |
| `transactions.payments[].payment_method.id` | String | Sí | Marca de la tarjeta (ej: `"master"`, `"visa"`) |
| `transactions.payments[].payment_method.type` | String | Sí | `"credit_card"` o `"debit_card"` o `"ticket"` |
| `transactions.payments[].payment_method.token` | String | Sí* | Token de la tarjeta (*requerido para tarjetas) |
| `transactions.payments[].payment_method.installments` | Number | Sí* | Cantidad de cuotas |

### Respuesta exitosa

```json
{
  "id": "ORD01JS2V6CM8KJ0EC4H502TGK1WP",
  "type": "online",
  "processing_mode": "automatic",
  "external_reference": "ext_ref_1234",
  "total_amount": "200.00",
  "total_paid_amount": "200.00",
  "status": "processed",
  "status_detail": "accredited",
  "capture_mode": "automatic_async",
  "created_date": "2025-04-17T21:41:33.96Z",
  "last_updated_date": "2025-04-17T21:41:35.144Z",
  "transactions": {
    "payments": [{
      "id": "PAY01JS2V6CM8KJ0EC4H504R7YE34",
      "amount": "200.00",
      "paid_amount": "200.00",
      "status": "processed",
      "status_detail": "accredited",
      "payment_method": {
        "id": "master",
        "type": "credit_card",
        "installments": 1
      }
    }]
  }
}
```

---

## 8. Medios de pago disponibles

Consultá todos los medios de pago disponibles:

```bash
curl -X GET \
  -H 'Authorization: Bearer {ACCESS_TOKEN}' \
  'https://api.mercadopago.com/v1/payment_methods'
```

### IDs de medios de pago más usados en Argentina

| Medio | `payment_method_id` | `type` |
|---|---|---|
| Visa crédito | `visa` | `credit_card` |
| Mastercard crédito | `master` | `credit_card` |
| American Express | `amex` | `credit_card` |
| Visa débito | `debvisa` | `debit_card` |
| Mastercard débito | `debmaster` | `debit_card` |
| Rapipago | `rapipago` | `ticket` |
| Pago Fácil | `pagofacil` | `ticket` |

---

## 9. Pago con tarjeta (Card Payment Brick)

El **Card Payment Brick** es la forma recomendada. Maneja automáticamente la obtención del tipo de documento, emisor y cuotas.

### Frontend — Inicializar y renderizar el Brick

```javascript
const renderCardPaymentBrick = async (bricksBuilder) => {
  const settings = {
    initialization: {
      amount: 100.99,
    },
    callbacks: {
      onReady: () => {
        // Ocultar loadings del sitio
      },
      onSubmit: (formData, additionalData) => {
        return new Promise((resolve, reject) => {
          const submitData = {
            type: "online",
            total_amount: String(formData.transaction_amount),
            external_reference: "ext_ref_1234",
            processing_mode: "automatic",
            transactions: {
              payments: [{
                amount: String(formData.transaction_amount),
                payment_method: {
                  id: formData.payment_method_id,
                  type: additionalData.paymentTypeId,
                  token: formData.token,
                  installments: formData.installments,
                }
              }]
            },
            payer: {
              email: formData.payer.email,
              identification: formData.payer.identification,
            },
          };

          fetch("/process_order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submitData),
          })
            .then(res => res.json())
            .then(() => resolve())
            .catch(() => reject());
        });
      },
      onError: (error) => {
        console.error(error);
      },
    },
  };

  window.cardPaymentBrickController = await bricksBuilder.create(
    "cardPayment",
    "cardPaymentBrick_container",
    settings
  );
};
```

```html
<!-- HTML donde se renderiza el Brick -->
<div id="cardPaymentBrick_container"></div>
```

> ⚠️ Cuando el usuario salga de la pantalla de pago, destruir la instancia con `window.cardPaymentBrickController.unmount()` antes de volver a crearla.

### Backend — Recibir y procesar la orden

```bash
curl -X POST 'https://api.mercadopago.com/v1/orders' \
  -H 'Content-Type: application/json' \
  -H 'X-Idempotency-Key: {UUID_V4}' \
  -H 'Authorization: Bearer {ACCESS_TOKEN}' \
  -d '{
    "type": "online",
    "processing_mode": "automatic",
    "total_amount": "200.00",
    "external_reference": "ext_ref_1234",
    "payer": { "email": "test@testuser.com" },
    "transactions": {
      "payments": [{
        "amount": "200.00",
        "payment_method": {
          "id": "master",
          "type": "credit_card",
          "token": "CARD_TOKEN_DEL_BRICK",
          "installments": 1
        }
      }]
    }
  }'
```

---

## 10. Pago con tarjeta (Core Methods — Web)

Para mayor control sobre el flujo. El integrador define cuándo y cómo buscar cada dato.

### Flujo completo

```
1. Inicializar MercadoPago.js con Public Key
2. Montar campos seguros PCI (número, vencimiento, CVV)
3. getIdentificationTypes() → poblar selector de documento
4. En binChange → getPaymentMethods(bin) → getIssuers() → getInstallments()
5. Al submit → createCardToken() → enviar token al backend
6. Backend → POST /v1/orders con el token
```

### Montar campos PCI seguros

```javascript
const mp = new MercadoPago("YOUR_PUBLIC_KEY");

const cardNumberElement = mp.fields.create('cardNumber', {
  placeholder: "Número de la tarjeta"
}).mount('form-checkout__cardNumber');

const expirationDateElement = mp.fields.create('expirationDate', {
  placeholder: "MM/YY"
}).mount('form-checkout__expirationDate');

const securityCodeElement = mp.fields.create('securityCode', {
  placeholder: "CVV"
}).mount('form-checkout__securityCode');
```

### Crear token de tarjeta

```javascript
const token = await mp.fields.createCardToken({
  cardholderName: document.getElementById('form-checkout__cardholderName').value,
  identificationType: document.getElementById('form-checkout__identificationType').value,
  identificationNumber: document.getElementById('form-checkout__identificationNumber').value,
});
// token.id → enviar al backend como payment_method.token
```

> El token tiene **validez de 7 días** y solo puede usarse **una vez**.

---

## 11. Pago con Rapipago y Pago Fácil

```bash
curl -X POST 'https://api.mercadopago.com/v1/orders' \
  -H 'Authorization: Bearer {ACCESS_TOKEN}' \
  -H 'X-Idempotency-Key: {UUID_V4}' \
  -d '{
    "type": "online",
    "processing_mode": "automatic",
    "total_amount": "200.00",
    "external_reference": "ext_ref_1234",
    "expiration_time": "P3D",
    "payer": {
      "email": "test@testuser.com",
      "first_name": "John",
      "last_name": "Doe",
      "identification": { "type": "DNI", "number": "12345678" }
    },
    "transactions": {
      "payments": [{
        "amount": "200.00",
        "payment_method": {
          "id": "rapipago",
          "type": "ticket"
        }
      }]
    }
  }'
```

La respuesta incluye `ticket_url` con las instrucciones para que el comprador efectúe el pago. El status inicial es `action_required` / `waiting_payment`.

`expiration_time` usa formato ISO 8601 duration (ej. `"P3D"` = 3 días). Rango: 1 a 30 días.

---

## 12. Webhooks (Notificaciones)

### Configurar desde el panel

1. Ir a **Tus integraciones → Tu app → Webhooks → Configurar notificaciones**
2. Ingresar URL HTTPS productiva
3. Seleccionar evento **Order (Mercado Pago)** (y opcionalmente **Chargebacks**)
4. Guardar — se genera una clave secreta para validar autenticidad

### Payload recibido

```json
{
  "action": "order.action_required",
  "api_version": "v1",
  "application_id": "76506430185983",
  "date_created": "2021-11-01T02:02:02Z",
  "id": "123456",
  "live_mode": false,
  "type": "order",
  "user_id": 2025701502,
  "data": {
    "id": "ORD01JQ4S4KY8HWQ6NA5PXB65B3D3"
  }
}
```

Responder con **HTTP 200** para confirmar recepción. Si no, Mercado Pago reintentará cada 15 minutos (hasta 3 intentos, luego continúa cada cierto tiempo).

### Validar autenticidad del webhook

El header `x-signature` contiene `ts` (timestamp) y `v1` (firma HMAC-SHA256).

```javascript
const crypto = require('crypto');

// Extraer ts y v1 del header x-signature
const parts = xSignature.split(',');
let ts, hash;
parts.forEach(part => {
  const [key, value] = part.split('=');
  if (key.trim() === 'ts') ts = value.trim();
  if (key.trim() === 'v1') hash = value.trim();
});

// Construir el mensaje a firmar
// IMPORTANTE: data.id debe ir en MINÚSCULAS
const dataId = queryParams['data.id'].toLowerCase();
const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

// Calcular HMAC-SHA256
const cyphedSignature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(manifest)
  .digest('hex');

// Comparar
if (cyphedSignature === hash) {
  // Webhook auténtico ✅
}
```

---

## 13. Consultar una orden

```bash
GET https://api.mercadopago.com/v1/orders/{order_id}
Authorization: Bearer {ACCESS_TOKEN}
```

Usar esto cuando no recibís el webhook o querés verificar el estado actual.

---

## 14. Estados de una orden

| `status` | `status_detail` | Descripción |
|---|---|---|
| `created` | — | Orden creada en modo manual, sin procesar |
| `action_required` | `waiting_payment` | Esperando que el comprador pague |
| `action_required` | `waiting_capture` | Monto autorizado, esperando captura |
| `processed` | `accredited` | Pago acreditado ✅ |
| `processed` | `pending` | En proceso de acreditación |
| `failed` | `failed` | Orden fallida |
| `charged_back` | `in_process` | Contracargo en disputa |
| `charged_back` | `settled` | Contracargo resuelto contra el vendedor |
| `charged_back` | `reimbursed` | Contracargo resuelto a favor del vendedor |

---

## 15. Estados de una transacción

| `status` | `status_detail` | Descripción |
|---|---|---|
| `processed` | `accredited` | Aprobado ✅ |
| `action_required` | `waiting_payment` | Pendiente de pago |
| `action_required` | `waiting_capture` | Autorizado, pendiente de captura |
| `failed` | `insufficient_amount` | Fondos insuficientes |
| `failed` | `bad_filled_card_data` | Datos de tarjeta incorrectos |
| `failed` | `required_call_for_authorize` | Requiere autorización del banco |
| `failed` | `card_disabled` | Tarjeta deshabilitada |
| `failed` | `high_risk` | Rechazado por fraude |
| `failed` | `cc_rejected_duplicated_payment` | Pago duplicado |
| `failed` | `max_attempts_exceeded` | Máximo de intentos excedido |

---

## 16. Reembolsos y cancelaciones

### Reembolso total

```bash
POST https://api.mercadopago.com/v1/orders/{order_id}/refund
Authorization: Bearer {ACCESS_TOKEN}
X-Idempotency-Key: {UUID_V4}
Content-Type: application/json

# Body vacío para reembolso total
{}
```

### Reembolso parcial

```json
{
  "transaction_id": "PAY01JS2V6CM8KJ0EC4H504R7YE34",
  "amount": "50.00"
}
```

### Cancelación de orden

Solo posible si `status: "action_required"`.

```bash
POST https://api.mercadopago.com/v1/orders/{order_id}/cancel
Authorization: Bearer {ACCESS_TOKEN}
```

---

## 17. Reservar, capturar y cancelar fondos

### Crear reserva (autorización sin captura)

```json
{
  "capture_mode": "manual",
  "type": "online",
  "processing_mode": "automatic",
  "total_amount": "200.00",
  "payer": { "email": "comprador@test.com" },
  "transactions": {
    "payments": [{
      "amount": "200.00",
      "payment_method": {
        "id": "master",
        "type": "credit_card",
        "token": "CARD_TOKEN",
        "installments": 1
      }
    }]
  }
}
```

La respuesta tendrá `status: "action_required"`, `status_detail: "waiting_capture"`.

### Capturar la reserva

```bash
POST https://api.mercadopago.com/v1/orders/{order_id}/capture
Authorization: Bearer {ACCESS_TOKEN}
```

> ⚠️ El tiempo límite para capturar es **5 días** desde la creación de la reserva.

### Cancelar la reserva

```bash
POST https://api.mercadopago.com/v1/orders/{order_id}/cancel
Authorization: Bearer {ACCESS_TOKEN}
```

---

## 18. Contracargos (Chargebacks)

### Configurar notificaciones de contracargos

En el panel de webhooks, activar el evento **Chargebacks** además de Order.

### Consultar un contracargo

```bash
GET https://api.mercadopago.com/v1/chargebacks/{chargeback_id}
Authorization: Bearer {ACCESS_TOKEN}
```

Respuesta incluye `documentation_required` (bool) y `date_documentation_deadline`.

### Enviar documentación

Solo si `documentation_required: true` y `date_documentation_deadline` es una fecha futura.

```bash
curl -X POST \
  -F 'files[]=@/ruta/al/archivo/comprobante.pdf' \
  -H 'Authorization: Bearer {ACCESS_TOKEN}' \
  'https://api.mercadopago.com/v1/chargebacks/{chargeback_id}/documentation'
```

Archivos: `.jpg`, `.png` o `.pdf`. Máximo 10MB por archivo.

### Estados del contracargo

| `coverage_applied` | Descripción |
|---|---|
| `null` | En análisis |
| `true` | Resuelto a favor del vendedor → dinero devuelto |
| `false` | Resuelto contra el vendedor → dinero descontado |

---

## 19. Guardar tarjetas (Customers)

### Crear cliente

```bash
POST https://api.mercadopago.com/v1/customers
Authorization: Bearer {ACCESS_TOKEN}

{
  "email": "cliente@email.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "identification": { "type": "DNI", "number": "12345678" }
}
```

### Guardar tarjeta al cliente

```bash
POST https://api.mercadopago.com/v1/customers/{customer_id}/cards
Authorization: Bearer {ACCESS_TOKEN}

{ "token": "CARD_TOKEN" }
```

### Listar tarjetas del cliente

```bash
GET https://api.mercadopago.com/v1/customers/{customer_id}/cards
Authorization: Bearer {ACCESS_TOKEN}
```

### Pagar con tarjeta guardada

1. Mostrar las tarjetas guardadas al usuario.
2. Capturar solo el CVV con un campo seguro PCI.
3. Generar token con el `cardId`:

```javascript
const token = await mp.fields.createCardToken({
  cardId: "ID_DE_LA_TARJETA_GUARDADA"
});
```

4. Crear la orden incluyendo `payer.customer_id` y el token.

```json
{
  "type": "online",
  "total_amount": "200.00",
  "payer": { "customer_id": "CUSTOMER_ID" },
  "transactions": {
    "payments": [{
      "amount": "200.00",
      "payment_method": {
        "id": "master",
        "type": "credit_card",
        "token": "TOKEN_DEL_CVV",
        "installments": 1
      }
    }]
  }
}
```

### Eliminar tarjeta

```bash
DELETE https://api.mercadopago.com/v1/customers/{customer_id}/cards/{card_id}
Authorization: Bearer {ACCESS_TOKEN}
```

---

## 20. Mejoras para la aprobación de pagos

### Device ID (muy recomendado)

Incluir el Device ID mejora significativamente la tasa de aprobación.

**Si ya usás MercadoPago.js v2**, el Device ID se obtiene automáticamente. Solo agregar el header al crear la orden:

```http
X-meli-session-id: {device_id}
```

**Si no usás el SDK**, agregar este script:

```html
<script src="https://www.mercadopago.com/v2/security.js" view="checkout"></script>
```

Luego acceder a la variable global `MP_DEVICE_SESSION_ID`.

### Datos que mejoran la aprobación

Incluir en el body de la orden:
- `payer.identification` (tipo y número de documento)
- `payer.first_name` y `payer.last_name`
- `items[]` con detalle de los productos
- `additional_info` con datos del comprador y envío

### Razones comunes de rechazo

| `status_detail` | Causa |
|---|---|
| `bad_filled_card_data` | Error al ingresar datos de tarjeta |
| `insufficient_amount` | Fondos insuficientes |
| `required_call_for_authorize` | El banco requiere autorización |
| `card_disabled` | Tarjeta bloqueada o deshabilitada |
| `high_risk` | Detectado como potencial fraude |
| `cc_rejected_duplicated_payment` | Pago duplicado (mismos datos dos veces seguidas) |
| `max_attempts_exceeded` | Demasiados intentos fallidos |

---

## 21. Tarjetas y usuarios de prueba

### Tarjetas de prueba (Argentina)

| Tipo | Marca | Número | CVV | Vencimiento |
|---|---|---|---|---|
| Crédito | Mastercard | `5031 7557 3453 0604` | 123 | 11/30 |
| Crédito | Visa | `4509 9535 6623 3704` | 123 | 11/30 |
| Crédito | Amex | `3711 803032 57522` | 1234 | 11/30 |
| Débito | Mastercard | `5287 3383 1025 3304` | 123 | 11/30 |
| Débito | Visa | `4002 7686 9439 5619` | 123 | 11/30 |

### Datos del titular para simular resultados

| Nombre del titular | Resultado |
|---|---|
| `APRO` + DNI `12345678` | ✅ Aprobado |
| `OTHE` | ❌ Rechazado (error general) |
| `CONT` | ⏳ Pendiente |
| `CALL` | ❌ Requiere autorización |
| `FUND` | ❌ Fondos insuficientes |
| `SECU` | ❌ CVV inválido |
| `EXPI` | ❌ Tarjeta vencida |
| `FORM` | ❌ Error de formulario |
| `DUPL` | ❌ Pago duplicado |
| `LOCK` | ❌ Tarjeta bloqueada |

**Email del comprador en pruebas:** siempre usar `test@testuser.com`.

### Crear usuarios de prueba

Desde el panel: **Tus integraciones → Tu app → Cuentas de prueba → Crear cuenta de prueba**.

Necesitás al menos dos cuentas:
- **Vendedor**: configura la aplicación y las credenciales.
- **Comprador**: realiza las compras de prueba.

---

## 22. Salir a producción

1. **Activar credenciales de producción**: Tus integraciones → Tu app → Producción → Credenciales de producción → Activar → Completar datos del negocio.

2. **Reemplazar credenciales en tu código**:
   - `Public Key` de prueba → `Public Key` de producción (frontend)
   - `Access Token` de prueba → `Access Token` de producción (backend)

3. **Implementar certificado SSL** (HTTPS obligatorio en producción).

4. **Medir calidad de integración** antes de salir: Tus integraciones → Tu app → Probar la integración → Medir calidad (requiere un `order_id` de pago de prueba). Puntaje mínimo recomendado: **73 puntos** (ideal: 100).

5. **Verificar webhooks** configurados y funcionando en producción.

---

## 23. MCP Server de Mercado Pago

Mercado Pago tiene un servidor MCP para usar con Cursor, VS Code, Windsurf y otros IDEs.

### Configurar en Cursor

Agregar en `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mercadopago-mcp-server": {
      "url": "https://mcp.mercadopago.com/mcp"
    }
  }
}
```

Luego ir a **Cursor Settings → Tools & MCPs → Connect** (requiere autenticación con tu cuenta MP).

### Configurar con Access Token directo (alternativa)

```json
{
  "mcpServers": {
    "mercadopago-mcp-server": {
      "url": "https://mcp.mercadopago.com/mcp",
      "headers": {
        "Authorization": "Bearer {ACCESS_TOKEN}"
      }
    }
  }
}
```

### Tools disponibles del MCP

| Tool | Descripción |
|---|---|
| `search-documentation` | Busca en la documentación oficial de Mercado Pago |
| `quality_checklist` | Lista de campos evaluados para calidad de integración |
| `quality_evaluation` | Mide la calidad usando un `payment_id` productivo |
| `save_webhook` | Configura webhooks desde el IDE |
| `simulate_webhook` | Simula el envío de notificaciones para probar |
| `notifications_history_diagnostics` | Diagnóstico del historial de notificaciones |
| `create_test_user` | Crea usuarios de prueba |
| `add_money_test_user` | Agrega saldo a usuarios de prueba |
| `get_application` | Info sobre las aplicaciones de la cuenta |

---

## 24. Resumen de endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/v1/payment_methods` | Listar medios de pago disponibles |
| `POST` | `/v1/orders` | Crear una orden de pago |
| `GET` | `/v1/orders/{id}` | Consultar estado de una orden |
| `POST` | `/v1/orders/{id}/capture` | Capturar un monto autorizado |
| `POST` | `/v1/orders/{id}/cancel` | Cancelar una orden |
| `POST` | `/v1/orders/{id}/refund` | Reembolsar una orden (total o parcial) |
| `POST` | `/v1/customers` | Crear un cliente |
| `GET` | `/v1/customers/search?email=...` | Buscar cliente por email |
| `PUT` | `/v1/customers/{id}` | Actualizar cliente |
| `POST` | `/v1/customers/{id}/cards` | Guardar tarjeta a un cliente |
| `GET` | `/v1/customers/{id}/cards` | Listar tarjetas de un cliente |
| `DELETE` | `/v1/customers/{id}/cards/{card_id}` | Eliminar tarjeta |
| `GET` | `/v1/chargebacks/{id}` | Consultar un contracargo |
| `POST` | `/v1/chargebacks/{id}/documentation` | Enviar documentación de contracargo |

---

*Documentación basada en [mercadopago.com/developers](https://mercadopago.com/developers) — Checkout API vía Orders.*  
*Soporte: [https://mercadopago.com/developers/es/support](https://mercadopago.com/developers/es/support)*