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
 * Normalizes the /rates response.
 *
 * API response shape:
 * {
 *   customerId, validTo,
 *   rates: [
 *     { deliveredType, productType, productName, price, deliveryTimeMin, deliveryTimeMax }
 *   ]
 * }
 */
function normalizeRatesResult(raw, { freeShipping }) {
    const rates = Array.isArray(raw?.rates) ? raw.rates : [];

    return rates.map((row, index) => {
        const originalPrice = Number(row.price || 0) || 0;
        const mode = row.deliveredType === 'S' ? 'branch' : 'home';

        let eta = null;
        if (row.deliveryTimeMin && row.deliveryTimeMax) {
            eta = `${row.deliveryTimeMin} a ${row.deliveryTimeMax} días hábiles`;
        } else if (row.deliveryTimeMax) {
            eta = `Hasta ${row.deliveryTimeMax} días hábiles`;
        }

        return {
            id: `correo-${mode}-${index + 1}`,
            label: row.productName || 'Correo Argentino',
            mode,
            serviceType: row.productType || null,
            price: freeShipping ? 0 : originalPrice,
            originalPrice,
            currency: 'ARS',
            eta,
            raw: row,
        };
    });
}

/**
 * Quotes shipping for given items + address.
 * Uses a single /rates call without deliveredType to get both D and S options.
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
            // No deliveredType → API returns both D and S in one shot
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

    const agencies = Array.isArray(raw) ? raw : (Array.isArray(raw?.agencies) ? raw.agencies : []);

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

    return {
        customerId,
        parcel,
        payload,
        raw,
    };
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