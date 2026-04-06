const { getCorreoConfig } = require('./correo.config');
const { CorreoValidationError } = require('./correo.errors');

const PROVINCE_CODE_MAP = {
    'BUENOS AIRES': 'B',
    'CABA': 'C',
    'CIUDAD AUTONOMA DE BUENOS AIRES': 'C',
    'CAPITAL FEDERAL': 'C',
    'CATAMARCA': 'K',
    'CHACO': 'H',
    'CHUBUT': 'U',
    'CORDOBA': 'X',
    'CORRIENTES': 'W',
    'ENTRE RIOS': 'E',
    'FORMOSA': 'P',
    'JUJUY': 'Y',
    'LA PAMPA': 'L',
    'LA RIOJA': 'F',
    'MENDOZA': 'M',
    'MISIONES': 'N',
    'NEUQUEN': 'Q',
    'RIO NEGRO': 'R',
    'SALTA': 'A',
    'SAN JUAN': 'J',
    'SAN LUIS': 'D',
    'SANTA CRUZ': 'Z',
    'SANTA FE': 'S',
    'SANTIAGO DEL ESTERO': 'G',
    'TIERRA DEL FUEGO': 'V',
    'TIERRA DEL FUEGO, ANTARTIDA E ISLAS DEL ATLANTICO SUR': 'V',
    'TUCUMAN': 'T',
};

function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
}

function mapProvinceNameToCode(provinceName) {
    const normalized = normalizeText(provinceName);
    const code = PROVINCE_CODE_MAP[normalized];
    if (!code) {
        throw new CorreoValidationError(`Provincia inválida o no mapeada: ${provinceName}`);
    }
    return code;
}

function safeInt(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function parseAddressLine1(line1 = '') {
    const raw = String(line1 || '').trim();
    if (!raw) return { street: '', number: '' };
    const match = raw.match(/^(.*?)(?:\s+(\d+[A-Za-z0-9\-\/]*))?$/);
    return {
        street: (match?.[1] || raw).trim(),
        number: (match?.[2] || '').trim(),
    };
}

function buildAddressFromOrder(order) {
    const parsed = parseAddressLine1(order?.shipping_address_line1 || '');
    return {
        name: order?.shipping_recipient_name || order?.customer_name || 'Cliente',
        email: order?.shipping_recipient_email || order?.customer_email || '',
        phone: order?.shipping_recipient_phone || order?.customer_phone || '',
        street: order?.shipping_street || parsed.street || '',
        number: order?.shipping_number || parsed.number || '',
        floor: order?.shipping_floor || '',
        apartment: order?.shipping_apartment || order?.shipping_address_line2 || '',
        city: order?.shipping_city || '',
        province: order?.shipping_state || '',
        postalCode: order?.shipping_postal_code || '',
        country: order?.shipping_country || 'AR',
    };
}

function getItemUnitDimensions(item) {
    return {
        weight: safeInt(item?.weight_grams, 130),
        width: safeInt(item?.width_cm, 7),
        height: safeInt(item?.height_cm, 14),
        length: safeInt(item?.length_cm, 7),
    };
}

function buildParcelFromItems(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new CorreoValidationError('No hay items para construir el paquete.');
    }

    let totalWeight = 0;
    let declaredValue = 0;
    let totalQuantity = 0;
    let maxUnitWidth = 12;
    let maxUnitHeight = 8;
    let maxUnitLength = 18;

    for (const item of items) {
        const quantity = safeInt(item.quantity, 1) || 1;
        const unitPrice = Number(item.unit_price || item.price || 0) || 0;
        const dims = getItemUnitDimensions(item);

        totalWeight += dims.weight * quantity;
        declaredValue += unitPrice * quantity;
        totalQuantity += quantity;

        maxUnitWidth = Math.max(maxUnitWidth, dims.width);
        maxUnitHeight = Math.max(maxUnitHeight, dims.height);
        maxUnitLength = Math.max(maxUnitLength, dims.length);
    }

    let width = maxUnitWidth;
    let height = maxUnitHeight;
    let length = maxUnitLength;

    if (totalQuantity === 1) { /* keep unit dims */ }
    else if (totalQuantity === 2) { width += 6; height += 2; length += 6; }
    else if (totalQuantity <= 4) { width += 12; height += 6; length += 12; }
    else { width += 18; height += 10; length += 18; }

    return {
        weight: safeInt(totalWeight, 130),
        width: safeInt(width, 12),
        height: safeInt(height, 8),
        length: safeInt(length, 18),
        declaredValue: safeInt(declaredValue, 0),
        totalQuantity,
    };
}

/**
 * Builds the payload for POST /rates
 *
 * Correct structure per MiCorreo API docs:
 * {
 *   customerId, postalCodeOrigin, postalCodeDestination,
 *   deliveredType?,          ← omit to get both D+S in one call
 *   dimensions: { weight, height, width, length }
 * }
 */
function buildRatesPayload({ customerId, postalCodeDestination, parcel, deliveredType }) {
    const config = getCorreoConfig();

    if (!customerId) {
        throw new CorreoValidationError('customerId es obligatorio para cotizar.');
    }
    if (!postalCodeDestination) {
        throw new CorreoValidationError('postalCodeDestination es obligatorio para cotizar.');
    }
    if (!config.operational.originPostalCode) {
        throw new CorreoValidationError('Falta CORREO_ORIGIN_POSTAL_CODE en variables de entorno.');
    }

    const payload = {
        customerId,
        postalCodeOrigin: config.operational.originPostalCode,
        postalCodeDestination: String(postalCodeDestination).trim(),
        dimensions: {
            weight: safeInt(parcel.weight),
            height: safeInt(parcel.height),
            width: safeInt(parcel.width),
            length: safeInt(parcel.length),
        },
    };

    // Only include deliveredType when explicitly provided (omitting it returns both D+S)
    if (deliveredType) {
        payload.deliveredType = deliveredType;
    }

    return payload;
}

/**
 * Builds the payload for POST /shipping/import
 *
 * Correct structure per MiCorreo API docs:
 * {
 *   customerId, extOrderId, orderNumber?,
 *   sender: { name, phone, cellPhone, email, originAddress: {...} },
 *   recipient: { name, phone, cellPhone, email },
 *   shipping: {
 *     deliveryType,          "D" | "S"
 *     productType,           "CP"
 *     agency?,               required when deliveryType === "S"
 *     address?: { streetName, streetNumber, floor, apartment, city, provinceCode, postalCode },
 *     weight, declaredValue, height, length, width
 *   }
 * }
 */
function buildImportPayload({ customerId, order, items, address, parcel, agencyCode, deliveryType }) {
    const config = getCorreoConfig();

    if (!customerId) {
        throw new CorreoValidationError('customerId es obligatorio para importar envío.');
    }
    if (!order?.id) {
        throw new CorreoValidationError('order.id es obligatorio para importar envío.');
    }
    if (!deliveryType || !['D', 'S'].includes(deliveryType)) {
        throw new CorreoValidationError('deliveryType debe ser D o S.');
    }
    if (deliveryType === 'S' && !agencyCode) {
        throw new CorreoValidationError('agencyCode es obligatorio cuando el envío es a sucursal (S).');
    }

    const provinceCode = mapProvinceNameToCode(address.province);

    return {
        customerId,
        extOrderId: String(order.id),
        orderNumber: String(order.id),

        // Sender: use origin config; nulls are accepted by the API
        sender: {
            name: null,
            phone: null,
            cellPhone: null,
            email: null,
            originAddress: {
                streetName: null,
                streetNumber: null,
                floor: null,
                apartment: null,
                city: null,
                provinceCode: config.operational.originProvinceCode || null,
                postalCode: config.operational.originPostalCode || null,
            },
        },

        // Recipient: name + email required; address fields required for homeDelivery
        recipient: {
            name: address.name || 'Cliente',
            phone: address.phone || '',
            cellPhone: '',
            email: address.email || '',
        },

        shipping: {
            deliveryType,
            productType: 'CP',
            agency: deliveryType === 'S' ? String(agencyCode) : null,

            // Address required for homeDelivery (D), can be null/omitted for branch (S)
            address: {
                streetName: address.street || '',
                streetNumber: String(address.number || ''),
                floor: address.floor || '',
                apartment: address.apartment || '',
                city: address.city || '',
                provinceCode,
                postalCode: String(address.postalCode || '').trim(),
            },

            weight: safeInt(parcel.weight),
            declaredValue: safeInt(parcel.declaredValue),
            height: safeInt(parcel.height),
            length: safeInt(parcel.length),
            width: safeInt(parcel.width),
        },
    };
}

module.exports = {
    mapProvinceNameToCode,
    parseAddressLine1,
    buildAddressFromOrder,
    buildParcelFromItems,
    buildRatesPayload,
    buildImportPayload,
    safeInt,
};