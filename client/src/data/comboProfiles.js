const normalizeComboKey = (firstId, secondId) =>
  [firstId, secondId]
    .filter(Boolean)
    .sort()
    .join('__');

export const comboProfiles = {
  [normalizeComboKey('black-code', 'red-desire')]: {
    nickname: 'Poder & Deseo',
    summary: 'Combinación intensa y seductora.',
    description: [
      'Red Desire aporta un perfil nocturno, dulce y envolvente con una salida marcada de castaña y azúcar, mientras Black Code suma un carácter magnético y masculino con presencia de musgo de roble y notas amaderadas que refuerzan su elegancia y potencia.',
    ],
  },
  [normalizeComboKey('black-code', 'white-ice')]: {
    nickname: 'Equilibrio & Presencia',
    summary: 'Combinación versátil y sofisticada.',
    description: [
      'White Ice aporta una frescura limpia y luminosa, con notas marinas, jazmín y romero que transmiten ligereza y versatilidad para todo el día. Black Code introduce profundidad y carácter con su perfil masculino, intenso y amaderado, creando un equilibrio entre frescura moderna y presencia elegante.',
    ],
  },
  [normalizeComboKey('black-code', 'deep-blue')]: {
    nickname: 'Elegancia & Carácter',
    summary: 'Combinación elegante y versátil.',
    description: [
      'Deep Blue aporta una frescura serena y sofisticada, con acordes cítricos que se equilibran con notas de sándalo y cedro, transmitiendo elegancia y seguridad en contextos formales o profesionales. Black Code suma profundidad y presencia con su perfil masculino, intenso y amaderado, creando una combinación que proyecta carácter y distinción.',
    ],
  },
  [normalizeComboKey('black-code', 'yellow-bloom')]: {
    nickname: 'Energía & Carácter',
    summary: 'Combinación vibrante y sofisticada.',
    description: [
      'Yellow Bloom aporta una explosión cítrica y frutal llena de energía, donde la naranja y el limón se combinan con un fondo dulce que transmite alegría y frescura intensa. Black Code introduce profundidad y presencia con su perfil masculino, potente y amaderado, creando una combinación que equilibra vitalidad luminosa con carácter y elegancia.',
    ],
  },
  [normalizeComboKey('red-desire', 'white-ice')]: {
    nickname: 'Frescura & Seducción',
    summary: 'Combinación fresca y envolvente.',
    description: [
      'White Ice abre la combinación con una frescura limpia y luminosa que transmite sensación de aire puro y versatilidad para todo el día. Red Desire aporta profundidad y dulzura con su carácter seductor y nocturno, creando un contraste atractivo entre ligereza fresca e intensidad envolvente.',
      'El día y la noche en su máxima expresión.',
    ],
  },
  [normalizeComboKey('deep-blue', 'red-desire')]: {
    nickname: 'Elegancia & Seducción',
    summary: 'Combinación intensa y sofisticada.',
    description: [
      'Deep Blue aporta una frescura elegante y serena que se impone con naturalidad, donde la pimienta rosa, el jengibre y las notas amaderadas crean un perfil sofisticado y equilibrado. Red Desire suma profundidad y calidez con su carácter dulce y seductor, dando lugar a una combinación que une elegancia moderna con una intensidad nocturna envolvente.',
    ],
  },
  [normalizeComboKey('red-desire', 'yellow-bloom')]: {
    nickname: 'Seducción & Energía',
    summary: 'Combinación dulce y vibrante.',
    description: [
      'Yellow Bloom aporta una explosión frutal luminosa, con cítricos y frutas que transmiten alegría y energía para el día. Red Desire suma una dulzura más profunda y seductora, con un carácter nocturno envolvente. Es una combinación ideal para quienes disfrutan fragancias dulces, ya que ambas comparten ese perfil, aunque expresado de dos maneras distintas: una frutal y luminosa, y otra más cálida e intensa.',
    ],
  },
  [normalizeComboKey('deep-blue', 'white-ice')]: {
    nickname: 'Frescura & Serenidad',
    summary: 'Combinación fresca y versátil.',
    description: [
      'White Ice aporta una frescura limpia y ligera que transmite sensación de aire puro y claridad, ideal para un uso cotidiano y relajado. Deep Blue lleva esa frescura hacia un perfil más elegante y profundo, donde los acordes cítricos se combinan con notas de sándalo y cedro que aportan mayor presencia. Es una combinación ideal para quienes buscan fragancias frescas y versátiles para todo el día, expresadas en dos estilos: uno más liviano y limpio, y otro más intenso y sofisticado.',
    ],
  },
  [normalizeComboKey('white-ice', 'yellow-bloom')]: {
    nickname: 'Frescura & Energía',
    summary: 'Combinación fresca y vibrante.',
    description: [
      'White Ice aporta una frescura limpia y ligera que transmite sensación de claridad y versatilidad para todo el día. Yellow Bloom suma una explosión cítrica y frutal llena de energía, donde la naranja y el limón crean un perfil dulce y luminoso que despierta los sentidos. Juntas forman una combinación equilibrada entre frescura limpia y vitalidad frutal, ideal para quienes buscan fragancias frescas con un toque de energía y alegría.',
    ],
  },
  [normalizeComboKey('deep-blue', 'yellow-bloom')]: {
    nickname: 'Energía & Elegancia',
    summary: 'Combinación vibrante y sofisticada.',
    description: [
      'Yellow Bloom aporta una explosión frutal y cítrica llena de energía, donde la dulzura y la intensidad de sus notas despiertan los sentidos con una sensación luminosa y alegre. Deep Blue introduce un contrapunto sereno y elegante, con su frescura sofisticada y sus notas amaderadas que transmiten equilibrio y distinción. Juntas crean una combinación donde la vitalidad se encuentra con la elegancia.',
    ],
  },
};

export function getComboProfile(firstId, secondId) {
  if (!firstId || !secondId || firstId === secondId) return null;
  return comboProfiles[normalizeComboKey(firstId, secondId)] || null;
}

export { normalizeComboKey };
