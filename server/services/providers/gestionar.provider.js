const axios = require('axios');
const { hasFreeShipping } = require('../shipping.rules');
const { lookupCP, normalizeCP } = require('../../data/amba-zones');

const GESTIONAR_API_URL =
    process.env.GESTIONAR_API_URL || 'https://apiv1.gestionarlogistica.com.ar';

class GestionarError extends Error {
    constructor(message, status = 500, raw = null) {
        super(message);
        this.name = 'GestionarError';
        this.status = status;
        this.raw = raw;
    }
}

function getApiKey() {
    const key = process.env.GESTIONAR_API_KEY;
    if (!key) {
        throw new GestionarError('GESTIONAR_API_KEY no configurado', 500);
    }
    return key;
}

function buildHeaders({ multipart = false } = {}) {
    const headers = { 'secret-token-key': getApiKey() };
    if (!multipart) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}

function unwrap(raw) {
    if (raw && typeof raw === 'object' && 'data' in raw && raw.success !== false) {
        return raw.data;
    }
    return raw;
}

async function request({ method, path, params, body, multipart = false }) {
    try {
        const { data } = await axios.request({
            method,
            url: `${GESTIONAR_API_URL}${path}`,
            params,
            data: body,
            headers: buildHeaders({ multipart }),
            timeout: 30_000,
        });
        return data;
    } catch (err) {
        const status = err.response?.status || 500;
        const raw = err.response?.data || null;
        const msg = raw?.message || err.message || 'Error llamando a Gestionar';
        throw new GestionarError(msg, status, raw);
    }
}

// ============================================================================
// Quote (cotización para checkout)
// ============================================================================

/**
 * Cotiza envío Gestionar para CABA/AMBA con tarifa fija por zona.
 *
 * La cobertura y los precios se definen en `server/data/amba-zones.js`:
 *   - Zona 1 (CABA, CP 1000–1499): $5.000
 *   - Zona 2 (Primer cordón):       $7.000
 *   - Zona 3 (Segundo/Tercer):      $8.900
 *   - Zona 4 (Cuarto cordón):       $10.300
 *
 * Si el CP no está cubierto, el provider lanza `OUT_OF_COVERAGE` y el orquestador
 * (`shipping.service.js`) cae a Correo Argentino. Si `items.length ≥ 2`, aplica
 * envío gratis (regla compartida con Correo en `shipping.rules.js`).
 */
async function quote({ items, address } = {}) {
    const coverage = lookupCP(address?.postalCode);
    if (!coverage) {
        throw new GestionarError(
            `CP "${address?.postalCode || ''}" no está cubierto por Gestionar (AMBA).`,
            404,
            { reason: 'OUT_OF_COVERAGE' },
        );
    }

    const free = hasFreeShipping(items || []);
    const eta = process.env.GESTIONAR_ETA_HOME || '1 a 3 días hábiles';
    const originalPrice = coverage.price;

    return {
        provider: 'gestionar',
        freeShipping: free,
        coverage: {
            partido: coverage.partido,
            zona: coverage.zona,
            zoneName: coverage.zoneName,
        },
        options: [
            {
                id: 'gestionar-home',
                provider: 'gestionar',
                label: `Envío a domicilio · ${coverage.partido}`,
                mode: 'home',
                serviceType: 'GESTIONAR_HOME',
                price: free ? 0 : originalPrice,
                originalPrice,
                currency: 'ARS',
                eta,
                raw: {
                    zone: coverage.zona,
                    zoneName: coverage.zoneName,
                    partido: coverage.partido,
                },
            },
        ],
        raw: null,
    };
}

// ============================================================================
// Catálogo
// ============================================================================

async function getProductCategories() {
    const raw = await request({
        method: 'GET',
        path: '/api/external-client/fullfilment/get-products-category',
    });
    return unwrap(raw) || [];
}

async function createProductCategory({ name }) {
    if (!name || typeof name !== 'string') {
        throw new GestionarError('name requerido', 400);
    }
    const raw = await request({
        method: 'POST',
        path: '/api/external-client/fullfilment/create-products-category',
        body: { name },
    });
    return unwrap(raw);
}

async function getProducts() {
    const raw = await request({
        method: 'GET',
        path: '/api/external-client/fullfilment/get-products',
    });
    return Array.isArray(raw) ? raw : (unwrap(raw) || []);
}

async function createProduct({
    name,
    category,
    skus,
    is_kit = false,
    kit_items = [],
    description = null,
    waist = null,
    color = null,
    dimension = null,
    measure = null,
    brand = null,
    model = null,
}) {
    if (!name) throw new GestionarError('name requerido', 400);
    if (!category) throw new GestionarError('category requerido', 400);
    if (!Array.isArray(skus) || skus.length === 0) {
        throw new GestionarError('skus[] requerido', 400);
    }
    const raw = await request({
        method: 'POST',
        path: '/api/external-client/fullfilment/create-products',
        body: {
            name,
            category,
            skus,
            is_kit,
            kit_items,
            description,
            waist,
            color,
            dimension,
            measure,
            brand,
            model,
        },
    });
    return unwrap(raw);
}

async function getWarehouses() {
    const raw = await request({
        method: 'GET',
        path: '/api/external-client/fullfilment/get-warehouse-by-client',
    });
    return unwrap(raw) || [];
}

// ============================================================================
// Operativos (pickup, paquetes)
// ============================================================================

async function getPickupTimes() {
    const raw = await request({
        method: 'GET',
        path: '/api/external-client/pickup-times',
    });
    return unwrap(raw) || [];
}

async function createPickup({ orders_ids, platform_id, pickup_time_id }) {
    if (!Array.isArray(orders_ids) || orders_ids.length === 0) {
        throw new GestionarError('orders_ids[] requerido', 400);
    }
    if (!platform_id) throw new GestionarError('platform_id requerido', 400);
    if (!pickup_time_id) throw new GestionarError('pickup_time_id requerido', 400);
    const raw = await request({
        method: 'POST',
        path: '/api/external-client/pickup',
        body: {
            orders_ids,
            platform_id: String(platform_id),
            pickup_time_id: String(pickup_time_id),
        },
    });
    return unwrap(raw);
}

async function getPackages(query = {}) {
    return request({
        method: 'GET',
        path: '/api/external-client/packages',
        params: query,
    });
}

// ============================================================================
// Push de paquetes — JSON { condition, type, packages: [...] }
// ============================================================================
//
// Gestionar migró este endpoint (mediados de jun 2026): antes subía un Excel en
// el campo `file`, ahora valida un body JSON con un array `packages` (un objeto
// por fila destinatario×SKU) y rechaza el `file` con HTTP 422
// "El campo packages es obligatorio". El builder de Excel (`buildFullfilmentExcel`,
// más abajo) queda solo para los smoke tests; el push real usa
// `buildPackagesPayload` + `registerNotLinkedPackages`.

/**
 * Fecha de venta como SERIAL de Excel (días desde 1899-12-30). El validador de
 * Gestionar acepta strings, pero el procesamiento la pasa por PhpSpreadsheet
 * `Date::excelToDateTimeObject()`, que exige un número (serial Excel): mandar un
 * string ISO crashea con `floor(): ... string given`. Es el mismo valor que
 * tenían las celdas de fecha del Excel viejo (de ahí que antes funcionara).
 */
function toExcelSerialDate(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const utcMidnight = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const EXCEL_EPOCH = Date.UTC(1899, 11, 30);
    return Math.round((utcMidnight - EXCEL_EPOCH) / 86_400_000);
}

/**
 * Arma el array `packages` que espera not-linked-register. Una entrada por
 * (orden × item con SKU). Mismas reglas de saneo que el Excel viejo:
 *   - codigo_postal numérico de 4 dígitos (normalizeCP)
 *   - localidad = partido canónico AMBA si el CP está cubierto
 *   - telefono solo dígitos
 * Claves (snake_case) confirmadas contra el validador de Gestionar:
 *   destinatario, direccion, localidad, codigo_postal, telefono, correo,
 *   tipo_de_entrega, fecha_de_venta, turbo, monto_a_pagar, observaciones,
 *   sku, cantidad.
 */
function buildPackagesPayload({ orders } = {}) {
    if (!Array.isArray(orders) || orders.length === 0) {
        throw new GestionarError('orders[] requerido', 400);
    }

    const packages = [];
    const ordersWithoutItems = [];

    for (const order of orders) {
        const items = (order.items || []).filter((it) => {
            const sku = (it && it.sku ? String(it.sku) : '').trim();
            return sku.length > 0;
        });
        if (items.length === 0) {
            ordersWithoutItems.push(order.id);
            continue;
        }

        const destinatario = (order.customer_name || '').trim();
        const direccion = joinAddress(order.shipping_address_line1, order.shipping_address_line2);
        const codigoPostal = normalizeCP(order.shipping_postal_code);
        const coverage = lookupCP(order.shipping_postal_code);
        const localidad = coverage?.partido || (order.shipping_city || '').trim();
        const telefono = (order.customer_phone || '').replace(/\D/g, '');
        const correo = (order.customer_email || '').trim();
        const fechaVenta = toExcelSerialDate(order.created_at || new Date());
        const observaciones = (order.shipping_notes || '').trim();

        for (const item of items) {
            const cantidad = Number(item.quantity);
            packages.push({
                destinatario,
                direccion,
                localidad,
                codigo_postal: codigoPostal,
                telefono,
                correo,
                tipo_de_entrega: 'Residencial',
                fecha_de_venta: fechaVenta,
                turbo: 'No',
                monto_a_pagar: 0,
                observaciones,
                sku: String(item.sku).trim(),
                cantidad: Number.isFinite(cantidad) ? cantidad : 0,
            });
        }
    }

    if (packages.length === 0) {
        throw new GestionarError(
            `Ninguna orden quedó con items vendibles (SKU mapeado). Órdenes afectadas: ${ordersWithoutItems.join(', ')}`,
            422,
        );
    }
    if (ordersWithoutItems.length > 0) {
        console.warn(
            '[gestionar.provider] órdenes sin SKU saltadas:',
            ordersWithoutItems.join(', '),
        );
    }
    return packages;
}

/**
 * Sube paquetes de ventas no vinculadas vía JSON.
 * @param {object} args
 * @param {Array<object>} args.packages - array armado por buildPackagesPayload.
 * @param {string}  args.condition      - p.ej. 'nueva venta'.
 * @param {string=} args.type           - p.ej. 'fullfilment'.
 */
async function registerNotLinkedPackages({ packages, condition, type } = {}) {
    if (!Array.isArray(packages) || packages.length === 0) {
        throw new GestionarError('packages[] requerido', 400);
    }
    if (!condition) throw new GestionarError('condition requerido', 400);

    const body = { condition, packages };
    if (type) body.type = type;

    return request({
        method: 'POST',
        path: '/api/external-client/package/not-linked-register',
        body,
    });
}

// Headers exactos de la plantilla `ventas_novinculadas_fullfilment.xlsx`. El
// orden y los acentos importan: Gestionar parsea el Excel por nombre de columna.
const FULLFILMENT_HEADERS = [
    'Destinatario',
    'Dirección',
    'Localidad',
    'Código Postal',
    'Teléfono',
    'Correo',
    'Tipo de Entrega',
    'Fecha de Venta',
    'Turbo',
    'Monto a Pagar',
    'Observaciones',
    'SKU',
    'Cantidad',
];

function toExcelDate(value) {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function joinAddress(line1, line2) {
    return [line1, line2].map((s) => (s || '').trim()).filter(Boolean).join(' - ');
}

/**
 * Construye el Excel (.xlsx) con paquetes de ventas no vinculadas que Gestionar
 * espera en `POST /api/external-client/package/not-linked-register`.
 *
 * Una fila por (orden × item): si una orden tiene 2 SKUs, ocupa 2 filas con los
 * datos de destinatario repetidos.
 *
 * @param {object} args
 * @param {Array<{
 *   id: string,
 *   customer_name: string|null,
 *   customer_email: string|null,
 *   customer_phone: string|null,
 *   shipping_address_line1: string|null,
 *   shipping_address_line2: string|null,
 *   shipping_city: string|null,
 *   shipping_postal_code: string|null,
 *   shipping_notes: string|null,
 *   created_at: string|null,
 *   items: Array<{ sku: string|null, quantity: number }>
 * }>} args.orders
 * @returns {Promise<Buffer>}
 */
async function buildFullfilmentExcel({ orders } = {}) {
    if (!Array.isArray(orders) || orders.length === 0) {
        throw new GestionarError('orders[] requerido', 400);
    }

    let ExcelJS;
    try {
        ExcelJS = require('exceljs');
    } catch (_e) {
        throw new GestionarError(
            'Falta el paquete `exceljs` en server/package.json.',
            501,
        );
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Hoja1');
    sheet.addRow(FULLFILMENT_HEADERS);

    const ordersWithoutItems = [];
    let rowsWritten = 0;

    for (const order of orders) {
        const items = (order.items || []).filter((it) => {
            const sku = (it && it.sku ? String(it.sku) : '').trim();
            return sku.length > 0;
        });
        if (items.length === 0) {
            ordersWithoutItems.push(order.id);
            continue;
        }

        const destinatario = (order.customer_name || '').trim();
        const direccion = joinAddress(order.shipping_address_line1, order.shipping_address_line2);
        // Gestionar rechaza el Excel si el CP no es numérico de 4 dígitos (formato CPA
        // alfanumérico como "C1428CUB" rompe la validación). Cuando el CP cae en AMBA,
        // sobreescribimos también la localidad con el partido canónico — el valor que
        // tipeó el cliente puede no coincidir con el padrón de Gestionar.
        const codigoPostal = normalizeCP(order.shipping_postal_code);
        const coverage = lookupCP(order.shipping_postal_code);
        const localidad = coverage?.partido || (order.shipping_city || '').trim();
        // Gestionar valida `telefono` con regex digit-only de 6 a 20 caracteres.
        // El "+", espacios y guiones rompen el validador → sanitizamos a dígitos.
        const telefono = (order.customer_phone || '').replace(/\D/g, '');
        const correo = (order.customer_email || '').trim();
        const fechaVenta = toExcelDate(order.created_at || new Date());
        const observaciones = (order.shipping_notes || '').trim();

        for (const item of items) {
            const cantidad = Number(item.quantity);
            const row = sheet.addRow([
                destinatario,
                direccion,
                localidad,
                codigoPostal,
                telefono,
                correo,
                'Residencial',
                fechaVenta,
                'No',
                0,
                observaciones,
                String(item.sku).trim(),
                Number.isFinite(cantidad) ? cantidad : 0,
            ]);
            // Gestionar (PhpSpreadsheet) lee la fecha vía Date::excelToDateTimeObject,
            // que requiere un serial Excel (número), no string. Forzamos numFmt
            // para que el cell.v sea un número y el formato visible sea DD/MM/YYYY.
            row.getCell(8).numFmt = 'dd/mm/yyyy';
            rowsWritten += 1;
        }
    }

    if (rowsWritten === 0) {
        throw new GestionarError(
            `Ninguna orden quedó con items vendibles (SKU mapeado). Órdenes afectadas: ${ordersWithoutItems.join(', ')}`,
            422,
        );
    }
    if (ordersWithoutItems.length > 0) {
        // Si algunas órdenes no tienen SKU, no abortamos el batch entero — el
        // dispatcher ya marca el error por orden vía gestionar_error cuando un
        // push falla, así que escalar acá rompería las órdenes que sí tienen
        // SKU mapeado. Loggeamos y seguimos.
        console.warn(
            '[gestionar.provider] órdenes sin SKU saltadas:',
            ordersWithoutItems.join(', '),
        );
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
}

module.exports = {
    GestionarError,
    quote,
    getProductCategories,
    createProductCategory,
    getProducts,
    createProduct,
    getWarehouses,
    getPickupTimes,
    createPickup,
    getPackages,
    registerNotLinkedPackages,
    buildPackagesPayload,
    buildFullfilmentExcel,
};
