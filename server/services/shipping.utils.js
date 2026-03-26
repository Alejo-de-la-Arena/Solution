function pickDefined(obj = {}) {
    return Object.fromEntries(
        Object.entries(obj).filter(([, value]) => value !== undefined)
    );
}

function normalizeAddress(input = {}) {
    return {
        name: input.name || input.recipientName || '',
        email: input.email || '',
        phone: input.phone || '',
        street: input.street || input.address1 || '',
        number: input.number || '',
        floor: input.floor || '',
        apartment: input.apartment || '',
        city: input.city || '',
        province: input.province || '',
        postalCode: input.postalCode || '',
    };
}

module.exports = {
    pickDefined,
    normalizeAddress,
};