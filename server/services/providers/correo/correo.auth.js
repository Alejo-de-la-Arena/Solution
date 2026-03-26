const axios = require('axios');
const { getCorreoConfig } = require('./correo.config');
const { CorreoAuthError, CorreoApiError } = require('./correo.errors');

let cachedToken = null;
let cachedTokenExpiresAt = 0;
let inFlightTokenPromise = null;

function buildBasicAuthHeader(username, password) {
    const raw = `${username}:${password}`;
    return `Basic ${Buffer.from(raw).toString('base64')}`;
}

function getTokenCacheSkewMs() {
    return 60 * 1000;
}

function isTokenValid() {
    return !!cachedToken && Date.now() < (cachedTokenExpiresAt - getTokenCacheSkewMs());
}

function invalidateToken() {
    cachedToken = null;
    cachedTokenExpiresAt = 0;
    inFlightTokenPromise = null;
}

async function fetchToken() {
    const config = getCorreoConfig();

    if (config.mode !== 'micorreo') {
        throw new CorreoAuthError('El modo actual no es micorreo. Todavía no está implementada auth PAQ.AR en este archivo.');
    }

    const { username, password } = config.micorreo;

    if (!username || !password) {
        throw new CorreoAuthError('Faltan CORREO_MICORREO_USERNAME o CORREO_MICORREO_PASSWORD en variables de entorno.');
    }

    const url = `${config.baseUrl}/token`;

    try {
        const response = await axios.post(
            url,
            {},
            {
                timeout: config.timeoutMs,
                headers: {
                    Authorization: buildBasicAuthHeader(username, password),
                    'Content-Type': 'application/json',
                },
            }
        );

        const token =
            response?.data?.token ||
            response?.data?.jwt ||
            response?.data?.access_token ||
            response?.data?.accessToken ||
            null;

        if (!token) {
            throw new CorreoAuthError('Correo respondió sin token JWT válido.', {
                details: response?.data || null,
            });
        }

        const expiresInSeconds =
            Number(response?.data?.expires_in) ||
            Number(response?.data?.expiresIn) ||
            3600;

        cachedToken = token;
        cachedTokenExpiresAt = Date.now() + (expiresInSeconds * 1000);

        return cachedToken;
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data || null;

        if (status === 401 || status === 403) {
            throw new CorreoAuthError('Credenciales inválidas o no autorizadas por Correo Argentino.', {
                details: payload,
                cause: error,
            });
        }

        throw new CorreoApiError('No se pudo obtener token de Correo Argentino.', {
            statusCode: status || 502,
            details: payload,
            cause: error,
        });
    }
}

async function getToken() {
    if (isTokenValid()) {
        return cachedToken;
    }

    if (inFlightTokenPromise) {
        return inFlightTokenPromise;
    }

    inFlightTokenPromise = fetchToken()
        .then((token) => {
            inFlightTokenPromise = null;
            return token;
        })
        .catch((error) => {
            inFlightTokenPromise = null;
            invalidateToken();
            throw error;
        });

    return inFlightTokenPromise;
}

module.exports = {
    getToken,
    invalidateToken,
    buildBasicAuthHeader,
};