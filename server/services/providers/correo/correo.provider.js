const { getCorreoConfig } = require('./correo.config');
const { validateUser, getAgencies, getRates, importShipment, getTracking } = require('./correo.client');
const {
    buildParcelFromItems,
    buildRatesPayload,
    buildImportPayload,
    mapProvinceNameToCode,
} = require('./correo.mapper');
const { hasFreeShipping } = require('../../shipping.rules');
const { normalizeAddress } = require('../../shipping.utils');
const { CorreoValidationError } = require('./correo.errors');

async function resolveCustomerId() {
    const config = getCorreoConfig();

    if (config.operational.customerId) {
        return config.operational.customerId;
    }

    const { email, accountPassword } = config.micorreo;
    if (!email || !accountPassword) {
        throw new CorreoValidationError(
            'Falta CORREO_CUSTOMER_ID o bien CORREO_MICORREO_EMAIL + CORREO_MICORREO_ACCOUNT_PASSWORD.'
        );
    }

    const result = await validateUser(email, accountPassword);
    const customerId = result?.customerId || result?.data?.customerId || null;
    if (!customerId) {
        throw new CorreoValidationError('No se pudo obtener customerId desde users/validate.');
    }
    return customerId;
}

/**
 * Normaliza la respuesta de /rates aplicando las siguientes reglas de negocio:
 *
 * Opciones que se muestran:
 *   - Clásico (CP) a domicilio    → gratis si freeShipping, sino precio real
 *   - Clásico (CP) en sucursal    → gratis si freeShipping, sino precio real
 *   - Expreso  (EP) a domicilio   → SIEMPRE precio real (no aplica envío gratis)
 *   - Expreso  (EP) en sucursal   → DESCARTADO, no se ofrece
 *
 * Orden de presentación: Clásico domicilio → Clásico sucursal → Expreso domicilio
 */
function normalizeRatesResult(raw, { freeShipping }) {
    const rates = Array.isArray(raw?.rates) ? raw.rates : [];

    // Descartar Expreso en sucursal (S/EP)
    const filtered = rates.filter(
        (row) => !(row.deliveredType === 'S' && row.productType === 'EP')
    );

    // Ordenar: CP primero (D luego S), luego EP (solo D)
    const ORDER = { 'D-CP': 0, 'S-CP': 1, 'D-EP': 2 };
    filtered.sort((a, b) => {
        const keyA = `${a.deliveredType}-${a.productType}`;
        const keyB = `${b.deliveredType}-${b.productType}`;
        return (ORDER[keyA] ?? 9) - (ORDER[keyB] ?? 9);
    });

    return filtered.map((row, index) => {
        const isClasico = row.productType === 'CP';
        const mode = row.deliveredType === 'S' ? 'branch' : 'home';
        const originalPrice = Number(row.price || 0) || 0;

        // Envío gratis SOLO para Clásico (CP)
        const isFree = freeShipping && isClasico;

        const baseLabel = row.productName || 'Correo Argentino';
        const label = mode === 'branch'
            ? `${baseLabel} — Retiro en sucursal`
            : baseLabel;

        let eta = null;
        if (row.deliveryTimeMin && row.deliveryTimeMax) {
            eta = `${row.deliveryTimeMin} a ${row.deliveryTimeMax} días hábiles`;
        } else if (row.deliveryTimeMax) {
            eta = `Hasta ${row.deliveryTimeMax} días hábiles`;
        }

        return {
            id: `correo-${mode}-${(row.productType || 'x').toLowerCase()}-${index}`,
            label,
            mode,
            serviceType: row.productType || null,
            price: isFree ? 0 : originalPrice,
            originalPrice,
            currency: 'ARS',
            eta,
            raw: row,
        };
    });
}

/**
 * Cotiza envío para los items y la dirección dados.
 * Hace una sola llamada a /rates sin deliveredType para recibir D y S en un request.
 */
async function quote({ items, address }) {
    const normalizedAddress = normalizeAddress(address);
    const customerId = await resolveCustomerId();
    const parcel = buildParcelFromItems(items);
    const freeShipping = hasFreeShipping(items);

    const ratesRaw = await getRates(
        buildRatesPayload({
            customerId,
            postalCodeDestination: normalizedAddress.postalCode,
            parcel,
            // Sin deliveredType → API devuelve D y S juntos
        })
    );

    const options = normalizeRatesResult(ratesRaw, { freeShipping });

    return {
        provider: 'correo_argentino',
        freeShipping,
        parcel,
        options,
        raw: ratesRaw,
        customerId,
    };
}

async function listAgencies({ province }) {
    const customerId = await resolveCustomerId();
    const provinceCode = mapProvinceNameToCode(province);
    const raw = await getAgencies({ customerId, provinceCode });

    console.log('RAW AGENCIES RESPONSE:', JSON.stringify(raw, null, 2));

    const agencies = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.agencies) ? raw.agencies : []);

    return agencies.map((agency) => ({
        id: agency.code || null,
        code: agency.code || null,
        name: agency.name || '',
        address: agency.location?.address?.streetName
            ? `${agency.location.address.streetName} ${agency.location.address.streetNumber || ''}`.trim()
            : '',
        postalCode: agency.location?.address?.postalCode || '',
        locality: agency.location?.address?.locality || agency.location?.address?.city || '',
        province: agency.location?.address?.province || provinceCode,
        pickupAvailability: !!agency.services?.pickupAvailability,
        packageReception: !!agency.services?.packageReception,
        hours: agency.hours || null,
        status: agency.status || null,
        raw: agency,
    }));
}

async function createShipment({ order, items, address, agencyCode, deliveryType }) {
    const customerId = await resolveCustomerId();
    const parcel = buildParcelFromItems(items);

    const payload = buildImportPayload({
        customerId,
        order,
        items,
        address,
        parcel,
        agencyCode,
        deliveryType,
    });

    const raw = await importShipment(payload);

    return { customerId, parcel, payload, raw };
}

async function tracking({ shippingId }) {
    return getTracking(shippingId);
}

module.exports = {
    quote,
    listAgencies,
    createShipment,
    tracking,
    resolveCustomerId,
};