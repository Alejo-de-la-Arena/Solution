function countPerfumeUnits(items = []) {
    return items.reduce((acc, item) => {
        const quantity = Number(item.quantity || 0);
        return acc + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
}

function hasFreeShipping(items = []) {
    return countPerfumeUnits(items) >= 2;
}

function isLikelyGestionarCoverage(address = {}) {
    const province = String(address.province || '').trim().toLowerCase();
    return (
        province === 'buenos aires' ||
        province === 'caba' ||
        province === 'ciudad autonoma de buenos aires' ||
        province === 'ciudad autónoma de buenos aires' ||
        province === 'capital federal'
    );
}

/**
 * Gestionar sólo se activa si la tarifa está configurada (`GESTIONAR_FLAT_RATE_HOME`).
 * Mientras esa env no esté seteada, todas las direcciones siguen cayendo en Correo
 * — el cambio es opt-in para no romper el checkout en producción.
 */
function isGestionarEnabled() {
    const rate = process.env.GESTIONAR_FLAT_RATE_HOME;
    return rate !== undefined && rate !== '' && Number.isFinite(Number(rate));
}

function shouldUseCorreo(address = {}) {
    if (!isGestionarEnabled()) return true;
    return !isLikelyGestionarCoverage(address);
}

module.exports = {
    countPerfumeUnits,
    hasFreeShipping,
    isLikelyGestionarCoverage,
    isGestionarEnabled,
    shouldUseCorreo,
};