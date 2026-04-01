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
    if (!raw) {
        return {
            street: '',
            number: '',
        };
    }

    const match = raw.match(/^(.*?)(?:\s+(\d+[A-Za-z0-9\-\/]*))?$/);
    const street = (match?.[1] || raw).trim();
    const number = (match?.[2] || '').trim();

    return {
        street,
        number,
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
    const weight = safeInt(item?.weight_grams, 450);
    const width = safeInt(item?.width_cm, 12);
    const height = safeInt(item?.height_cm, 8);
    const length = safeInt(item?.length_cm, 18);

    return { weight, width, height, length };
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

    // Regla simple de packaging consolidado v1
    let width = maxUnitWidth;
    let height = maxUnitHeight;
    let length = maxUnitLength;

    if (totalQuantity === 1) {
        width = maxUnitWidth;
        height = maxUnitHeight;
        length = maxUnitLength;
    } else if (totalQuantity === 2) {
        width = maxUnitWidth + 6;
        height = maxUnitHeight + 2;
        length = maxUnitLength + 6;
    } else if (totalQuantity <= 4) {
        width = maxUnitWidth + 12;
        height = maxUnitHeight + 6;
        length = maxUnitLength + 12;
    } else {
        width = maxUnitWidth + 18;
        height = maxUnitHeight + 10;
        length = maxUnitLength + 18;
    }

    return {
        weight: safeInt(totalWeight, 450),
        width: safeInt(width, 12),
        height: safeInt(height, 8),
        length: safeInt(length, 18),
        declaredValue: safeInt(declaredValue, 0),
        totalQuantity,
    };
}

function buildRatesPayload({
    customerId,
    postalCodeDestination,
    parcel,
    deliveredType,
}) {
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
        productType: config.operational.productType || 'CP',
        weight: safeInt(parcel.weight),
        height: safeInt(parcel.height),
        width: safeInt(parcel.width),
        length: safeInt(parcel.length),
    };

    if (deliveredType) {
        payload.deliveredType = deliveredType;
    }

    return payload;
}

function buildRecipientFromAddress(address = {}) {
    if (!address.street) {
        throw new CorreoValidationError('La calle es obligatoria.');
    }
    if (!address.number) {
        throw new CorreoValidationError('La altura/número es obligatorio.');
    }
    if (!address.city) {
        throw new CorreoValidationError('La ciudad/localidad es obligatoria.');
    }
    if (!address.province) {
        throw new CorreoValidationError('La provincia es obligatoria.');
    }
    if (!address.postalCode) {
        throw new CorreoValidationError('El código postal es obligatorio.');
    }

    return {
        name: address.name || 'Cliente',
        streetName: address.street,
        streetNumber: String(address.number),
        floor: address.floor || '',
        apartment: address.apartment || '',
        locality: address.city,
        province: mapProvinceNameToCode(address.province),
        postalCode: String(address.postalCode).trim(),
        phone: address.phone || '',
        email: address.email || '',
    };
}

function buildImportPayload({
    customerId,
    order,
    items,
    address,
    parcel,
    agencyCode,
    deliveryType,
}) {
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
        throw new CorreoValidationError('agencyCode es obligatorio cuando el envío es a sucursal.');
    }

    const recipient = buildRecipientFromAddress(address);

    return {
        customerId,
        extOrderId: String(order.id),
        orderNumber: String(order.id),
        productType: config.operational.productType || 'CP',
        sender: {
            agency: config.operational.originAgencyCode || '',
            postalCode: config.operational.originPostalCode || '',
            province: config.operational.originProvinceCode || 'B',
        },
        recipient,
        shipping: {
            deliveryType,
            agency: deliveryType === 'S' ? String(agencyCode) : undefined,
            address: deliveryType === 'D'
                ? {
                    streetName: recipient.streetName,
                    streetNumber: recipient.streetNumber,
                    floor: recipient.floor,
                    apartment: recipient.apartment,
                    locality: recipient.locality,
                    province: recipient.province,
                    postalCode: recipient.postalCode,
                }
                : undefined,
        },
        parcel: {
            weight: safeInt(parcel.weight),
            declaredValue: safeInt(parcel.declaredValue),
            height: safeInt(parcel.height),
            width: safeInt(parcel.width),
            length: safeInt(parcel.length),
        },
        meta: {
            itemCount: Array.isArray(items) ? items.length : 0,
            channel: order?.channel || null,
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