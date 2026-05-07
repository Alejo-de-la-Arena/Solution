# Gestionar – Documentación de APIs Externas para Clientes

## Índice

1. [Autenticación](#autenticación)
2. [Convenciones generales](#convenciones-generales)
3. [Ventas no vinculadas](#ventas-no-vinculadas)
4. [Etiquetas de ventas no vinculadas](#etiquetas-de-ventas-no-vinculadas)
5. [Fullfilment](#fullfilment)
   - [Categorías de productos](#categorías-de-productos)
   - [Productos](#productos)
   - [Depósitos (Warehouses)](#depósitos-warehouses)
6. [Visualizar ventas por marketplace](#visualizar-ventas-por-marketplace)
7. [Consultar paquetes (Reporte)](#consultar-paquetes-reporte)
8. [Pickup](#pickup)
9. [Horas de colecta](#horas-de-colecta)
10. [Códigos de error y respuesta](#códigos-de-error-y-respuesta)

---

## Autenticación

Todos los endpoints requieren el encabezado `secret-token-key` con el token secreto del cliente.

```http
secret-token-key: <tu-token-secreto>
```

Algunos endpoints también aceptan autenticación Bearer en el encabezado `Authorization`:

```http
Authorization: Bearer <token>
```

> **Base URL:** `{{base_url}}` (variable de entorno configurada en Postman)

---

## Convenciones generales

### Estructura de respuesta exitosa

```json
{
    "status": "Success",
    "data": { ... },
    "message": "Peticion exitosa, todo salio bien!",
    "success": true
}
```

### Estructura de respuesta de error

```json
{
    "status": "Error",
    "success": false,
    "message": "Descripción del error",
    "data": ["Detalle del error", <código_http>]
}
```

### Rate Limit

El API tiene un límite de **600 requests** por ventana de tiempo. El encabezado de respuesta `X-RateLimit-Remaining` indica las peticiones restantes.

---

## Ventas no vinculadas

### Importación masiva de paquetes no vinculados

Permite importar paquetes de ventas no vinculadas a ningún marketplace mediante un archivo Excel.

**Endpoint:** `POST /api/external-client/package/not-linked-register`

**Autenticación:** Bearer token + `secret-token-key`

**Body:** `multipart/form-data`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `file` | File | ✅ | Archivo `.xlsx` con los paquetes a importar |
| `condition` | string | ✅ | Condición de importación (ej: `"cambio"`) |
| `type` | string | ❌ | Tipo de importación. Usar `"fullfilment"` para importaciones de tipo fulfillment |

**Ejemplo – Importación estándar:**
```
POST /api/external-client/package/not-linked-register
Content-Type: multipart/form-data

file: ventas_novinculadas.xlsx
condition: cambio
```

**Ejemplo – Importación fulfillment:**
```
POST /api/external-client/package/not-linked-register
Content-Type: multipart/form-data

file: ventas_novinculadas_fullfilment.xlsx
condition: cambio
type: fullfilment
```

---

## Etiquetas de ventas no vinculadas

### Obtener etiquetas PDF de ventas no vinculadas

Genera las etiquetas en PDF para una lista de paquetes de ventas no vinculadas.

**Endpoint:** `POST /api/external-client/sales/generatepdfdetails`

**Autenticación:** `secret-token-key`

**Body:** `application/json`

```json
{
    "marketplace_platform_id": 4,
    "package_ids": [1, 2]
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `marketplace_platform_id` | integer | ✅ | ID de la plataforma (4 = No vinculada) |
| `package_ids` | array\<integer\> | ✅ | Lista de IDs de paquetes |

---

## Fullfilment

### Categorías de productos

#### Listar categorías

Devuelve todas las categorías de productos asociadas al cliente autenticado.

**Endpoint:** `GET /api/external-client/fullfilment/get-products-category`

**Autenticación:** `secret-token-key`

**Respuesta exitosa (200):**

```json
{
    "status": "Success",
    "data": [
        { "id": 1, "name": "Hogar", "client": 9 },
        { "id": 2, "name": "Ropa", "client": 9 },
        { "id": 3, "name": "Tecnología", "client": 9 },
        { "id": 9, "name": "Deporte", "client": 9 },
        { "id": 38, "name": "Kit", "client": 9 },
        { "id": 46, "name": "Alimentos", "client": 9 }
    ],
    "message": "Peticion exitosa, todo salio bien!",
    "success": true
}
```

---

#### Crear categoría

Crea una nueva categoría de producto para el cliente autenticado.

**Endpoint:** `POST /api/external-client/fullfilment/create-products-category`

**Autenticación:** `secret-token-key`

**Body:** `application/json`

```json
{
    "name": "Ropas"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ | Nombre de la categoría |

**Respuesta exitosa (201):**

```json
{
    "status": "Success",
    "data": {
        "id": 48,
        "name": "Ropas",
        "client": 9
    },
    "message": "Peticion exitosa, todo salio bien!",
    "success": true
}
```

**Error de validación (422):** Se devuelve cuando el campo `name` no es enviado.

```json
{
    "status": "Error",
    "success": false,
    "message": "El nombre del producto es requerido",
    "data": []
}
```

---

### Productos

#### Listar productos

Devuelve todos los productos del cliente autenticado con información de stock, categoría, SKUs y más.

**Endpoint:** `GET /api/external-client/fullfilment/get-products`

**Autenticación:** `secret-token-key`

**Respuesta exitosa (200):** Lista de objetos con la siguiente estructura:

```json
{
    "id": 2,
    "fulfillment_client": 1,
    "client_id": 9,
    "category": 3,
    "category_name": "Tecnología",
    "skus": ["TCBT-001"],
    "matched_sku": null,
    "name": "Teclado BT Recargable",
    "description": "Teclado BT Recargable",
    "waist": "",
    "color": "Negro",
    "image": null,
    "measure": "unidad",
    "brand": "TECH",
    "model": "MOD-TC-852",
    "is_kit": false,
    "kit_items": [],
    "modified": "2025-10-08T12:30:51.413273-03:00",
    "latest_movement": { "stock_before": 22 },
    "allocated_floors": "Sin asignar"
}
```

**Campos del objeto producto:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | ID único del producto |
| `category` | integer | ID de la categoría |
| `category_name` | string | Nombre de la categoría |
| `skus` | array\<string\> | Lista de SKUs asociados al producto |
| `name` | string | Nombre del producto |
| `description` | string | Descripción del producto |
| `waist` | string | Talle/medida |
| `color` | string | Color del producto |
| `image` | string\|null | URL de imagen del producto |
| `measure` | string | Unidad de medida |
| `brand` | string | Marca |
| `model` | string | Modelo |
| `is_kit` | boolean | Indica si el producto es un kit |
| `kit_items` | array | Componentes del kit (si aplica) |
| `latest_movement` | object\|null | Último movimiento de stock |
| `allocated_floors` | string | Piso asignado en el depósito |

---

#### Crear producto

Crea un nuevo producto en el sistema de fulfillment.

**Endpoint:** `POST /api/external-client/fullfilment/create-products`

**Autenticación:** `secret-token-key`

**Body:** `application/json`

```json
{
    "kit_items": [],
    "category": 48,
    "skus": ["sked23"],
    "name": "Pantalón Levi",
    "description": "Pantalón stretch",
    "waist": null,
    "color": null,
    "dimension": null,
    "measure": null,
    "brand": null,
    "model": null,
    "is_kit": false
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ | Nombre del producto |
| `category` | integer | ✅ | ID de categoría |
| `skus` | array\<string\> | ✅ | Lista de SKUs |
| `is_kit` | boolean | ✅ | Si es un kit o producto simple |
| `kit_items` | array | ✅ | Lista de componentes (vacía si no es kit) |
| `description` | string | ❌ | Descripción |
| `waist` | string\|null | ❌ | Talle |
| `color` | string\|null | ❌ | Color |
| `dimension` | string\|null | ❌ | Dimensión |
| `measure` | string\|null | ❌ | Unidad de medida |
| `brand` | string\|null | ❌ | Marca |
| `model` | string\|null | ❌ | Modelo |

**Respuesta exitosa (201):** Devuelve el objeto del producto creado.

---

#### Crear producto con kit de items

Para crear un producto de tipo kit, se debe enviar `is_kit: true` y completar el array `kit_items` con los componentes.

**Ejemplo de `kit_items`:**

```json
{
    "is_kit": true,
    "kit_items": [
        {
            "component_sku": "SN:QR-300S24050072",
            "quantity": 1,
            "confirmed": false
        },
        {
            "component_sku": "7798428130029",
            "quantity": 1,
            "confirmed": false
        }
    ]
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `component_sku` | string | SKU del componente |
| `quantity` | integer | Cantidad del componente en el kit |
| `confirmed` | boolean | Si el componente está confirmado |

---

### Depósitos (Warehouses)

#### Ver depósitos asociados al cliente

Devuelve los depósitos (warehouses) vinculados al cliente autenticado.

**Endpoint:** `GET /api/external-client/fullfilment/get-warehouse-by-client`

**Autenticación:** `secret-token-key`

**Respuesta exitosa (200):**

```json
{
    "status": "Success",
    "data": [
        { "id": 1, "client_id_read": 9, "warehouse": 1, "warehouse_name": "Casares" },
        { "id": 15, "client_id_read": 9, "warehouse": 3, "warehouse_name": "Rosalia" }
    ],
    "message": "Peticion exitosa, todo salio bien!",
    "success": true
}
```

---

## Visualizar ventas por marketplace

Endpoint unificado para consultar ventas según el marketplace. El ID del marketplace se indica directamente en la URL.

**Endpoint:** `GET /api/external-client/sales/{marketplace_platform_id}`

**Autenticación:** `secret-token-key`

### IDs de marketplaces disponibles

| ID | Marketplace |
|----|------------|
| 1  | Mercado Libre |
| 2  | WooCommerce |
| 3  | Shopify |
| 4  | Ventas no vinculadas |
| 5  | Tienda Nube |

### Parámetros de query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `from` | string (fecha) | ✅ | Fecha de inicio (formato `YYYY-MM-DD`) |
| `to` | string (fecha) | ✅ | Fecha de fin (formato `YYYY-MM-DD`) |
| `not_pickup` | integer | ✅ | Siempre enviar `1` |
| `page` | integer | ✅ | Número de página a consultar |

**Ejemplo:**

```
GET /api/external-client/sales/1?from=2023-12-01&to=2023-12-02&not_pickup=1&page=1
```

### Respuesta exitosa – Mercado Libre (200)

```json
{
    "status": "Success",
    "data": [
        {
            "id": "6569229d513f730facdffb94",
            "exists": false,
            "sellerName": "AGV GROUP",
            "tags": "[]",
            "destinatary_data": {
                "name": "Cristian Rodriguez",
                "phone": "XXXXXXX",
                "zip_code": "6360",
                "direction": "Calle 20 1064",
                "location": "General Pico",
                "tracking_number": "DVPQ01010000000050291467",
                "date_created": "2023-12-01T00:02:31.000Z",
                "delivery_type": "Residencial"
            }
        }
    ],
    "message": "Peticion exitosa, todo salio bien!",
    "success": true
}
```

> **Nota:** La estructura del campo `destinatary_data` varía levemente según el marketplace. Mercado Libre incluye `zip_code` y `tracking_number`, mientras que WooCommerce, Shopify y Tienda Nube usan `post_code` y `order_id`.

### Respuesta de error (400)

Se devuelve cuando el cliente no tiene vinculado el marketplace solicitado.

```json
{
    "status": "Error",
    "success": false,
    "message": "No tiene vinculado el marketplace solicitado.",
    "data": ["No tiene vinculado el marketplace solicitado.", 400]
}
```

---

## Consultar paquetes (Reporte)

Permite consultar paquetes del cliente con filtros avanzados, paginación y control de relaciones incluidas en la respuesta.

**Endpoint:** `GET /api/external-client/packages`

**Autenticación:** `secret-token-key` + Bearer token

### Parámetros de query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `page` | integer | ✅ | Página a consultar |
| `from` | string (fecha) | ✅ | Fecha de inicio (`YYYY-MM-DD`) |
| `to` | string (fecha) | ✅ | Fecha de fin (`YYYY-MM-DD`) |
| `take` | integer | ❌ | Registros por página |
| `locality` | string | ❌ | Filtro LIKE por localidad |
| `direction` | string | ❌ | Filtro LIKE por dirección |
| `destinatary_name` | string | ❌ | Filtro LIKE por nombre del destinatario |
| `status_name` | string | ❌ | Filtrar por estado (`En camino`, `Entregado`, `No entregado`, `Asignado`) |
| `includes[]` | string | ❌ | Relaciones a incluir. Valor válido: `history` |
| `withOut[]` | string | ❌ | Relaciones a excluir: `client`, `destinatary`, `address` |

**Ejemplo:**

```
GET /api/external-client/packages?page=1&from=2022-01-01&to=2023-12-18&take=5&includes[]=history&withOut[]=client
```

### Respuesta exitosa (200)

La respuesta incluye un array `packages` y un objeto `pagination`:

```json
{
    "success": "Success",
    "packages": [ { ... } ],
    "pagination": {
        "current_page": 1,
        "last_page": 1719,
        "per_page": "5",
        "total": 8593,
        "next_page_url": "http://.../api/external-client/packages?page=2",
        "prev_page_url": null
    }
}
```

### Estados posibles de un paquete

| ID | Estado | Descripción |
|----|--------|-------------|
| 1 | Pendiente | El paquete está pendiente de asignación |
| 2 | Retirado en pickup | El paquete fue retirado en el punto de pickup |
| 3 | En base | El paquete se encuentra en la base de Gestionar |
| 4 | Asignado | El paquete está asignado a un repartidor |

---

## Pickup

### Crear pickup de paquetes

Genera un pickup que agrupa uno o más paquetes para su recolección.

**Endpoint:** `POST /api/external-client/pickup`

**Autenticación:** `secret-token-key`

**Body:** `application/json`

```json
{
    "orders_ids": ["656923d9513f730face0069a"],
    "platform_id": "1",
    "pickup_time_id": "7"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `orders_ids` | array\<string\> | ✅ | IDs de los paquetes (obtenidos del endpoint de visualizar ventas) |
| `platform_id` | string | ✅ | ID del marketplace (1 = Mercado Libre, 4 = No vinculados, etc.) |
| `pickup_time_id` | string | ✅ | ID de la hora de colecta (obtenido del endpoint de horas de colecta) |

**Respuesta exitosa (201):** Devuelve los datos del pickup creado junto con el detalle de los paquetes asociados, incluyendo `tracking_url` individual por paquete.

**Error (400):** Se devuelve si algún `order_id` no corresponde a un paquete válido.

```json
{
    "status": "Error",
    "success": false,
    "message": "No se pudo encontar los datos del paquete id: <id>, contacte con soporte.",
    "data": [ "...", 400 ]
}
```

---

## Horas de colecta

### Ver horas de colecta disponibles

Devuelve las franjas horarias de colecta configuradas para el cliente.

**Endpoint:** `GET /api/external-client/pickup-times`

**Autenticación:** `secret-token-key`

**Respuesta exitosa (200):**

```json
{
    "status": "Success",
    "data": [
        {
            "id": 7,
            "client_id": 6,
            "time": "11:00 am",
            "created_at": null,
            "updated_at": null
        }
    ],
    "message": "Peticion exitosa, todo salio bien!",
    "success": true
}
```

> Los IDs devueltos aquí son los que se deben usar en el campo `pickup_time_id` al crear un pickup.

---

## Códigos de error y respuesta

| Código HTTP | Significado |
|-------------|-------------|
| 200 | OK – Solicitud exitosa |
| 201 | Created – Recurso creado correctamente |
| 400 | Bad Request – Error en los datos enviados o recurso no encontrado |
| 422 | Unprocessable Content – Error de validación de campos requeridos |

---

## Flujo de integración recomendado

```
1. Obtener categorías        GET  /fullfilment/get-products-category
2. Crear categoría (si no existe)  POST /fullfilment/create-products-category
3. Crear producto             POST /fullfilment/create-products
4. Ver depósitos              GET  /fullfilment/get-warehouse-by-client
5. Ver ventas del marketplace GET  /sales/{platform_id}?from=...&to=...
6. Ver horas de colecta       GET  /pickup-times
7. Crear pickup               POST /pickup
8. Consultar estado paquetes  GET  /packages?page=1&from=...&to=...
```