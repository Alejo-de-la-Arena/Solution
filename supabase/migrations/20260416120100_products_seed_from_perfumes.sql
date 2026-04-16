-- Seed de los campos nuevos y de product_images desde client/src/data/perfumes.js,
-- lib/storeProductImages.js y lib/productGalleryImages.js.
-- Idempotente: se puede reaplicar sin duplicar imágenes.

-- ====== BLACK CODE ======
UPDATE public.products SET
  family = 'Aromático / amaderado / afrutado / cítrico / elegante',
  personality = 'Líder / seguro / ambicioso / carismático',
  short_description = 'Fragancia sofisticada y magnética, donde la frescura frutal inicial evoluciona hacia un corazón elegante y un fondo amaderado intenso que transmite poder, liderazgo y seguridad. Ideal para otoño e invierno, aunque funciona muy bien en primavera.',
  profile_general = 'Fragancia sofisticada y magnética, donde la frescura frutal inicial evoluciona hacia un corazón elegante y un fondo amaderado intenso que transmite poder, liderazgo y seguridad. Ideal para otoño e invierno, aunque funciona muy bien en primavera.',
  description_paragraphs = ARRAY[
    'Hay presencias que no se anuncian.',
    'Se imponen.',
    'Black Code nace para el hombre que entra sin hacer ruido y se va dejando marca. La apertura vibrante despierta la atención, el corazón elegante sostiene la mirada y el fondo amaderado profundo construye una identidad firme y segura.',
    'Es liderazgo natural.',
    'Es ambición silenciosa.',
    'Es seguridad que no necesita demostrarse.',
    'Black Code no busca aprobación.',
    'La genera.'
  ],
  notes_top = ARRAY['Bergamota', 'manzana', 'grosellas', 'lima', 'pimienta rosa'],
  notes_heart = ARRAY['Piña', 'pachuli', 'jazmín'],
  notes_base = ARRAY['Musgo de roble', 'abedul', 'cedro', 'almizcles']
WHERE slug = 'black-code';

-- ====== RED DESIRE ======
UPDATE public.products SET
  family = 'Oriental / dulce / especiado / amaderado / cálido',
  personality = 'Seductor / apasionado / romántico / magnético',
  short_description = 'Fragancia nocturna con lavanda protagonista, acompañada por una dulzura cálida y un fondo ahumado envolvente. Ideal para otoño e invierno. Excelente opción para citas, salidas nocturnas.',
  profile_general = 'Fragancia nocturna con lavanda protagonista, acompañada por una dulzura cálida y un fondo ahumado envolvente. Ideal para otoño e invierno. Excelente opción para citas, salidas nocturnas.',
  description_paragraphs = ARRAY[
    'Hay noches que no se explican.',
    'Se sienten.',
    'Red Desire nace para ese momento exacto en el que la energía cambia.',
    'La dulzura inicial envuelve, la lavanda marca carácter y el fondo cálido y ahumado deja una estela que no pasa desapercibida.',
    'Es intensidad controlada.',
    'Es la cercanía que se vuelve fuego.',
    'Es el perfume del hombre que no necesita levantar la voz para dominar la escena.',
    'Red Desire no acompaña la noche. La enciende.'
  ],
  notes_top = ARRAY['Castaña', 'azúcar'],
  notes_heart = ARRAY['Lavanda', 'salvia'],
  notes_base = ARRAY['Vainilla', 'humo']
WHERE slug = 'red-desire';

-- ====== DEEP BLUE ======
UPDATE public.products SET
  family = 'Amaderado / fresco / elegante / intenso',
  personality = 'Sofisticado / seguro / discreto / profesional',
  short_description = 'Fragancia versátil y moderna, que combina frescura vibrante con un fondo cálido y especiado, logrando un equilibrio entre elegancia clásica y actitud contemporánea. Apta para todo el año. Funciona tanto de día como de noche.',
  profile_general = 'Fragancia versátil y moderna, que combina frescura vibrante con un fondo cálido y especiado, logrando un equilibrio entre elegancia clásica y actitud contemporánea. Apta para todo el año. Funciona tanto de día como de noche.',
  description_paragraphs = ARRAY[
    'Hay espacios donde cada detalle importa.',
    'Y cada gesto construye presencia.',
    'Deep Blue se abre con una frescura limpia y precisa.',
    'Las notas aromáticas aportan claridad, mientras el fondo amaderado sostiene una estela elegante, equilibrada y segura.',
    'Es enfoque que se percibe.',
    'Es serenidad con carácter.',
    'Es el perfume de quien avanza con decisión, sin necesidad de exagerar.',
    'Deep Blue no busca impresionar.',
    'Inspira confianza.'
  ],
  notes_top = ARRAY['Limón', 'pomelo', 'menta', 'pimienta rosa'],
  notes_heart = ARRAY['Nuez moscada', 'jengibre', 'jazmín', 'notas amaderadas'],
  notes_base = ARRAY['Cedro', 'sándalo', 'pachulí', 'vetiver', 'incienso', 'almizcles']
WHERE slug = 'deep-blue';

-- ====== YELLOW BLOOM ======
UPDATE public.products SET
  family = 'Frutal / dulce / ambarado / oriental',
  personality = 'Extrovertido / llamativo / alegre / magnético / audaz',
  short_description = 'Fragancia intensa y adictiva, donde la explosión frutal se mezcla con una base dulce y envolvente que deja una estela alegre, sensual y altamente duradera. Ideal para primavera y verano, aunque destaca en noches templadas.',
  profile_general = 'Fragancia intensa y adictiva, donde la explosión frutal se mezcla con una base dulce y envolvente que deja una estela alegre, sensual y altamente duradera. Ideal para primavera y verano, aunque destaca en noches templadas.',
  description_paragraphs = ARRAY[
    'Hay días que se sienten más intensos.',
    'Más vivos.',
    'Yellow Bloom nace en ese instante donde la energía se expande.',
    'La explosión frutal despierta los sentidos, la dulzura envuelve con naturalidad y el fondo cálido deja una estela luminosa que permanece.',
    'Es alegría que se vuelve presencia.',
    'Es frescura que se transforma en atracción.',
    'Es el perfume de quien no teme brillar.',
    'Yellow Bloom no sigue la luz.',
    'La crea.'
  ],
  notes_top = ARRAY['Naranja siciliana', 'bergamota', 'limón siciliano'],
  notes_heart = ARRAY['Cocktail de frutas'],
  notes_base = ARRAY['Vainilla', 'ámbar', 'almizcles']
WHERE slug = 'yellow-bloom';

-- ====== WHITE ICE ======
UPDATE public.products SET
  family = 'Fresco / acuático / cítrico / limpio',
  personality = 'Relax / natural / equilibrado / fresco / despreocupado',
  short_description = 'Fragancia fresca y luminosa, con carácter marino y limpio, que transmite naturalidad, libertad y elegancia relajada. Ideal para primavera y verano. Perfecta para el día. Excelente opción para oficina, actividades al aire libre o uso diario.',
  profile_general = 'Fragancia fresca y luminosa, con carácter marino y limpio, que transmite naturalidad, libertad y elegancia relajada. Ideal para primavera y verano. Perfecta para el día. Excelente opción para oficina, actividades al aire libre o uso diario.',
  description_paragraphs = ARRAY[
    'Hay momentos que no necesitan intensidad.',
    'Necesitan claridad.',
    'White Ice aparece cuando todo se vuelve liviano.',
    'La frescura inicial despierta los sentidos, las notas marinas limpian el aire y el fondo suave y elegante deja una estela pura que transmite calma y seguridad.',
    'Es frescura que ordena.',
    'Es limpieza que atrae.',
    'Es el perfume de quien se siente cómodo siendo auténtico.',
    'White Ice no invade.',
    'Refresca.'
  ],
  notes_top = ARRAY['Bergamota', 'lima', 'limón', 'mandarina', 'naranja', 'jazmín'],
  notes_heart = ARRAY['Notas marinas', 'jazmín', 'romero', 'fresia', 'durazno', 'violeta', 'cilantro'],
  notes_base = ARRAY['Ámbar', 'cedro', 'musgo de roble', 'pachulí', 'almizcles blancos']
WHERE slug = 'white-ice';

-- ====== product_images: limpiamos y reinsertamos para quedar idempotentes ======
DELETE FROM public.product_images
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE slug IN ('black-code', 'red-desire', 'deep-blue', 'yellow-bloom', 'white-ice')
);

-- store_default + store_hover (usadas en /tienda)
INSERT INTO public.product_images (product_id, storage_path, role, sort_order)
SELECT p.id, v.storage_path, v.role, 0
FROM public.products p
JOIN (VALUES
  ('black-code',   'black-code/bc-notas-2.webp',           'store_default'),
  ('black-code',   'black-code/medium/black-code-bg.webp', 'store_hover'),
  ('red-desire',   'red-desire/medium/rd-notas.webp',      'store_default'),
  ('red-desire',   'red-desire/medium/red-desire-bg.webp', 'store_hover'),
  ('deep-blue',    'deep-blue/medium/dp-notas.webp',       'store_default'),
  ('deep-blue',    'deep-blue/medium/deep-blue-bg-2.webp', 'store_hover'),
  ('yellow-bloom', 'yellow-bloom/medium/yb-notas.webp',       'store_default'),
  ('yellow-bloom', 'yellow-bloom/medium/yellow-bloom-bg.webp','store_hover'),
  ('white-ice',    'white-ice/medium/wi-notas.webp',       'store_default'),
  ('white-ice',    'white-ice/medium/white-ice-bg.webp',   'store_hover')
) AS v(slug, storage_path, role) ON v.slug = p.slug;

-- gallery (usada en /producto/:slug)
INSERT INTO public.product_images (product_id, storage_path, role, sort_order)
SELECT p.id, v.storage_path, 'gallery', v.sort_order
FROM public.products p
JOIN (VALUES
  -- black-code
  ('black-code',   'black-code/black-code-individual.jpg', 0),
  ('black-code',   'black-code/black-code-combo.jpg',      1),
  ('black-code',   'black-code/large/bc-arriba.webp',      2),
  ('black-code',   'modelo/black-code-modelo.webp',        3),
  -- red-desire
  ('red-desire',   'red-desire/red-desire-individual.jpg',    0),
  ('red-desire',   'red-desire/red-desire-combo.jpg',         1),
  ('red-desire',   'red-desire/large/rd-arriba.webp',         2),
  ('red-desire',   'modelo/red-desire-modelo.webp',           3),
  ('red-desire',   'modelo/red-desire-atomizacion-2.webp',    4),
  -- deep-blue
  ('deep-blue',    'deep-blue/deep-blue-individual.jpg', 0),
  ('deep-blue',    'deep-blue/deep-blue-combo.jpg',      1),
  ('deep-blue',    'deep-blue/large/db-arriba.webp',     2),
  ('deep-blue',    'modelo/deep-blue-modelo.webp',       3),
  -- yellow-bloom
  ('yellow-bloom', 'yellow-bloom/yellow-bloom-individual.jpg', 0),
  ('yellow-bloom', 'yellow-bloom/yellow-bloom-combo.jpg',      1),
  ('yellow-bloom', 'yellow-bloom/yellow-bloom-bw.webp',        2),
  ('yellow-bloom', 'modelo/modelo-yellow-bloom.webp',          3),
  -- white-ice
  ('white-ice',    'white-ice/white-ice-individual.jpg', 0),
  ('white-ice',    'white-ice/white-ice-combo.jpg',      1),
  ('white-ice',    'white-ice/large/wi-arriba.webp',     2),
  ('white-ice',    'modelo/white-ice-modelo.webp',       3)
) AS v(slug, storage_path, sort_order) ON v.slug = p.slug;
