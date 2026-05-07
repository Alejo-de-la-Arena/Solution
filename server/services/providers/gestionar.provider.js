const axios = require('axios');
const { hasFreeShipping } = require('../shipping.rules');

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
 * Cotiza envío Gestionar para CABA/GBA.
 *
 * Gestionar (modo fullfilment) no expone API pública de tarifas, así que
 * espejamos el precio que cobraría Correo Argentino (Clásico Domicilio) para
 * la misma dirección. Mantenemos la regla de envío gratis (≥2 perfumes) y la
 * presentación de Gestionar (eta, label).
 *
 * `GESTIONAR_FLAT_RATE_HOME` actúa como switch binario en `shipping.rules.js`:
 * cualquier valor activa Gestionar para CABA/GBA, vacío lo deshabilita. El
 * valor numérico ya no se usa.
 */
async function quote({ items, address } = {}) {
    // Lazy-require para evitar ciclo (correo.provider no depende de gestionar).
    const correoProvider = require('./correo/correo.provider');

    let correoQuote;
    try {
        correoQuote = await correoProvider.quote({ items, address });
    } catch (err) {
        throw new GestionarError(
            `No se pudo obtener tarifa de referencia (Correo): ${err.message || err}`,
            err.status || 502,
            err.raw || null,
        );
    }

    const homeOptions = (correoQuote?.options || []).filter((o) => o.mode === 'home');
    // Preferimos Clásico (CP); fallback a Expreso (EP) si Correo no devolvió CP.
    const reference = homeOptions.find((o) => o.serviceType === 'CP') || homeOptions[0];
    if (!reference) {
        throw new GestionarError(
            'Correo Argentino no devolvió cotización a domicilio para esta dirección.',
            422,
        );
    }

    const free = hasFreeShipping(items || []);
    const eta = process.env.GESTIONAR_ETA_HOME || '1 a 3 días hábiles';
    const originalPrice = Number(reference.originalPrice ?? reference.price ?? 0) || 0;

    return {
        provider: 'gestionar',
        freeShipping: free,
        options: [
            {
                id: 'gestionar-home',
                label: 'Envío a domicilio (CABA / GBA)',
                mode: 'home',
                serviceType: 'GESTIONAR_HOME',
                price: free ? 0 : originalPrice,
                originalPrice,
                currency: 'ARS',
                eta,
                raw: { correoReference: reference.serviceType, correoRaw: reference.raw || null },
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
// Push de paquetes — multipart/form-data
// ============================================================================

/**
 * Sube un Excel con paquetes de ventas no vinculadas a Gestionar.
 * @param {object}  args
 * @param {Buffer}  args.excelBuffer - .xlsx armado por buildFullfilmentExcel.
 * @param {string}  args.condition   - p.ej. 'cambio'.
 * @param {string=} args.type        - p.ej. 'fullfilment'.
 */
async function registerNotLinkedPackages({ excelBuffer, condition, type } = {}) {
    if (!excelBuffer || !Buffer.isBuffer(excelBuffer)) {
        throw new GestionarError('excelBuffer (Buffer) requerido', 400);
    }
    if (!condition) throw new GestionarError('condition requerido', 400);

    let FormData;
    try {
        FormData = require('form-data');
    } catch (_e) {
        throw new GestionarError(
            'Falta el paquete `form-data` en server/package.json. Se agrega cuando se implemente la fase 8 (push real a Gestionar).',
            501,
        );
    }

    const form = new FormData();
    form.append('file', excelBuffer, {
        filename: 'paquetes.xlsx',
        contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    form.append('condition', condition);
    if (type) form.append('type', type);

    try {
        const { data } = await axios.post(
            `${GESTIONAR_API_URL}/api/external-client/package/not-linked-register`,
            form,
            {
                headers: {
                    'secret-token-key': getApiKey(),
                    ...form.getHeaders(),
                },
                maxBodyLength: 50 * 1024 * 1024,
                timeout: 60_000,
            },
        );
        return data;
    } catch (err) {
        const status = err.response?.status || 500;
        const raw = err.response?.data || null;
        const msg = raw?.message || err.message || 'Error subiendo Excel a Gestionar';
        throw new GestionarError(msg, status, raw);
    }
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
        const localidad = (order.shipping_city || '').trim();
        const codigoPostal = (order.shipping_postal_code || '').trim();
        const telefono = (order.customer_phone || '').trim();
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
    buildFullfilmentExcel,
};
