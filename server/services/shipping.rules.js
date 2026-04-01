function countPerfumeUnits(items = []) {
    return items.reduce((acc, item) => {
        const quantity = Number(item.quantity || 0);
        return acc + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
}

function hasFreeShipping(items = []) {
    return countPerfumeUnits(items) >= 2;
}

// Stub inicial: por ahora solo distinguimos Provincia de Buenos Aires/CABA.
// Después la refinamos con tu lógica real de Gestionar.
function isLikelyGestionarCoverage(address = {}) {
    const province = String(address.province || '').trim().toLowerCase();
    return province === 'buenos aires' || province === 'caba' || province === 'ciudad autonoma de buenos aires' || province === 'capital federal';
}

function shouldUseCorreo(address = {}) {
    return !isLikelyGestionarCoverage(address);
}

module.exports = {
    countPerfumeUnits,
    hasFreeShipping,
    isLikelyGestionarCoverage,
    shouldUseCorreo,
};