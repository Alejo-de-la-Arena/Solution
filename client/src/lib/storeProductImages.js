export function getStoreProductImages(slug) {
    const key = (slug || '').trim().toLowerCase();

    const imageMap = {
        'black-code': {
            default: 'black-code/medium/black-code.webp',
            hover: 'black-code/large/combo-black-code.webp',
        },
        'red-desire': {
            default: 'red-desire/thumb/red-desire.webp',
            hover: 'red-desire/thumb/combo-red-desire.webp',
        },
        'white-ice': {
            default: 'white-ice/thumb/white-ice.webp',
            hover: 'white-ice/thumb/combo-white-ice.webp',
        },
        'deep-blue': {
            default: 'deep-blue/thumb/deep-blue.webp',
            hover: 'deep-blue/thumb/combo-deep-blue.webp',
        },
        'yellow-bloom': {
            default: 'yellow-bloom/thumb/yellow-bloom.webp',
            hover: 'yellow-bloom/thumb/combo-yellow-bloom.webp',
        },
    };

    return imageMap[key] || null;
}