function countPerfumeUnits(items = []) {
    return items.reduce((acc, item) => {
        const quantity = Number(item.quantity || 0);
        return acc + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
}

function hasFreeShipping(items = []) {
    return countPerfumeUnits(items) >= 2;
}

module.exports = {
    countPerfumeUnits,
    hasFreeShipping,
};
