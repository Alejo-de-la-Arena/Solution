const axios = require('axios');
const { getCorreoConfig } = require('./correo.config');
const { getToken, invalidateToken } = require('./correo.auth');
const {
    CorreoApiError,
    CorreoAuthError,
    CorreoNoCoverageError,
    CorreoRateError,
} = require('./correo.errors');

function createHttpClient() {
    const config = getCorreoConfig();

    return axios.create({
        baseURL: config.baseUrl,
        timeout: config.timeoutMs,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

async function requestWithBearer(method, url, { params, data, headers } = {}, retry = true) {
    const http = createHttpClient();
    const token = await getToken();

    try {
        const response = await http.request({
            method,
            url,
            params,
            data,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(headers || {}),
            },
        });

        return response.data;
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data || null;

        if ((status === 401 || status === 403) && retry) {
            invalidateToken();
            return requestWithBearer(method, url, { params, data, headers }, false);
        }

        if (status === 401 || status === 403) {
            throw new CorreoAuthError('No autorizado por Correo Argentino.', {
                details: payload,
                cause: error,
            });
        }

        throw new CorreoApiError(`Error al consumir ${method.toUpperCase()} ${url} de Correo Argentino.`, {
            statusCode: status || 502,
            details: payload,
            cause: error,
        });
    }
}

async function validateUser(email, password) {
    if (!email || !password) {
        throw new CorreoAuthError('Faltan email o password de la cuenta MiCorreo para users/validate.');
    }

    return requestWithBearer('post', '/users/validate', {
        data: { email, password },
    });
}

async function getAgencies({ customerId, provinceCode, services } = {}) {
    if (!customerId) {
        throw new CorreoApiError('customerId es obligatorio para consultar sucursales.', {
            statusCode: 400,
            code: 'MISSING_CUSTOMER_ID',
        });
    }
    if (!provinceCode) {
        throw new CorreoApiError('provinceCode es obligatorio para consultar sucursales.', {
            statusCode: 400,
            code: 'MISSING_PROVINCE_CODE',
        });
    }

    const params = { customerId, provinceCode };
    if (services) params.services = services;

    return requestWithBearer('get', '/agencies', { params });
}

async function getRates(payload) {
    try {
        return await requestWithBearer('post', '/rates', { data: payload });
    } catch (error) {
        console.error('[getRates] error detalle:', JSON.stringify(error?.details || error?.cause?.response?.data || error, null, 2));
        if (error?.statusCode === 404) {
            throw new CorreoNoCoverageError('Correo no devolvió cobertura o tarifas para el destino solicitado.', {
                details: error.details,
                cause: error,
            });
        }

        throw new CorreoRateError('No se pudo cotizar con Correo Argentino.', {
            details: error.details,
            cause: error,
        });
    }
}

async function importShipment(payload) {
    return requestWithBearer('post', '/shipping/import', {
        data: payload,
    });
}

async function getTracking(shippingId) {
    if (!shippingId) {
        throw new CorreoApiError('shippingId es obligatorio para consultar tracking.', {
            statusCode: 400,
            code: 'MISSING_SHIPPING_ID',
        });
    }

    return requestWithBearer('get', '/shipping/tracking', {
        params: { shippingId },
    });
}

module.exports = {
    validateUser,
    getAgencies,
    getRates,
    importShipment,
    getTracking,
};