/**
 * Tabla de zonas AMBA para cotización de envío con Gestionar.
 *
 * El sistema se basa en lookup por código postal exacto (4 dígitos):
 *   1. CABA (CP 1000–1499) se maneja por rango (más eficiente que listar 500 CPs).
 *   2. Provincia de Buenos Aires (AMBA): mapa exhaustivo POSTAL_CODE_MAP.
 *   3. Cualquier CP fuera de esa cobertura → fallback a Correo Argentino en el orquestador
 *      (server/services/shipping.service.js).
 *
 * Las tarifas son finales (incluyen IVA) y se definen en `ZONES`.
 *
 * Cuando un CP nuevo del AMBA aparezca y no esté en este mapa, agregalo bajo el partido
 * correspondiente. Los CPs ambiguos (que el sistema postal asigna a más de un partido)
 * los resolvemos eligiendo el partido dominante o el que aparece en el padrón de Correo.
 */

const ZONES = {
    1: { name: 'CABA', price: 5000 },
    2: { name: 'Primer cordón', price: 7000 },
    3: { name: 'Segundo/Tercer cordón', price: 8900 },
    4: { name: 'Cuarto cordón', price: 10300 },
};

// CABA es un rango contiguo (CP 1000–1499). Más eficiente que listar 500 entradas.
function isCABA(cp) {
    const n = parseInt(cp, 10);
    return Number.isFinite(n) && n >= 1000 && n <= 1499;
}

// Provincia de Buenos Aires — partidos del AMBA con sus códigos postales.
// El orden no importa para el lookup, pero está agrupado por zona y por partido para
// facilitar el mantenimiento (agregar/quitar CPs).
const POSTAL_CODE_MAP = {
    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║ ZONA 2 — Primer cordón ($7.000)                                       ║
    // ╚══════════════════════════════════════════════════════════════════════╝

    // ── Vicente López ──
    '1602': { partido: 'Vicente López', zona: 2 }, // Florida
    '1603': { partido: 'Vicente López', zona: 2 }, // Villa Martelli
    '1604': { partido: 'Vicente López', zona: 2 }, // Florida Oeste
    '1605': { partido: 'Vicente López', zona: 2 }, // Munro
    '1606': { partido: 'Vicente López', zona: 2 }, // Carapachay
    '1607': { partido: 'Vicente López', zona: 2 }, // Villa Adelina
    '1612': { partido: 'Vicente López', zona: 2 }, // Olivos
    '1614': { partido: 'Vicente López', zona: 2 }, // Olivos centro
    '1635': { partido: 'Vicente López', zona: 2 }, // Vicente López
    '1636': { partido: 'Vicente López', zona: 2 }, // Olivos
    '1637': { partido: 'Vicente López', zona: 2 }, // La Lucila
    '1638': { partido: 'Vicente López', zona: 2 }, // La Lucila

    // ── San Isidro ──
    '1640': { partido: 'San Isidro', zona: 2 }, // Martínez
    '1641': { partido: 'San Isidro', zona: 2 }, // Acassuso
    '1642': { partido: 'San Isidro', zona: 2 }, // San Isidro
    '1643': { partido: 'San Isidro', zona: 2 }, // Béccar
    '1644': { partido: 'San Isidro', zona: 2 }, // Victoria
    '1647': { partido: 'San Isidro', zona: 2 }, // Béccar
    '1609': { partido: 'San Isidro', zona: 2 }, // Boulogne
    '1625': { partido: 'San Isidro', zona: 2 }, // Beccar (overlap zona, lo dejamos en SI)

    // ── San Fernando ──
    '1646': { partido: 'San Fernando', zona: 2 }, // San Fernando
    '1649': { partido: 'San Fernando', zona: 2 }, // Virreyes

    // ── San Martín ──
    '1650': { partido: 'San Martín', zona: 2 }, // San Martín
    '1651': { partido: 'San Martín', zona: 2 }, // San Andrés
    '1652': { partido: 'San Martín', zona: 2 }, // Loma Hermosa
    '1653': { partido: 'San Martín', zona: 2 }, // Villa Ballester
    '1654': { partido: 'San Martín', zona: 2 }, // Villa Lynch
    '1655': { partido: 'San Martín', zona: 2 }, // José León Suárez
    '1656': { partido: 'San Martín', zona: 2 }, // Billinghurst
    '1657': { partido: 'San Martín', zona: 2 }, // Villa Maipú
    '1659': { partido: 'San Martín', zona: 2 }, // Loma Hermosa norte

    // ── Tres de Febrero ──
    '1672': { partido: 'Tres de Febrero', zona: 2 }, // Villa Lynch
    '1674': { partido: 'Tres de Febrero', zona: 2 }, // Sáenz Peña
    '1676': { partido: 'Tres de Febrero', zona: 2 }, // Santos Lugares
    '1678': { partido: 'Tres de Febrero', zona: 2 }, // Caseros
    '1680': { partido: 'Tres de Febrero', zona: 2 }, // Ciudadela
    '1682': { partido: 'Tres de Febrero', zona: 2 }, // Martín Coronado
    '1684': { partido: 'Tres de Febrero', zona: 2 }, // El Palomar

    // ── Morón ──
    '1706': { partido: 'Morón', zona: 2 }, // Haedo
    '1708': { partido: 'Morón', zona: 2 }, // Morón
    '1712': { partido: 'Morón', zona: 2 }, // Castelar
    '1718': { partido: 'Morón', zona: 2 }, // San Antonio de Padua

    // ── Hurlingham ──
    '1686': { partido: 'Hurlingham', zona: 2 }, // Hurlingham
    '1687': { partido: 'Hurlingham', zona: 2 }, // William C. Morris
    '1688': { partido: 'Hurlingham', zona: 2 }, // Villa Tesei

    // ── Ituzaingó ──
    '1714': { partido: 'Ituzaingó', zona: 2 }, // Ituzaingó
    '1715': { partido: 'Ituzaingó', zona: 2 }, // Ituzaingó

    // ── Avellaneda ──
    '1870': { partido: 'Avellaneda', zona: 2 }, // Avellaneda
    '1871': { partido: 'Avellaneda', zona: 2 }, // Dock Sud
    '1872': { partido: 'Avellaneda', zona: 2 }, // Sarandí
    '1874': { partido: 'Avellaneda', zona: 2 }, // Villa Domínico
    '1875': { partido: 'Avellaneda', zona: 2 }, // Wilde
    '1876': { partido: 'Avellaneda', zona: 2 }, // Crucecita / Villa Diamante

    // ── Lanús ──
    '1822': { partido: 'Lanús', zona: 2 }, // Valentín Alsina
    '1824': { partido: 'Lanús', zona: 2 }, // Lanús
    '1825': { partido: 'Lanús', zona: 2 }, // Lanús Este
    '1826': { partido: 'Lanús', zona: 2 }, // Remedios de Escalada
    '1827': { partido: 'Lanús', zona: 2 }, // Monte Chingolo

    // ── Lomas de Zamora ──
    '1828': { partido: 'Lomas de Zamora', zona: 2 }, // Banfield
    '1832': { partido: 'Lomas de Zamora', zona: 2 }, // Lomas de Zamora
    '1834': { partido: 'Lomas de Zamora', zona: 2 }, // Temperley
    '1836': { partido: 'Lomas de Zamora', zona: 2 }, // Llavallol
    '1838': { partido: 'Lomas de Zamora', zona: 2 }, // Turdera

    // ── Quilmes ──
    '1878': { partido: 'Quilmes', zona: 2 }, // Quilmes
    '1879': { partido: 'Quilmes', zona: 2 }, // Bernal
    '1880': { partido: 'Quilmes', zona: 2 }, // Bernal Oeste
    '1881': { partido: 'Quilmes', zona: 2 }, // Don Bosco
    '1882': { partido: 'Quilmes', zona: 2 }, // San Francisco Solano
    '1886': { partido: 'Quilmes', zona: 2 }, // Ezpeleta

    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║ ZONA 3 — Segundo/Tercer cordón ($8.900)                              ║
    // ╚══════════════════════════════════════════════════════════════════════╝

    // ── Tigre ──
    '1611': { partido: 'Tigre', zona: 3 }, // Don Torcuato
    '1617': { partido: 'Tigre', zona: 3 }, // General Pacheco
    '1618': { partido: 'Tigre', zona: 3 }, // El Talar
    '1620': { partido: 'Tigre', zona: 3 }, // Rincón de Milberg
    '1621': { partido: 'Tigre', zona: 3 }, // Benavídez
    '1622': { partido: 'Tigre', zona: 3 }, // Talar de Pacheco
    '1623': { partido: 'Tigre', zona: 3 }, // Ricardo Rojas
    '1627': { partido: 'Tigre', zona: 3 }, // Tigre centro
    '1628': { partido: 'Tigre', zona: 3 }, // Tigre
    '1648': { partido: 'Tigre', zona: 3 }, // Tigre / Dique Luján
    '1670': { partido: 'Tigre', zona: 3 }, // Tigre

    // ── San Miguel ──
    '1661': { partido: 'San Miguel', zona: 3 }, // Bella Vista
    '1663': { partido: 'San Miguel', zona: 3 }, // San Miguel
    '1664': { partido: 'San Miguel', zona: 3 }, // Muñiz

    // ── Malvinas Argentinas ──
    '1610': { partido: 'Malvinas Argentinas', zona: 3 }, // Pablo Nogués / Tortuguitas
    '1613': { partido: 'Malvinas Argentinas', zona: 3 }, // Los Polvorines
    '1615': { partido: 'Malvinas Argentinas', zona: 3 }, // Grand Bourg

    // ── José C. Paz ──
    '1665': { partido: 'José C. Paz', zona: 3 }, // José C. Paz
    '1667': { partido: 'José C. Paz', zona: 3 }, // Tortuguitas (parte)

    // ── Moreno ──
    '1740': { partido: 'Moreno', zona: 3 }, // Moreno
    '1741': { partido: 'Moreno', zona: 3 }, // Cuartel V
    '1742': { partido: 'Moreno', zona: 3 }, // Paso del Rey
    '1743': { partido: 'Moreno', zona: 3 }, // Francisco Álvarez
    '1744': { partido: 'Moreno', zona: 3 }, // Trujui
    '1745': { partido: 'Moreno', zona: 3 }, // La Reja

    // ── Merlo ──
    '1722': { partido: 'Merlo', zona: 3 }, // Merlo
    '1723': { partido: 'Merlo', zona: 3 }, // Pontevedra
    '1724': { partido: 'Merlo', zona: 3 }, // Mariano Acosta
    '1726': { partido: 'Merlo', zona: 3 }, // Libertad

    // ── La Matanza ──
    '1704': { partido: 'La Matanza', zona: 3 }, // Ramos Mejía
    '1754': { partido: 'La Matanza', zona: 3 }, // San Justo
    '1755': { partido: 'La Matanza', zona: 3 }, // Isidro Casanova
    '1756': { partido: 'La Matanza', zona: 3 }, // Gregorio de Laferrere
    '1757': { partido: 'La Matanza', zona: 3 }, // Lomas del Mirador
    '1759': { partido: 'La Matanza', zona: 3 }, // González Catán
    '1762': { partido: 'La Matanza', zona: 3 }, // Tapiales
    '1763': { partido: 'La Matanza', zona: 3 }, // Villa Madero
    '1765': { partido: 'La Matanza', zona: 3 }, // Aldo Bonzi
    '1766': { partido: 'La Matanza', zona: 3 }, // La Tablada
    '1768': { partido: 'La Matanza', zona: 3 }, // Virrey del Pino

    // ── Ezeiza ──
    '1802': { partido: 'Ezeiza', zona: 3 }, // Aeropuerto
    '1804': { partido: 'Ezeiza', zona: 3 }, // Ezeiza
    '1806': { partido: 'Ezeiza', zona: 3 }, // Tristán Suárez

    // ── Esteban Echeverría ──
    '1841': { partido: 'Esteban Echeverría', zona: 3 }, // 9 de Abril
    '1842': { partido: 'Esteban Echeverría', zona: 3 }, // Monte Grande

    // ── Almirante Brown ──
    '1844': { partido: 'Almirante Brown', zona: 3 }, // Burzaco
    '1846': { partido: 'Almirante Brown', zona: 3 }, // Adrogué
    '1847': { partido: 'Almirante Brown', zona: 3 }, // Adrogué
    '1850': { partido: 'Almirante Brown', zona: 3 }, // Glew
    '1852': { partido: 'Almirante Brown', zona: 3 }, // Burzaco
    '1856': { partido: 'Almirante Brown', zona: 3 }, // Don Orione
    '1858': { partido: 'Almirante Brown', zona: 3 }, // Longchamps

    // ── Florencio Varela ──
    '1888': { partido: 'Florencio Varela', zona: 3 }, // Florencio Varela

    // ── Berazategui ──
    '1884': { partido: 'Berazategui', zona: 3 }, // Berazategui
    '1885': { partido: 'Berazategui', zona: 3 }, // Hudson / Pereyra

    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║ ZONA 4 — Cuarto cordón ($10.300)                                     ║
    // ╚══════════════════════════════════════════════════════════════════════╝

    // ── Zárate ──
    '2800': { partido: 'Zárate', zona: 4 },

    // ── Campana ──
    '2804': { partido: 'Campana', zona: 4 },

    // ── Escobar ──
    '1624': { partido: 'Escobar', zona: 4 }, // Ingeniero Maschwitz
    '1626': { partido: 'Escobar', zona: 4 }, // Belén de Escobar (norte)
    '1632': { partido: 'Escobar', zona: 4 }, // Manuel Alberti / Garín

    // ── Pilar ──
    '1629': { partido: 'Pilar', zona: 4 }, // Pilar
    '1630': { partido: 'Pilar', zona: 4 }, // Pilar centro
    '1631': { partido: 'Pilar', zona: 4 }, // Villa Rosa
    '1633': { partido: 'Pilar', zona: 4 }, // Del Viso

    // ── Luján ──
    '6700': { partido: 'Luján', zona: 4 }, // Luján
    '6702': { partido: 'Luján', zona: 4 }, // Cortines

    // ── General Rodríguez ──
    '1748': { partido: 'General Rodríguez', zona: 4 },
    '1749': { partido: 'General Rodríguez', zona: 4 },

    // ── Marcos Paz ──
    '1727': { partido: 'Marcos Paz', zona: 4 },

    // ── Cañuelas ──
    '1814': { partido: 'Cañuelas', zona: 4 },

    // ── San Vicente ──
    '1865': { partido: 'San Vicente', zona: 4 },

    // ── Presidente Perón ──
    '1862': { partido: 'Presidente Perón', zona: 4 }, // Guernica

    // ── Coronel Brandsen ──
    '1980': { partido: 'Coronel Brandsen', zona: 4 },

    // ── La Plata ──
    '1896': { partido: 'La Plata', zona: 4 }, // City Bell
    '1897': { partido: 'La Plata', zona: 4 }, // Gonnet
    '1900': { partido: 'La Plata', zona: 4 }, // La Plata
    '1901': { partido: 'La Plata', zona: 4 }, // La Plata
    '1902': { partido: 'La Plata', zona: 4 }, // La Plata
    '1903': { partido: 'La Plata', zona: 4 }, // La Plata
    '1904': { partido: 'La Plata', zona: 4 }, // Tolosa
    '1905': { partido: 'La Plata', zona: 4 }, // Ringuelet
    '1906': { partido: 'La Plata', zona: 4 }, // M. Romero / Los Hornos

    // ── Ensenada ──
    '1925': { partido: 'Ensenada', zona: 4 },

    // ── Berisso ──
    '1923': { partido: 'Berisso', zona: 4 },
};

function normalizeCP(input) {
    if (input == null) return '';
    const digits = String(input).replace(/\D/g, '');
    return digits.slice(0, 4); // El CP argentino de base son 4 dígitos
}

function lookupCP(rawCP) {
    const cp = normalizeCP(rawCP);
    if (cp.length !== 4) return null;

    if (isCABA(cp)) {
        return {
            partido: 'CABA',
            zona: 1,
            zoneName: ZONES[1].name,
            price: ZONES[1].price,
        };
    }

    const entry = POSTAL_CODE_MAP[cp];
    if (!entry) return null;

    return {
        partido: entry.partido,
        zona: entry.zona,
        zoneName: ZONES[entry.zona].name,
        price: ZONES[entry.zona].price,
    };
}

function isAmbaCoverage(rawCP) {
    return lookupCP(rawCP) !== null;
}

module.exports = {
    ZONES,
    POSTAL_CODE_MAP,
    isCABA,
    normalizeCP,
    lookupCP,
    isAmbaCoverage,
};
