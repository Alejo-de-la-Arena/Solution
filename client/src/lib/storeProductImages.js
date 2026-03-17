export function getStoreProductImages(slug) {
    const key = (slug || '').trim().toLowerCase();

    const imageMap = {
        'black-code': {
            default: 'black-code/bc-notas-2.webp',
            hover: 'black-code/medium/black-code-bg.webp',
        },
        'red-desire': {
            default: 'red-desire/medium/rd-notas.webp',
            hover: 'red-desire/medium/red-desire-bg.webp',
        },
        'white-ice': {
            default: 'white-ice/medium/wi-notas.webp',
            hover: 'white-ice/medium/white-ice-bg.webp',
        },
        'deep-blue': {
            default: 'deep-blue/medium/dp-notas.webp',
            hover: 'deep-blue/medium/deep-blue-bg-2.webp',
        },
        'yellow-bloom': {
            default: 'yellow-bloom/medium/yb-notas.webp',
            hover: 'yellow-bloom/medium/yellow-bloom-bg.webp',
        },
    };

    return imageMap[key] || null;
}