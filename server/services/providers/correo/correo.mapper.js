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

/**
 * Como safeInt pero para valores que DEBEN ser positivos (dimensiones/peso del
 * paquete). Correo rechaza el envío ("Debe especificar valores para: envio[...]")
 * si una dimensión llega en 0/null/vacío. Ojo: safeInt NO sirve acá porque
 * Number(null) === 0 y Number('') === 0 son finitos, así que safeInt(null, 14)
 * devolvería 0 en vez del fallback. positiveInt cae al fallback ante cualquier
 * valor no positivo (null, '', 0, negativo, NaN).
 */
function positiveInt(value, fallback) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Normaliza un código postal al CP numérico de 4 dígitos que espera Correo.
 * El cliente suele tipear el CPA completo (ej. "B1847DRA" = letra de provincia
 * + CP + sufijo de cuadra). Correo espera el CP de 4 dígitos y él deriva el CPA;
 * si le mandamos las letras el envío llega con el CPA crudo. Descartamos todo lo
 * no numérico y tomamos los primeros 4 dígitos (mismo criterio que usa el front
 * para mostrar el CP y el provider para ordenar sucursales por cercanía).
 */
function normalizePostalCode(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 4);
}

/**
 * Extrae calle y número de un string de dirección en texto libre.
 * Busca el ÚLTIMO grupo numérico en CUALQUIER posición del string (no solo al
 * final), para cubrir direcciones donde el número no es lo último que aparece
 * (ej. "25 de Mayo 590 esq Mitre"). Esto también respeta calles que empiezan
 * con número (ej. "25 de Mayo", "9 de Julio"), porque esas quedan como parte
 * de la calle salvo que sean el ÚLTIMO grupo numérico del string.
 * Si no hay ningún número, number queda ''.
 */
function parseAddressLine1(line1 = '') {
    const raw = String(line1 || '').trim();
    if (!raw) return { street: '', number: '' };

    const numberPattern = /\d+[A-Za-z0-9\-\/]*/g;
    const matches = [...raw.matchAll(numberPattern)];
    if (matches.length === 0) {
        return { street: raw, number: '' };
    }

    const last = matches[matches.length - 1];
    const number = last[0].trim();
    const street = (raw.slice(0, last.index) + raw.slice(last.index + last[0].length))
        .replace(/[,\s]+$/, '')
        .replace(/^[,\s]+/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    return { street: street || raw, number };
}

function buildAddressFromOrder(order) {
    const parsed = parseAddressLine1(order?.shipping_address_line1 || '');

    let number = order?.shipping_number || parsed.number || '';
    let apartment = order?.shipping_apartment || order?.shipping_address_line2 || '';

    // Checkout tiene dos inputs de texto libre: "Calle y número" (address_line1)
    // y "Piso / Depto" (address_line2, opcional). Nada impide que el cliente
    // cargue el número de la calle en el campo equivocado (address_line2). Si no
    // pudimos sacar el número de address_line1 Y address_line2 es puramente
    // numérico (sin "Piso", "Depto", letras, etc.), es mucho más probable que sea
    // el número de la calle mal ubicado que un piso/depto real. Lo reclasificamos.
    // Si address_line2 tiene texto (ej. "Piso 2", "4D", "PB") se deja como
    // apartment, sin tocar nada.
    if (!number) {
        const line2 = String(order?.shipping_address_line2 || '').trim();
        if (/^\d+$/.test(line2)) {
            number = line2;
            apartment = order?.shipping_apartment || '';
        }
    }

    return {
        name: order?.shipping_recipient_name || order?.customer_name || 'Cliente',
        email: order?.shipping_recipient_email || order?.customer_email || '',
        phone: order?.shipping_recipient_phone || order?.customer_phone || '',
        street: order?.shipping_street || parsed.street || '',
        number,
        floor: order?.shipping_floor || '',
        apartment,
        city: order?.shipping_city || '',
        province: order?.shipping_state || '',
        postalCode: order?.shipping_postal_code || '',
        country: order?.shipping_country || 'AR',
    };
}

function getItemUnitDimensions(item) {
    return {
        weight: positiveInt(item?.weight_grams, 130),
        width: positiveInt(item?.width_cm, 7),
        height: positiveInt(item?.height_cm, 14),
        length: positiveInt(item?.length_cm, 7),
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
        // Dimensiones/peso: SIEMPRE positivas (positiveInt) para no mandarle 0
        // a Correo. declaredValue sí puede ser 0, va con safeInt.
        weight: positiveInt(totalWeight, 130),
        width: positiveInt(width, 12),
        height: positiveInt(height, 8),
        length: positiveInt(length, 18),
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
    const postalCodeDestinationClean = normalizePostalCode(postalCodeDestination);
    if (!postalCodeDestinationClean) {
        throw new CorreoValidationError('postalCodeDestination es obligatorio para cotizar.');
    }
    if (!config.operational.originPostalCode) {
        throw new CorreoValidationError('Falta CORREO_ORIGIN_POSTAL_CODE en variables de entorno.');
    }

    const payload = {
        customerId,
        postalCodeOrigin: config.operational.originPostalCode,
        postalCodeDestination: postalCodeDestinationClean,
        dimensions: {
            weight: positiveInt(parcel.weight, 130),
            height: positiveInt(parcel.height, 8),
            width: positiveInt(parcel.width, 12),
            length: positiveInt(parcel.length, 18),
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

    // Dimensiones finales, garantizadas positivas. Correo rechaza el import con
    // "Debe especificar valores para: envio[altura]" (o ancho/largo/peso) si
    // alguna llega en 0/null. positiveInt asegura un mínimo razonable siempre,
    // así el envío igual sale con dimensiones de caja de perfume por defecto.
    const dims = {
        weight: positiveInt(parcel?.weight, 130),
        height: positiveInt(parcel?.height, 8),
        length: positiveInt(parcel?.length, 18),
        width: positiveInt(parcel?.width, 12),
    };

    // Señal (no bloqueante): si el parcel venía con alguna dimensión ≤ 0 y hubo
    // que usar el default, lo dejamos logueado para detectar productos mal
    // cargados sin frenar el despacho.
    const substituted = ['weight', 'height', 'length', 'width']
        .filter((k) => !(Number(parcel?.[k]) > 0));
    if (substituted.length > 0) {
        console.warn(
            `[correo] dimensiones no positivas en el parcel (${substituted.join(', ')}) ` +
            `para order ${order.id}; se usaron defaults ${JSON.stringify(dims)}.`
        );
    }

    // Número de calle: si no se pudo determinar (ni desde address_line1 ni
    // reclasificando address_line2 en buildAddressFromOrder), usamos "S/N"
    // (convención postal argentina para "sin número") en vez de string vacío.
    // Para domicilio (D) Correo VALIDA este bloque y rechaza streetNumber vacío
    // con un mensaje engañoso ("Debe especificar valores para: envio[altura]")
    // que no señala el campo real; para sucursal (S) no se valida, pero igual
    // mandamos un valor consistente. Solo logueamos (no bloqueante) cuando es D,
    // que es el caso que realmente rompe el despacho.
    const streetNumber = String(address.number || '').trim() || 'S/N';
    if (streetNumber === 'S/N' && deliveryType === 'D') {
        console.warn(
            `[correo] streetNumber no determinado para orden ${order.id} (domicilio); ` +
            `se usó "S/N". Revisar si el número de calle quedó cargado en el campo ` +
            'equivocado (ej. "Piso / Depto" en vez de "Calle y número").'
        );
    }

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
                streetNumber,
                floor: address.floor || '',
                apartment: address.apartment || '',
                city: address.city || '',
                provinceCode,
                postalCode: normalizePostalCode(address.postalCode),
            },

            weight: dims.weight,
            declaredValue: safeInt(parcel?.declaredValue),
            height: dims.height,
            length: dims.length,
            width: dims.width,
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
    normalizePostalCode,
};