const DEFAULT_TIMEOUT_MS = 15000;

function getEnv(name, fallback = '') {
    const value = process.env[name];
    return typeof value === 'string' ? value.trim() : fallback;
}

function getCorreoEnv() {
    const env = getEnv('CORREO_ENV', 'qa').toLowerCase();
    return env === 'prod' ? 'prod' : 'qa';
}

function getCorreoMode() {
    const mode = getEnv('CORREO_PROVIDER_MODE', 'micorreo').toLowerCase();
    return mode === 'paqar' ? 'paqar' : 'micorreo';
}

function getCorreoBaseUrl() {
    const env = getCorreoEnv();
    if (getCorreoMode() === 'paqar') {
        return env === 'prod'
            ? getEnv('CORREO_PAQAR_BASE_URL_PROD')
            : getEnv('CORREO_PAQAR_BASE_URL_QA');
    }

    return env === 'prod'
        ? getEnv('CORREO_MICORREO_BASE_URL_PROD', 'https://api.correoargentino.com.ar/micorreo/v1')
        : getEnv('CORREO_MICORREO_BASE_URL_QA', 'https://apitest.correoargentino.com.ar/micorreo/v1');
}

function getCorreoTimeout() {
    const raw = Number(getEnv('CORREO_TIMEOUT_MS', String(DEFAULT_TIMEOUT_MS)));
    return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TIMEOUT_MS;
}

function getMicorreoAuthConfig() {
    return {
        username: getEnv('CORREO_MICORREO_USERNAME'),
        password: getEnv('CORREO_MICORREO_PASSWORD'),
        email: getEnv('CORREO_MICORREO_EMAIL'),
        accountPassword: getEnv('CORREO_MICORREO_ACCOUNT_PASSWORD'),
    };
}

function getPaqArAuthConfig() {
    return {
        agreement: getEnv('CORREO_PAQAR_AGREEMENT'),
        apiKey: getEnv('CORREO_PAQAR_API_KEY'),
    };
}

function getOperationalConfig() {
    return {
        customerId: getEnv('CORREO_CUSTOMER_ID'),
        productType: getEnv('CORREO_PRODUCT_TYPE', 'CP'),
        originPostalCode: getEnv('CORREO_ORIGIN_POSTAL_CODE'),
        originProvinceCode: getEnv('CORREO_ORIGIN_PROVINCE_CODE', 'B'),
        originAgencyCode: getEnv('CORREO_ORIGIN_AGENCY_CODE'),
    };
}

function getCorreoConfig() {
    return {
        mode: getCorreoMode(),
        env: getCorreoEnv(),
        baseUrl: getCorreoBaseUrl(),
        timeoutMs: getCorreoTimeout(),
        micorreo: getMicorreoAuthConfig(),
        paqar: getPaqArAuthConfig(),
        operational: getOperationalConfig(),
    };
}

module.exports = {
    getCorreoConfig,
    getCorreoMode,
    getCorreoEnv,
    getCorreoBaseUrl,
    getCorreoTimeout,
};