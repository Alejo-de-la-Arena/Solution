import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { getProductBySlug, productToPerfume } from '../services/products';
import { useCart } from '../contexts/CartContext';
import { mediaUrl } from '../lib/mediaUrl';
import { getProductGalleryMedia } from '../lib/productGalleryMedia';
import { trackViewContent } from '../lib/metaPixel';
import { getCrossedPrice } from '../lib/crossedPrices';

// ─── Per-slug static content (copy, badges, reference, testimonials) ──────────
const SLUG_DATA = {
  'red-desire': {
    code: '01',
    subtitle: 'Pasión y seducción',
    accent: '#c0392b',
    accentGlow: 'rgba(192,57,43,0.25)',
    accentSoft: 'rgba(192,57,43,0.09)',
    accentDim: 'rgba(192,57,43,0.45)',
    btl1: '#3a1612', btl2: '#1a0907',
    badges: [
      { icon: 'moon',  label: 'Momento', value: 'Noche' },
      { icon: 'flame', label: 'Ocasión', value: 'Citas' },
      { icon: 'glass', label: 'Salidas', value: 'Nocturnas' },
    ],
    leadPre: 'Hay noches', leadEm: 'que no se explican.', leadPost: 'Se sienten.',
    body: [
      'Red Desire nace para ese momento exacto en el que la energía cambia. La dulzura inicial envuelve, la lavanda marca carácter y el fondo cálido y ahumado deja una estela que no pasa desapercibida.',
      'Es intensidad controlada. Es la cercanía que se vuelve fuego. Es el perfume del hombre que no necesita levantar la voz para dominar la escena.',
    ],
    closingLine: 'Red Desire no acompaña la noche.',
    closingEm: 'La enciende.',
    reference: 'Stronger With You — Armani',
    referenceDesc: 'Va por la misma línea olfativa — calidez especiada con fondo dulce. Ideal para otoño e invierno. Intenso y memorable para cerrar el día.',
    notes: { top: ['Castaña', 'Azúcar'], heart: ['Lavanda', 'Salvia'], base: ['Vainilla', 'Humo'] },
    family: ['Oriental', 'Dulce', 'Especiado', 'Amaderado', 'Cálido'],
    stock: 'Más vendido · Stock limitado',
    testimonials: [
      { stars: 5, text: 'Si te gustan los perfumes dulces recomiendo el Red Desire, tiene un parecido al Stronger With You.', name: 'Juan Pérez', city: 'Buenos Aires', initial: 'J' },
      { stars: 5, text: 'Probé el Red Desire y el Black Code — los dos son un 10. Antes vendían equivalencias y ya eran buenos, ahora con perfume propio subieron el nivel.', name: 'Patricia Montone', city: 'Mar del Plata', initial: 'P' },
    ],
  },
  'black-code': {
    code: '02',
    subtitle: 'Presencia y carácter masculino',
    accent: '#9a8060',
    accentGlow: 'rgba(154,128,96,0.22)',
    accentSoft: 'rgba(154,128,96,0.08)',
    accentDim: 'rgba(154,128,96,0.4)',
    btl1: '#1a1a1c', btl2: '#070708',
    badges: [
      { icon: 'moon',      label: 'Momento', value: 'Noche' },
      { icon: 'handshake', label: 'Ocasión', value: 'Reuniones' },
      { icon: 'sparkle',   label: 'Salidas', value: 'Eventos' },
    ],
    leadPre: 'Hay presencias', leadEm: 'que no se anuncian.', leadPost: 'Se imponen.',
    body: [
      'Black Code nace para el hombre que entra sin hacer ruido y se va dejando marca. La apertura vibrante despierta la atención, el corazón elegante sostiene la mirada y el fondo amaderado profundo construye una identidad firme y segura.',
      'Es liderazgo natural. Es ambición silenciosa. Es seguridad que no necesita demostrarse.',
    ],
    closingLine: 'Black Code no busca aprobación.',
    closingEm: 'La genera.',
    reference: 'Creed Aventus',
    referenceDesc: 'Va por la misma línea olfativa — elegancia frutal con base amaderada. Ideal para otoño e invierno, funciona muy bien en primavera. Presencia que se recuerda.',
    notes: { top: ['Bergamota', 'Manzana', 'Grosellas', 'Lima', 'P. Rosa'], heart: ['Piña', 'Pachuli', 'Jazmín'], base: ['Musgo', 'Abedul', 'Cedro', 'Almizcles'] },
    family: ['Aromático', 'Amaderado', 'Afrutado', 'Cítrico', 'Elegante'],
    stock: 'En stock · Envío inmediato',
    testimonials: [
      { stars: 5, text: 'Compré el Black Code y cumple con la descripción, super elegante para usar en eventos.', name: 'Ezequiel Zotto', city: 'Mendoza', initial: 'E' },
      { stars: 5, text: 'Compré el combo de 2 para regalarle a mi hijo, están bárbaros, recomiendo.', name: 'Patricia Montone', city: 'Mar del Plata', initial: 'P' },
    ],
  },
  'yellow-bloom': {
    code: '03',
    subtitle: 'Una explosión frutal que destaca',
    accent: '#ef9f27',
    accentGlow: 'rgba(239,159,39,0.22)',
    accentSoft: 'rgba(239,159,39,0.08)',
    accentDim: 'rgba(239,159,39,0.4)',
    btl1: '#3a2e10', btl2: '#1a1207',
    badges: [
      { icon: 'suncloud', label: 'Momento', value: 'Día y noche' },
      { icon: 'leaf',     label: 'Ocasión', value: 'Aire libre' },
      { icon: 'confetti', label: 'Eventos', value: 'Sociales' },
    ],
    leadPre: 'Hay días', leadEm: 'que se sienten más intensos.', leadPost: 'Más vivos.',
    body: [
      'Yellow Bloom nace en ese instante donde la energía se expande. La explosión frutal despierta los sentidos, la dulzura envuelve con naturalidad y el fondo cálido deja una estela luminosa que permanece.',
      'Es alegría que se vuelve presencia. Es frescura que se transforma en atracción. Es el perfume de quien no teme brillar.',
    ],
    closingLine: 'Yellow Bloom no sigue la luz.',
    closingEm: 'La crea.',
    reference: 'Erba Pura — Sospiro',
    referenceDesc: 'Va por la misma línea olfativa — frescura luminosa y frutal. Ideal para primavera y verano, destaca en noches templadas. El compañero ideal para el día a día.',
    notes: { top: ['Naranja', 'Bergamota', 'Limón'], heart: ['Cocktail frutal', 'Musco'], base: ['Vainilla', 'Ámbar', 'Almizcles'] },
    family: ['Frutal', 'Dulce', 'Ambarado', 'Oriental'],
    stock: 'En stock · Envío inmediato',
    testimonials: [
      { stars: 5, text: 'Yellow Bloom es un acierto. Tiene un parecido muy fiel al Erba Pura, y a una fracción del precio. Lo uso todos los días.', name: 'Sebastián Carmona', city: 'Rosario', initial: 'SC' },
      { stars: 5, text: 'Si te gustan los perfumes dulces y frutales, el Yellow Bloom es ideal. Una estela que dura todo el día.', name: 'Nicolás Méndez', city: 'Buenos Aires', initial: 'N' },
    ],
  },
  'deep-blue': {
    code: '04',
    subtitle: 'Elegancia clásica',
    accent: '#378add',
    accentGlow: 'rgba(55,138,221,0.22)',
    accentSoft: 'rgba(55,138,221,0.08)',
    accentDim: 'rgba(55,138,221,0.4)',
    btl1: '#0f2236', btl2: '#060c14',
    badges: [
      { icon: 'sun',       label: 'Momento', value: 'Día' },
      { icon: 'briefcase', label: 'Ocasión', value: 'Trabajo' },
      { icon: 'handshake', label: 'Negocios', value: 'Reuniones' },
    ],
    leadPre: 'Hay espacios donde', leadEm: 'cada detalle importa.', leadPost: 'Y cada gesto construye presencia.',
    body: [
      'Deep Blue se abre con una frescura limpia y precisa. Las notas aromáticas aportan claridad, mientras el fondo amaderado sostiene una estela elegante, equilibrada y segura.',
      'Es enfoque que se percibe. Es serenidad con carácter. Es el perfume de quien avanza con decisión, sin necesidad de exagerar.',
    ],
    closingLine: 'Deep Blue no busca impresionar.',
    closingEm: 'Inspira confianza.',
    reference: 'Bleu de Chanel',
    referenceDesc: 'Va por la misma línea olfativa — fresco, limpio y sofisticado. Apto para todo el año. Transmite profesionalismo y elegancia.',
    notes: { top: ['Limón', 'Pomelo', 'Menta', 'P. Rosa'], heart: ['N. Moscada', 'Jengibre', 'Jazmín'], base: ['Cedro', 'Sándalo', 'Vetiver', 'Incienso', 'Almizcles'] },
    family: ['Amaderado', 'Fresco', 'Elegante', 'Intenso'],
    stock: 'En stock · Envío en 24/48hs',
    testimonials: [
      { stars: 5, text: 'Elegí el Deep Blue y cumplió 100%. Lo que me terminó de convencer fue el frasco — original y práctico para llevarlo a donde sea.', name: 'Ezequiel Zotto', city: 'Mendoza', initial: 'E' },
      { stars: 5, text: 'Buena atención, buen producto. Lo uso todos los días para trabajar.', name: 'Nicolás Méndez', city: 'Buenos Aires', initial: 'N' },
    ],
  },
  'white-ice': {
    code: '05',
    subtitle: 'Pureza y frescura para tu rutina',
    accent: '#0dd3b8',
    accentGlow: 'rgba(13,211,184,0.20)',
    accentSoft: 'rgba(13,211,184,0.07)',
    accentDim: 'rgba(13,211,184,0.4)',
    btl1: '#1a2624', btl2: '#080d0c',
    badges: [
      { icon: 'sunrise', label: 'Momento', value: 'Uso diario' },
      { icon: 'compass', label: 'Ocasión', value: 'Rutina' },
      { icon: 'dumbbell', label: 'Deporte', value: 'Movimiento' },
    ],
    leadPre: 'Hay momentos', leadEm: 'que no necesitan intensidad.', leadPost: 'Necesitan claridad.',
    body: [
      'White Ice aparece cuando todo se vuelve liviano. La frescura inicial despierta los sentidos, las notas marinas limpian el aire y el fondo suave y elegante deja una estela pura que transmite calma y seguridad.',
      'Es frescura que ordena. Es limpieza que atrae. Es el perfume de quien se siente cómodo siendo auténtico.',
    ],
    closingLine: 'White Ice no invade.',
    closingEm: 'Refresca.',
    reference: 'Acqua di Giò — Armani',
    referenceDesc: 'Va por la misma línea olfativa — acuático y energizante. Ideal para primavera y verano. Liviano para el movimiento, fresco para el esfuerzo.',
    notes: { top: ['Bergamota', 'Lima', 'Limón', 'Mandarina', 'Naranja'], heart: ['Marino', 'Jazmín', 'Romero', 'Fresia'], base: ['Ámbar', 'Cedro', 'Musgo', 'Pachulí', 'Almizcles'] },
    family: ['Fresco', 'Acuático', 'Cítrico', 'Limpio'],
    stock: 'En stock · Envío en 24/48hs',
    testimonials: [
      { stars: 5, text: 'El White Ice es ideal para el día a día, muy fresco y liviano. Lo uso para ir al gym y a la oficina.', name: 'Nicolás Méndez', city: 'Buenos Aires', initial: 'N' },
      { stars: 5, text: 'Buena atención, buen producto. Me lo recomendaron y no me defraudó.', name: 'Jonás Castro', city: 'Córdoba', initial: 'J' },
    ],
  },
};

// ─── SVG badge icons ───────────────────────────────────────────────────────────
function BadgeIcon({ type, style }) {
  const paths = {
    moon:      <path d="M20 14.5a8 8 0 1 1-10.5-10.5 7 7 0 0 0 10.5 10.5Z" />,
    sun:       <><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"/></>,
    sunrise:   <path d="M3 18h18M5 18a7 7 0 0 1 14 0M12 3v4M5.5 6.5l1.4 1.4M18.5 6.5l-1.4 1.4" />,
    suncloud:  <><circle cx="9" cy="9" r="3"/><path d="M9 3v2M9 13v2M3 9h2M13 9h2M5 5l1.4 1.4M11.6 11.6L13 13M5 13l1.4-1.4M11.6 6.4 13 5"/><path d="M11 17h7a3 3 0 0 0 0-6 4 4 0 0 0-7.5-1"/></>,
    flame:     <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3.5 2.5-4.5 0 2 1 3 2.5 3 0-3 0-5 0-7.5Z" />,
    glass:     <path d="M5 4h14l-2 7a5 5 0 0 1-10 0L5 4ZM12 16v4M9 20h6" />,
    handshake: <path d="M3 13l4-4 3 3M21 13l-4-4-3 3M8 12l3 3 3-3 3 3M3 16h2M19 16h2" />,
    sparkle:   <><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="M19 16l.7 2 2 .7-2 .7L19 22l-.7-2-2-.7 2-.7.7-2Z"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="1"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/></>,
    leaf:      <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14ZM5 19l8-8" />,
    confetti:  <path d="M4 20l4-12 8 8-12 4ZM14 4l2 2M18 6l2-2M16 10l3-1M20 14l-2 1" />,
    dumbbell:  <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />,
    compass:   <><circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-1.5 5-5 1.5 1.5-5 5-1.5Z"/></>,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden style={style}>
      {paths[type] || null}
    </svg>
  );
}

// ─── Registration corner marks ─────────────────────────────────────────────────
function RegMarks({ size = 14 }) {
  const base = { position: 'absolute', width: size, height: size, borderColor: 'var(--sol-muted-2)', borderStyle: 'solid' };
  const pad = size + 4;
  return (
    <>
      <span aria-hidden style={{ ...base, top: pad, left: 18, borderWidth: '0.5px 0 0 0.5px' }} />
      <span aria-hidden style={{ ...base, top: pad, right: 18, borderWidth: '0.5px 0.5px 0 0' }} />
      <span aria-hidden style={{ ...base, bottom: pad, left: 18, borderWidth: '0 0 0.5px 0.5px' }} />
      <span aria-hidden style={{ ...base, bottom: pad, right: 18, borderWidth: '0 0.5px 0.5px 0' }} />
    </>
  );
}

// ─── CSS Bottle large ──────────────────────────────────────────────────────────
function CSSBottle({ name, btl1, btl2 }) {
  return (
    <div style={{
      position: 'relative', width: '46%', height: '70%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
      filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.7))', zIndex: 1,
    }}>
      {/* Cap */}
      <div style={{
        width: '36%', height: '13%',
        background: 'linear-gradient(180deg, #2c2c2c, #161616)',
        border: '0.5px solid rgba(244,241,236,0.08)',
        borderRadius: '2px 2px 0 0',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 2, left: 2, right: 2, height: '30%', background: 'linear-gradient(180deg, rgba(255,255,255,0.06), transparent)' }} />
      </div>
      {/* Neck */}
      <div style={{ width: '22%', height: '6%', background: 'linear-gradient(180deg, #1a1a1a, #0d0d0d)' }} />
      {/* Body */}
      <div style={{
        width: '100%', flex: 1,
        background: `linear-gradient(160deg, ${btl1} 0%, ${btl2} 60%, #060606 100%)`,
        border: '0.5px solid rgba(244,241,236,0.08)',
        borderRadius: '2px',
        position: 'relative',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), inset -10px 0 20px rgba(0,0,0,0.4)',
      }}>
        {/* Highlight strip */}
        <div style={{ position: 'absolute', top: '6%', left: '12%', width: '14%', bottom: '12%', background: 'linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0))', borderRadius: '1px' }} />
        {/* Label area */}
        <div className="font-jost" style={{
          position: 'absolute', top: '36%', left: '50%',
          transform: 'translateX(-50%)', width: '80%',
          textAlign: 'center', color: 'var(--sol-ink)',
          fontWeight: 500, fontSize: '12px', letterSpacing: '0.18em',
          textTransform: 'uppercase', lineHeight: 1.15,
        }}>
          {/* Accent line above */}
          <div style={{ width: 30, height: '0.5px', background: 'var(--accent)', margin: '0 auto 8px' }} />
          {name}
          <small className="font-jakarta" style={{ display: 'block', fontSize: '7px', letterSpacing: '0.24em', color: 'var(--sol-ink-dim)', marginTop: '6px', fontWeight: 400, opacity: 0.7 }}>
            EDP · 60ML
          </small>
          {/* Accent line below */}
          <div style={{ width: 30, height: '0.5px', background: 'var(--accent)', margin: '6px auto 0' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Screens ───────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--sol-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '0.5px solid var(--sol-line)', borderTopColor: 'var(--sol-ink)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function NotFoundScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--sol-bg)', color: 'var(--sol-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '20px' }}>
          404
        </div>
        <h2 className="font-jost" style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '24px' }}>
          Producto no encontrado
        </h2>
        <Link
          to="/tienda"
          className="font-jakarta"
          style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-ink)', textDecoration: 'none', borderBottom: '0.5px solid var(--sol-line-mid)', paddingBottom: 4 }}
        >
          Volver a la tienda →
        </Link>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Producto() {
  const { id: slug } = useParams();
  const [perfume, setPerfume]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const { addToCart } = useCart();

  // Load product
  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    getProductBySlug(slug)
      .then(row => {
        if (cancelled) return;
        setPerfume(row ? productToPerfume(row) : null);
        setError(!row);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  // Reset gallery index on product change
  useEffect(() => { setActiveIdx(0); }, [perfume?.slug]);

  // Track view
  useEffect(() => {
    if (!perfume) return;
    trackViewContent({ name: perfume.name, id: perfume.slug, price: perfume.price });
  }, [perfume?.slug]);

  // Apply per-product accent CSS variables
  useEffect(() => {
    const data = SLUG_DATA[slug];
    if (!data) return;
    const accent = perfume?.accent_color || data.accent;
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-glow', data.accentGlow);
    document.documentElement.style.setProperty('--accent-soft', data.accentSoft);
    document.documentElement.style.setProperty('--accent-dim', data.accentDim);
    return () => {
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--accent-glow');
      document.documentElement.style.removeProperty('--accent-soft');
      document.documentElement.style.removeProperty('--accent-dim');
    };
  }, [slug, perfume?.accent_color]);

  // No auto-advance — slider is 100% manual

  if (loading) return <LoadingScreen />;
  if (error || !perfume) return <NotFoundScreen />;

  const data     = SLUG_DATA[slug] || {};
  const btl1     = data.btl1 || '#1a1a1a';
  const btl2     = data.btl2 || '#0a0a0a';
  const price    = perfume.price ? `$${Number(perfume.price).toLocaleString('es-AR')}` : '';

  // Notes: DB data takes priority, SLUG_DATA as fallback
  const notes = {
    top:   perfume.notes?.top?.length   ? perfume.notes.top   : (data.notes?.top   || []),
    heart: perfume.notes?.heart?.length ? perfume.notes.heart : (data.notes?.heart || []),
    base:  perfume.notes?.base?.length  ? perfume.notes.base  : (data.notes?.base  || []),
  };

  // Family: DB or hardcoded
  const family = data.family?.length
    ? data.family
    : (perfume.family ? [perfume.family] : []);

  // Gallery — videos always first, then images
  const rawGallery   = getProductGalleryMedia(perfume, perfume.image);
  const galleryItems = [
    ...rawGallery.filter(i => i.kind === 'video'),
    ...rawGallery.filter(i => i.kind !== 'video'),
  ];
  const safeIdx    = galleryItems.length > 0 ? Math.min(activeIdx, galleryItems.length - 1) : 0;
  const activeItem = galleryItems[safeIdx] || null;

  const hasImage = !!activeItem;

  // Common section padding style
  const SEC = { borderBottom: '0.5px solid var(--sol-line)' };

  return (
    <div style={{ background: 'var(--sol-bg)', color: 'var(--sol-ink)', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ── Breadcrumb nav ─────────────────────────────────────────── */}
      <div style={{ borderBottom: '0.5px solid var(--sol-line)', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link
          to="/tienda"
          className="font-jakarta"
          style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--sol-ink)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--sol-muted)'}
        >
          <svg style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.2 }} viewBox="0 0 24 24" aria-hidden>
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Tienda
        </Link>
        <span className="font-jakarta" style={{ fontSize: '10px', color: 'var(--sol-muted-2)', letterSpacing: '0.1em' }}>/</span>
        <span className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-ink-dim)' }}>
          {perfume.name}
        </span>
      </div>

      {/* ── HERO: 2-col on desktop ──────────────────────────────────── */}
      <div className="sol-prod-hero">

        {/* ── Image panel (left col on desktop) ── */}
        <div className="sol-prod-img-panel">

          {/* Stage */}
          <div className="sol-prod-stage" style={{
            position: 'relative',
            width: '100%',
            background: `
              radial-gradient(60% 45% at 50% 55%, var(--accent-glow) 0%, transparent 65%),
              radial-gradient(130% 90% at 50% 0%, #131313 0%, var(--sol-bg) 70%)
            `,
            borderBottom: '0.5px solid var(--sol-line)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Grid texture overlay */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 14px, rgba(244,241,236,0.012) 14px, rgba(244,241,236,0.012) 15px)',
            }} />

            {/* Stage labels */}
            <span className="font-jakarta" style={{ position: 'absolute', top: 16, left: 18, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)', zIndex: 2 }}>
              N°/{data.code || '??'} · Solution
            </span>
            <span className="font-jakarta" style={{ position: 'absolute', top: 16, right: 18, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent)', zIndex: 2 }}>
              ● En stock
            </span>
            <span className="font-jakarta" style={{ position: 'absolute', bottom: 16, left: 18, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)', zIndex: 2 }}>
              EDP · 60ML
            </span>
            <span className="font-jakarta" style={{ position: 'absolute', bottom: 16, right: 18, fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)', zIndex: 2 }}>
              Origen AR
            </span>

            <RegMarks size={14} />

            {/* Product image or CSS bottle */}
            {hasImage ? (
              <>
                {/* Blurred bg */}
                <AnimatePresence initial={false} mode="popLayout">
                  {activeItem && (
                    <motion.img
                      key={`bg-${activeItem.path}`}
                      src={activeItem.path.startsWith('http') ? activeItem.path : mediaUrl(activeItem.path)}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)', filter: 'blur(26px)', opacity: 0.3 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.3 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </AnimatePresence>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
                {/* Active image/video */}
                <AnimatePresence initial={false} mode="wait">
                  {activeItem?.kind === 'video' ? (
                    <motion.video
                      key={activeItem.path}
                      src={activeItem.path.startsWith('http') ? activeItem.path : mediaUrl(activeItem.path)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                      initial={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, scale: 1.02, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      controls loop playsInline
                    />
                  ) : activeItem && (
                    <motion.img
                      key={activeItem.path}
                      src={activeItem.path.startsWith('http') ? activeItem.path : mediaUrl(activeItem.path)}
                      alt={perfume.name}
                      loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                      initial={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
                      animate={{ opacity: 1, scale: 1.02, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.98, filter: 'blur(6px)' }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                </AnimatePresence>
                {/* Vignette */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.06) 38%, rgba(0,0,0,0.32) 100%)', pointerEvents: 'none' }} />
                {/* Gallery counter */}
                {galleryItems.length > 1 && (
                  <div className="font-jakarta" style={{ position: 'absolute', right: 14, bottom: 40, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.55)', padding: '4px 10px', zIndex: 2 }}>
                    <span style={{ display: 'block', width: 20, height: '0.5px', background: 'rgba(255,255,255,0.5)' }} />
                    <span style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>
                      {String(safeIdx + 1).padStart(2, '0')}/{String(galleryItems.length).padStart(2, '0')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <CSSBottle name={perfume.name} btl1={btl1} btl2={btl2} />
            )}
          </div>

          {/* Thumbnails */}
          {galleryItems.length > 1 && (
            <div style={{ padding: '16px 18px', borderBottom: '0.5px solid var(--sol-line)', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {galleryItems.map((item, i) => {
                const src = item.path.startsWith('http') ? item.path : mediaUrl(item.path);
                const isActive = i === safeIdx;
                return (
                  <button
                    key={item.id || item.path}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    style={{
                      flexShrink: 0, width: 56, height: 56,
                      border: `0.5px solid ${isActive ? 'var(--accent)' : 'var(--sol-line)'}`,
                      background: 'var(--sol-bg-card)',
                      overflow: 'hidden', cursor: 'pointer',
                      opacity: isActive ? 1 : 0.55,
                      transition: 'opacity 0.3s, border-color 0.3s',
                      padding: 0,
                    }}
                  >
                    {item.kind === 'video'
                      ? <video src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline preload="metadata" />
                      : <img src={src} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    }
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Info panel (right col on desktop) ── */}
        <div>

          {/* Product head */}
          <div style={{ padding: '32px 22px 28px', ...SEC }}>
            <div className="font-jakarta" style={{
              fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase',
              color: 'var(--accent)', marginBottom: '14px',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
              Colección Solution · N°/{data.code || '??'}
            </div>
            <h1 className="font-jost sol-prod-h1" style={{
              fontWeight: 300, fontSize: 'clamp(38px, 10vw, 52px)',
              lineHeight: 1, letterSpacing: '-0.03em',
              color: 'var(--sol-ink)', marginBottom: '8px',
            }}>
              {perfume.name}
            </h1>
            {data.subtitle && (
              <p className="font-jost" style={{ fontStyle: 'italic', fontWeight: 300, fontSize: '16px', color: 'var(--sol-ink-dim)', marginBottom: '22px' }}>
                {data.subtitle}
              </p>
            )}
            <div style={{ width: 40, height: '0.5px', background: 'var(--accent)' }} />
          </div>

          {/* Badges */}
          {data.badges && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...SEC }}>
              {data.badges.map((b, i) => (
                <div
                  key={b.label}
                  style={{
                    padding: '22px 12px 24px', textAlign: 'center',
                    borderRight: i < data.badges.length - 1 ? '0.5px solid var(--sol-line)' : 'none',
                    position: 'relative', overflow: 'hidden',
                  }}
                >
                  {/* Radial glow */}
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(100% 60% at 50% 100%, var(--accent-soft) 0%, transparent 80%)', pointerEvents: 'none' }} />
                  <BadgeIcon type={b.icon} style={{ width: 22, height: 22, color: 'var(--accent)', display: 'block', margin: '0 auto 10px' }} />
                  <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '5px' }}>
                    {b.label}
                  </div>
                  <div className="font-jost" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--sol-ink)' }}>
                    {b.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Poetic copy */}
          {(data.leadPre || data.body) && (
            <div style={{ padding: '48px 22px 40px', ...SEC }}>
              {data.leadPre && (
                <p className="font-jost" style={{ fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(22px, 5vw, 28px)', lineHeight: 1.2, letterSpacing: '-0.015em', color: 'var(--sol-ink)', marginBottom: '28px' }}>
                  {data.leadPre}{' '}
                  <em style={{ fontStyle: 'italic' }}>{data.leadEm}</em>
                  <br />{data.leadPost}
                </p>
              )}
              {data.body?.map((paragraph, i) => (
                <p key={i} className="font-jakarta" style={{ fontSize: '14.5px', lineHeight: 1.75, color: 'var(--sol-ink-dim)', marginBottom: '14px' }}>
                  {paragraph}
                </p>
              ))}
              {data.closingLine && (
                <div className="font-jost" style={{
                  fontSize: '18px', fontWeight: 400, lineHeight: 1.4,
                  color: 'var(--sol-ink)', marginTop: '24px', paddingTop: '24px',
                  borderTop: '0.5px solid var(--sol-line)',
                  position: 'relative',
                }}>
                  {/* Accent line decoration */}
                  <div style={{ position: 'absolute', top: -0.5, left: 0, width: 40, height: '0.5px', background: 'var(--accent)' }} />
                  {data.closingLine}
                  <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--accent)', display: 'block' }}>
                    {data.closingEm}
                  </em>
                </div>
              )}
            </div>
          )}

          {/* Market reference */}
          {data.reference && (
            <div style={{ padding: '36px 22px', ...SEC, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ width: '1px', background: 'var(--accent)', alignSelf: 'stretch', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '8px' }}>
                  Referencia en el mercado
                </div>
                <div className="font-jost" style={{ fontWeight: 500, fontSize: '22px', color: 'var(--sol-ink)', letterSpacing: '-0.015em', marginBottom: '12px', lineHeight: 1.15 }}>
                  {data.reference}
                </div>
                <div className="font-jakarta" style={{ fontSize: '13.5px', lineHeight: 1.7, color: 'var(--sol-muted)' }}>
                  {data.referenceDesc}
                </div>
              </div>
            </div>
          )}

        </div>{/* end info panel (right col) */}
      </div>{/* end sol-prod-hero */}

      {/* ── Below hero: olfactory pyramid, family, buy block ─────────── */}
      <div className="sol-prod-below">

          {/* Olfactory notes */}
          {(notes.top.length > 0 || notes.heart.length > 0 || notes.base.length > 0) && (
            <div style={{ padding: '48px 22px 40px', ...SEC }}>
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '10px' }}>
                  Pirámide olfativa
                </div>
                <h2 className="font-jost" style={{ fontWeight: 300, fontSize: '26px', letterSpacing: '-0.02em', color: 'var(--sol-ink)' }}>
                  Tres tiempos.<br />
                  <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Una identidad.</em>
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {[
                  { num: '01', name: 'Salida',   items: notes.top },
                  { num: '02', name: 'Corazón',  items: notes.heart },
                  { num: '03', name: 'Fondo',    items: notes.base },
                ].map(col => col.items.length > 0 && (
                  <div key={col.name} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Column head */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '14px' }}>
                      <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.22em', color: 'var(--accent)', marginBottom: '4px' }}>
                        N°/{col.num}
                      </div>
                      <div className="font-jost" style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sol-ink)' }}>
                        {col.name}
                      </div>
                    </div>
                    {/* Divider with dot */}
                    <div style={{ width: '100%', height: '0.5px', background: 'var(--sol-line-mid)', marginBottom: '14px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)', width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%' }} />
                    </div>
                    {/* Notes list */}
                    <ul style={{ listStyle: 'none', textAlign: 'center', flex: 1 }}>
                      {col.items.map((note, ni) => (
                        <li key={ni} className="font-jost" style={{
                          fontSize: '13px', fontWeight: 400,
                          color: 'var(--sol-ink-dim)',
                          padding: '9px 2px',
                          borderBottom: ni < col.items.length - 1 ? '0.5px solid var(--sol-line)' : 'none',
                          letterSpacing: '-0.005em',
                          lineHeight: 1.3,
                        }}>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Family pills */}
          {family.length > 0 && (
            <div style={{ padding: '32px 22px', ...SEC }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px' }}>
                <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
                  Familia olfativa
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {family.map(f => (
                  <span key={f} className="font-jakarta" style={{
                    fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: 'var(--sol-ink-dim)', border: '0.5px solid var(--sol-line-mid)',
                    padding: '7px 12px', borderRadius: '100px',
                    transition: 'color 0.3s, border-color 0.3s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent-dim)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; e.currentTarget.style.borderColor = 'var(--sol-line-mid)'; }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Buy block */}
          <div style={{ padding: '36px 22px 32px', ...SEC, position: 'relative', overflow: 'hidden' }}>
            {/* Glow */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(100% 70% at 50% 0%, var(--accent-soft) 0%, transparent 60%)', pointerEvents: 'none' }} />

            {/* Price */}
            <div style={{ marginBottom: '8px', position: 'relative' }}>
              {getCrossedPrice(slug) && (
                <div style={{ marginBottom: '4px' }}>
                  <span className="font-jakarta" style={{ fontSize: '13px', color: 'var(--sol-muted)', textDecoration: 'line-through', letterSpacing: '0.04em' }}>
                    {getCrossedPrice(slug)} ARS
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <div className="font-jost" style={{ fontWeight: 300, fontSize: '42px', letterSpacing: '-0.025em', color: 'var(--sol-ink)', lineHeight: 1 }}>
                  {price}
                  <small className="font-jakarta" style={{ fontSize: '11px', color: 'var(--sol-muted)', letterSpacing: '0.18em', marginLeft: '4px' }}>ARS</small>
                </div>
              </div>
            </div>
            <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '22px', position: 'relative' }}>
              <strong style={{ color: 'var(--sol-ink-dim)', fontWeight: 400 }}>{data.stock || 'En stock'}</strong>
              {' · '}Hasta 2 cuotas sin interés
            </div>

            {/* Trust row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '18px 0', marginBottom: '22px', borderTop: '0.5px solid var(--sol-line)', borderBottom: '0.5px solid var(--sol-line)' }}>
              {[
                { icon: <path d="M3 7h13v9H3z M16 11h4l1 2v3h-5z" />, label: 'Envío\n24/48hs' },
                { icon: <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z M9 12l2.2 2.2L15 10" />, label: 'Garantía\n30 días' },
                { icon: <><rect x="3" y="6" width="18" height="13" rx="1"/><path d="M3 10h18"/></>, label: 'Cuotas\nsin interés' },
              ].map((t, i) => (
                <div key={i} style={{ textAlign: 'center', borderRight: i < 2 ? '0.5px solid var(--sol-line)' : 'none', padding: '0 6px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--sol-ink-dim)" strokeWidth="1.2" aria-hidden style={{ width: 16, height: 16, display: 'block', margin: '0 auto 8px' }}>
                    {t.icon}
                  </svg>
                  <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-ink-dim)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {t.label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <button
              type="button"
              onClick={() => addToCart(perfume)}
              className="font-jakarta"
              style={{
                display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 14,
                padding: '20px', background: 'var(--accent)', color: 'var(--sol-bg)',
                border: 'none', fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
                transition: 'opacity 0.3s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span>Agregar al carrito</span>
              <span style={{ display: 'inline-block', transition: 'transform 0.3s' }}>→</span>
            </button>
          </div>

      </div>{/* end sol-prod-below */}

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      {data.testimonials?.length > 0 && (
        <section style={{ padding: 'var(--sol-section-py) 0', ...SEC }}>
          <div className="sol-container" style={{ padding: '0 var(--sol-section-px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '28px' }}>
              <div>
                <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '8px' }}>
                  Voces reales
                </div>
                <h2 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(22px, 5vw, 28px)', letterSpacing: '-0.02em', color: 'var(--sol-ink)' }}>
                  Lo que dicen<br />
                  <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>quienes lo usan</em>.
                </h2>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.testimonials.map((t, i) => (
                <article
                  key={i}
                  style={{
                    background: 'var(--sol-bg-card)',
                    border: '0.5px solid var(--sol-line)',
                    padding: '22px 20px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '2px', color: 'var(--accent)', fontSize: '13px', letterSpacing: '0.1em' }}>
                      {'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}
                    </div>
                    <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
                      Compra verificada
                    </div>
                  </div>
                  <p className="font-jost" style={{ fontWeight: 400, fontSize: '16px', lineHeight: 1.45, color: 'var(--sol-ink)', marginBottom: '18px', letterSpacing: '-0.01em' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '26px', lineHeight: 0, verticalAlign: '-6px', marginRight: 4 }}>"</span>
                    {t.text}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '16px', borderTop: '0.5px solid var(--sol-line)' }}>
                    <div className="font-jost" style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent-soft)', border: '0.5px solid var(--accent-dim)',
                      color: 'var(--accent)', fontSize: '11px', fontWeight: 500,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {t.initial}
                    </div>
                    <div>
                      <div className="font-jost" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--sol-ink)' }}>{t.name}</div>
                      <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginTop: '2px' }}>{t.city}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RESEÑAS EN VIDEO — habilitarlas cuando estén listos los videos */}
      {/*
      <section style={{ padding: 'var(--sol-section-py) 0', ...SEC }}>
        <div className="sol-container" style={{ padding: '0 var(--sol-section-px)' }}>
          <div style={{ marginBottom: '28px' }}>
            <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '8px' }}>
              Reseñas en video
            </div>
            <h2 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(22px, 5vw, 28px)', letterSpacing: '-0.02em', color: 'var(--sol-ink)', marginBottom: '6px' }}>
              Lo probaron <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)' }}>y lo contaron</em>.
            </h2>
            <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              Clientes reales · Sin filtros
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { num: '01', handle: 'andresf.ok',  dur: '0:24', likes: '1.2K' },
              { num: '02', handle: 'ezeq.zotto',  dur: '0:18', likes: '842' },
              { num: '03', handle: 'francobg',    dur: '0:31', likes: '2.1K' },
              { num: '04', handle: 'nicom_ba',    dur: '0:22', likes: '670' },
            ].map(r => (
              <div key={r.num} style={{
                position: 'relative', aspectRatio: '9 / 16',
                background: 'radial-gradient(80% 60% at 50% 30%, #181818 0%, #0a0a0a 70%)',
                border: '0.5px solid var(--sol-line)', overflow: 'hidden', cursor: 'pointer',
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'repeating-linear-gradient(135deg, transparent 0, transparent 18px, rgba(244,241,236,0.012) 18px, rgba(244,241,236,0.012) 19px)',
                  pointerEvents: 'none',
                }} />
                <span className="font-jakarta" style={{ position: 'absolute', top: 10, left: 12, fontSize: '8px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
                  N°/{r.num}
                </span>
                <span className="font-jakarta" style={{ position: 'absolute', top: 10, right: 12, fontSize: '8px', letterSpacing: '0.2em', color: 'var(--sol-ink-dim)', background: 'rgba(0,0,0,0.55)', padding: '2px 6px' }}>
                  {r.dur}
                </span>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--accent-soft)', border: '0.5px solid var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 0, height: 0, borderStyle: 'solid', borderWidth: '7px 0 7px 11px', borderColor: 'transparent transparent transparent var(--accent)', marginLeft: 2 }} />
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 12px 10px', background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="font-jost" style={{ fontSize: '11px', color: 'var(--sol-ink)', fontWeight: 500 }}>
                    <span style={{ color: 'var(--accent)' }}>@</span>{r.handle}
                  </div>
                  <div className="font-jakarta" style={{ fontSize: '8px', letterSpacing: '0.18em', color: 'var(--sol-ink-dim)' }}>
                    {r.likes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section style={{ padding: 'var(--sol-section-py) 0 calc(var(--sol-section-py) * 1.5)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Accent glow */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 80% at 50% 100%, var(--accent-soft) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div className="sol-container" style={{ padding: '0 var(--sol-section-px)', position: 'relative' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span style={{ display: 'inline-block', width: 18, height: '0.5px', background: 'var(--sol-line-mid)', verticalAlign: 'middle' }} />
            ¿Listo?
            <span style={{ display: 'inline-block', width: 18, height: '0.5px', background: 'var(--sol-line-mid)', verticalAlign: 'middle' }} />
          </div>
          <h2 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(32px, 9vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: '28px' }}>
            {perfume.name}<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>te espera.</em>
          </h2>
          <button
            type="button"
            onClick={() => addToCart(perfume)}
            className="font-jakarta"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 14,
              padding: '20px 32px', background: 'var(--accent)', color: 'var(--sol-bg)',
              border: 'none', fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', cursor: 'pointer', width: '100%', maxWidth: '420px',
              transition: 'opacity 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span>Agregar al carrito · {price}</span>
            <span>→</span>
          </button>
        </div>
      </section>

    </div>
  );
}

