const TRANSIENT_NETWORK_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ESOCKETTIMEDOUT',
    'ECONNABORTED',
    'ECONNREFUSED',
    'ENETUNREACH',
    'EAI_AGAIN',
    'EPIPE',
]);

function isTransientNetworkError(error) {
    if (!error) return false;
    if (error.response) return false;
    const code = error.code || error.cause?.code;
    if (code && TRANSIENT_NETWORK_CODES.has(code)) return true;
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('socket hang up')) return true;
    if (msg.includes('network socket disconnected')) return true;
    return false;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Solo para operaciones idempotentes (cotización, sucursales, tracking):
// reintentar un POST que crea recursos (importShipment) podría duplicarlos.
function isRetryableHttpError(error) {
    const status = error?.response?.status;
    return status === 500 || status === 502 || status === 503 || status === 504;
}

async function retryOnTransient(fn, { attempts = 3, baseDelayMs = 300, label = 'correo', retryOn5xx = false } = {}) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const retryable = isTransientNetworkError(error) || (retryOn5xx && isRetryableHttpError(error));
            if (attempt >= attempts || !retryable) throw error;
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            const reason = error.code || error.response?.status || error.message;
            console.warn(`[${label}] transient (${reason}) intento ${attempt}/${attempts}, reintento en ${delay}ms`);
            await sleep(delay);
        }
    }
    throw lastError;
}

module.exports = { isTransientNetworkError, retryOnTransient };
