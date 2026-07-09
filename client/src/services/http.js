/**
 * fetch con timeout vía AbortController. Sin esto, un server colgado deja la
 * request (y cualquier spinner/overlay atado a ella) esperando para siempre.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new Error('La conexión tardó demasiado. Revisá tu internet e intentá de nuevo.');
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}
