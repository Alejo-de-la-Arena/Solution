function countPerfumeUnits(items = []) {
    return items.reduce((acc, item) => {
        const quantity = Number(item.quantity || 0);
        return acc + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
}

function hasFreeShipping(items = []) {
    return countPerfumeUnits(items) >= 2;
}

// ── Gestionar (Buenos Aires / GBA) — DESHABILITADO TEMPORALMENTE ──────────
// Por ahora usamos Correo Argentino para el 100% de los envíos del país.
// Descomentar cuando se reactive la integración con Gestionar.
//
// function isLikelyGestionarCoverage(address = {}) {
//     const province = String(address.province || '').trim().toLowerCase();
//     return (
//         province === 'buenos aires' ||
//         province === 'caba' ||
//         province === 'ciudad autonoma de buenos aires' ||
//         province === 'capital federal'
//     );
// }
//
// function shouldUseCorreo(address = {}) {
//     return !isLikelyGestionarCoverage(address);
// }
// ─────────────────────────────────────────────────────────────────────────

/**
 * Por ahora Correo Argentino cubre el 100% del país.
 * Cuando se reactive Gestionar, reemplazar por la función comentada arriba.
 */
function shouldUseCorreo(_address = {}) {
    return true;
}

module.exports = {
    countPerfumeUnits,
    hasFreeShipping,
    shouldUseCorreo,
};