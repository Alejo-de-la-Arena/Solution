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
            'Falta CORREO_CUSTOMER_ID o bien CORREO_MICORREO_EMAIL + CORREO_MICORREO_ACCOUNT_PASSWORD para obtener customerId.'
        );
    }

    const result = await validateUser(email, accountPassword);
    const customerId = result?.customerId || result?.data?.customerId || null;

    if (!customerId) {
        throw new CorreoValidationError('No se pudo obtener customerId desde users/validate.');
    }

    return customerId;
}

function normalizeRatesResult(raw, { freeShipping, forceMode }) {
    const rows = Array.isArray(raw) ? raw : (Array.isArray(raw?.rates) ? raw.rates : []);
    return rows.map((row, index) => {
        const originalPrice =
            Number(row.price || row.amount || row.total || 0) || 0;

        return {
            id: row.id || row.serviceId || `correo-rate-${index + 1}`,
            label: row.name || row.serviceName || 'Correo Argentino',
            mode:
                forceMode ||
                (row.deliveredType === 'S' ? 'branch'
                    : row.deliveredType === 'D' ? 'home'
                        : 'unknown'),
            serviceType: row.serviceType || row.service || null,
            price: freeShipping ? 0 : originalPrice,
            originalPrice,
            currency: row.currency || 'ARS',
            eta: row.deadline || row.eta || row.deliveryTime || null,
            raw: row,
        };
    });
}

async function quote({ items, address }) {
    const normalizedAddress = normalizeAddress(address);
    const customerId = await resolveCustomerId();
    const parcel = buildParcelFromItems(items);
    const freeShipping = hasFreeShipping(items);

    const [homeRaw, branchRaw] = await Promise.all([
        getRates(
            buildRatesPayload({
                customerId,
                postalCodeDestination: normalizedAddress.postalCode,
                parcel,
                deliveredType: 'D',
            })
        ),
        getRates(
            buildRatesPayload({
                customerId,
                postalCodeDestination: normalizedAddress.postalCode,
                parcel,
                deliveredType: 'S',
            })
        ),
    ]);

    const homeOptions = normalizeRatesResult(homeRaw, {
        freeShipping,
        forceMode: 'home',
    });

    const branchOptions = normalizeRatesResult(branchRaw, {
        freeShipping,
        forceMode: 'branch',
    });

    return {
        provider: 'correo_argentino',
        freeShipping,
        parcel,
        options: [...homeOptions, ...branchOptions],
        raw: {
            home: homeRaw,
            branch: branchRaw,
        },
        customerId,
    };
}

async function listAgencies({ province }) {
    const customerId = await resolveCustomerId();
    const provinceCode = mapProvinceNameToCode(province);
    const raw = await getAgencies({ customerId, provinceCode });

    const agencies = Array.isArray(raw) ? raw : (Array.isArray(raw?.agencies) ? raw.agencies : []);

    return agencies.map((agency) => ({
        id: agency.agency_id || agency.id || agency.code || null,
        code: agency.agency_id || agency.code || null,
        name: agency.agency_name || agency.name || '',
        address: agency.address || agency.street || '',
        postalCode: agency.postal_code || agency.postalCode || '',
        locality: agency.locality || agency.city || '',
        province: agency.province || provinceCode,
        pickupAvailability: !!agency.pickup_availability,
        packageReception: !!agency.package_reception,
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