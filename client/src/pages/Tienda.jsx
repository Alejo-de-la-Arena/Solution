import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReveal } from '../hooks/useReveal';
import { getPublicProducts, productToPerfume } from '../services/products';
import { ACCENT_COLORS } from '../lib/accentColors';
import { getComboProfile, normalizeComboKey } from '../data/comboProfiles';
import { mediaUrl } from '../lib/mediaUrl';
import { getStoreProductImages } from '../lib/storeProductImages';
import { useCart } from '../contexts/CartContext';
import { getCrossedPrice, CROSSED_PRICES } from '../lib/crossedPrices';
import { getComboSettings, normalizeComboSettings, resolveComboImage } from '../services/combo';
import TestimonialsSection from '../components/home/TestimonialsSection';

// ─── Static per-slug data ──────────────────────────────────────────────────────
const SLUG_META = {
  'red-desire': {
    subtitle:   'Pasión y seducción',
    reference:  'Stronger with you',
    momento:    'Noche',
    dotColor:   '#c0392b',
    notes:      ['Vainilla', 'Cardamomo', 'Ámbar'],
    featured:   true,
  },
  'black-code': {
    subtitle:   'Presencia y carácter',
    reference:  'Creed Aventus',
    momento:    'Salida',
    dotColor:   '#888888',
    notes:      ['Piña ahumada', 'Cuero', 'Madera'],
    featured:   false,
  },
  'deep-blue': {
    subtitle:   'Elegancia clásica',
    reference:  'Bleu de Chanel',
    momento:    'Trabajo',
    dotColor:   '#378add',
    notes:      ['Cítrico', 'Madera seca', 'Incienso'],
    featured:   false,
  },
  'yellow-bloom': {
    subtitle:   'Una explosión frutal que destaca',
    reference:  'Erba Pura',
    momento:    'Día',
    dotColor:   '#e6a72f',
    notes:      ['Cítrico', 'Frutal', 'Musk'],
    featured:   false,
  },
  'white-ice': {
    subtitle:   'Pureza y frescura para tu rutina',
    reference:  'Acqua di Gio',
    momento:    'Gym',
    dotColor:   '#0dd3b8',
    notes:      ['Acuático', 'Bergamota', 'Pachulí'],
    featured:   false,
  },
};

// Número de colección por slug (orden de la maqueta)
const CARD_NUM = {
  'black-code':   '01',
  'red-desire':   '02',
  'yellow-bloom': '03',
  'deep-blue':    '04',
  'white-ice':    '05',
};

// Agrupación de los sliders de productos
const SLIDER_ROWS = [
  { label: 'Noche & Salidas',   slugs: ['red-desire', 'black-code'] },
  { label: 'Día & Movimiento',  slugs: ['deep-blue', 'yellow-bloom', 'white-ice'] },
];

// ─── Videos de reseñas (placeholders — cargar URLs cuando estén listas) ─────────
// Sin atar a un perfume específico (la mayoría de reseñas son de Red Desire).
// Formato reel 9:16. Para activar un video, completá `url` (y opcionalmente `poster`).
const VIDEO_REVIEWS = [
  { id: 'v1', url: '', poster: '', accent: '#FF2D55' },
  { id: 'v2', url: '', poster: '', accent: '#00e5ff' },
  { id: 'v3', url: '', poster: '', accent: '#e6a72f' },
  { id: 'v4', url: '', poster: '', accent: '#378add' },
];

// ─── ¿Cuál es tu momento? — filas con íconos ────────────────────────────────────
const MOMENTOS = [
  { slug: 'red-desire',   icon: '🌙', tag: 'Noche · Citas',        name: 'Red Desire',   reference: 'Stronger with you', tint: 'rgba(192,57,43,0.14)' },
  { slug: 'black-code',   icon: '✦',  tag: 'Salida · Eventos',     name: 'Black Code',   reference: 'Creed Aventus',     tint: 'rgba(0,229,255,0.10)' },
  { slug: 'yellow-bloom', icon: '☀',  tag: 'Día · Rutina',         name: 'Yellow Bloom', reference: 'Erba Pura',         tint: 'rgba(230,167,47,0.12)' },
  { slug: 'deep-blue',    icon: '◈',  tag: 'Trabajo · Reuniones',  name: 'Deep Blue',    reference: 'Bleu de Chanel',    tint: 'rgba(55,138,221,0.14)' },
  { slug: 'white-ice',    icon: '◎',  tag: 'Gym · Movimiento',     name: 'White Ice',    reference: 'Acqua di Gio',      tint: 'rgba(13,211,184,0.12)' },
];

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Tienda() {
  const [perfumes, setPerfumes]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [selectedPerfume1, setSelectedPerfume1] = useState(null);
  const [selectedPerfume2, setSelectedPerfume2] = useState(null);
  const [comboSettings, setComboSettings]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    getComboSettings()
      .then((row) => { if (!cancelled) setComboSettings(normalizeComboSettings(row)); })
      .catch(() => { if (!cancelled) setComboSettings(normalizeComboSettings(null)); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPublicProducts()
      .then((rows) => {
        if (cancelled) return;
        const list = rows.map(productToPerfume).filter(Boolean);
        setPerfumes(list);
        if (list.length > 0 && selectedPerfume1 === null) setSelectedPerfume1(list[0].id);
        if (list.length > 1 && selectedPerfume2 === null) setSelectedPerfume2(list[1].id);
      })
      .catch(() => { if (!cancelled) setPerfumes([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (perfumes.length > 0 && !selectedPerfume1) setSelectedPerfume1(perfumes[0].id);
    if (perfumes.length > 1 && !selectedPerfume2) setSelectedPerfume2(perfumes[1].id);
  }, [perfumes, selectedPerfume1, selectedPerfume2]);

  const perfume1 = perfumes.find(p => p.id === selectedPerfume1);
  const perfume2 = perfumes.find(p => p.id === selectedPerfume2);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--sol-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '0.5px solid var(--sol-line-str)', borderTopColor: 'var(--sol-green)', animation: 'spin 0.9s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--sol-bg)', color: 'var(--sol-ink)', minHeight: '100vh' }}>
      <TiendaHero />

      {perfumes.length >= 2 && (
        <TiendaComboSection
          perfumes={perfumes}
          selectedPerfume1={selectedPerfume1}
          setSelectedPerfume1={setSelectedPerfume1}
          selectedPerfume2={selectedPerfume2}
          setSelectedPerfume2={setSelectedPerfume2}
          perfume1={perfume1}
          perfume2={perfume2}
          settings={comboSettings}
        />
      )}

      <ProductSlidersSection perfumes={perfumes} />

      <VideoReviewsSection />

      <TestimonialsSection />

      <MomentoSection />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function TiendaHero() {
  const headRef = useReveal();
  const statsRef = useReveal();

  return (
    <section style={{ borderBottom: '0.5px solid var(--sol-line)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)', background: 'var(--sol-bg)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--sol-section-px)' }}>

        {/* Eyebrow + section number */}
        <div ref={headRef} className="sol-reveal" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
            la Tienda
          </div>
        </div>

        {/* Headline */}
        <h1
          className="font-jost"
          style={{ fontWeight: 300, fontSize: 'clamp(44px, 10.5vw, 88px)', lineHeight: 1.02, letterSpacing: '-0.03em', color: 'var(--sol-ink)', marginBottom: '24px', textAlign: 'center' }}
        >
          <span style={{ display: 'block' }}>Cinco fragancias.</span>
          <em style={{ display: 'block', fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>Tu momento.</em>
        </h1>

        {/* Scroll indicator */}
        <div ref={statsRef} className="sol-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: '#00e5ff', display: 'flex', alignItems: 'center' }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

// ─── Product sliders (reemplaza el listado vertical) ────────────────────────────
function ProductSlidersSection({ perfumes }) {
  const headRef = useReveal();
  const bySlug = new Map(perfumes.map(p => [(p.slug || '').trim().toLowerCase(), p]));

  return (
    <section id="coleccion" style={{ borderBottom: '0.5px solid var(--sol-line)', background: 'var(--sol-bg)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--sol-section-px)' }}>

        {/* Section head */}
        <div ref={headRef} className="sol-reveal" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '12px' }}>
            La colección
          </div>
          <h2 className="font-jost" style={{ fontWeight: 400, fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--sol-ink)' }}>
            Elegí tu <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>fragancia</em>.
          </h2>
        </div>

        {/* Filas */}
        {SLIDER_ROWS.map((row) => {
          const items = row.slugs.map(s => bySlug.get(s)).filter(Boolean);
          if (items.length === 0) return null;
          return <SliderRow key={row.label} label={row.label} perfumes={items} />;
        })}

      </div>
    </section>
  );
}

function SliderRow({ label, perfumes }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="sol-reveal" style={{ marginBottom: '36px' }}>
      <div className="font-jost" style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--sol-ink)', marginBottom: '18px' }}>
        {label}
      </div>
      <div className="sol-slider-row">
        {perfumes.map((perfume, i) => (
          <SliderCard key={perfume.id} perfume={perfume} index={i} />
        ))}
      </div>
    </div>
  );
}

function SliderCard({ perfume, index }) {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);

  const slug       = (perfume.slug || '').trim().toLowerCase();
  const meta       = SLUG_META[slug] || {};
  const accent     = perfume.accent_color || ACCENT_COLORS[index] || 'var(--sol-green)';
  const isFeatured = meta.featured || slug === 'red-desire';
  const price      = perfume.price ? `$${Number(perfume.price).toLocaleString('es-AR')}` : '';
  const crossed    = getCrossedPrice(slug);
  const num        = CARD_NUM[slug] || String(index + 1).padStart(2, '0');

  const storeImages = getStoreProductImages(perfume);
  const imgSrc = storeImages.default ? mediaUrl(storeImages.default) : (perfume.image || null);

  return (
    <article
      className="sol-slider-card"
      style={{
        background: 'var(--sol-bg-card)',
        border: '0.5px solid var(--sol-line)',
        borderTop: `2px solid ${accent}`,
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Imagen */}
      <Link to={`/producto/${perfume.id}`} style={{ display: 'block', position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', background: `radial-gradient(ellipse at 50% 28%, ${accent}1f 0%, #060606 70%)` }}>
        {isFeatured && (
          <span className="font-jakarta" style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, fontSize: '8px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', background: 'var(--sol-magenta)', color: 'var(--sol-bg)', padding: '4px 8px' }}>
            Más vendido
          </span>
        )}
        <span className="font-jakarta" style={{ position: 'absolute', bottom: 8, right: 10, zIndex: 2, fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(244,241,236,0.25)' }}>
          N°/{num}
        </span>
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={perfume.name}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: slug === 'red-desire' ? 'center 25%' : 'center center' }}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-jakarta" style={{ fontSize: '10px', color: 'var(--sol-muted)', letterSpacing: '0.16em' }}>Imagen no configurada</span>
          </div>
        )}
      </Link>

      {/* Cuerpo */}
      <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Momento */}
        <div className="font-jakarta" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '8px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dotColor || accent, boxShadow: '0 0 0 1px rgba(0,0,0,0.4)', flexShrink: 0 }} />
          {meta.momento || ''}
        </div>

        {/* Nombre */}
        <h3 className="font-jost" style={{ fontSize: 'clamp(20px, 3.4vw, 24px)', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.01em', color: 'var(--sol-ink)', marginBottom: '6px' }}>
          {perfume.name}<em style={{ fontStyle: 'normal', color: accent }}>.</em>
        </h3>

        {/* Referencia de mercado */}
        {meta.reference && (
          <div className="font-jakarta" style={{ alignSelf: 'flex-start', fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--sol-ink-dim)', background: 'rgba(244,241,236,0.06)', border: '0.5px solid var(--sol-line)', padding: '4px 9px', borderRadius: '4px', marginBottom: '12px' }}>
            <span style={{ color: 'var(--sol-muted)' }}>→ </span>{meta.reference}
          </div>
        )}

        {/* Precio */}
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {crossed && (
            <span className="font-jakarta" style={{ fontSize: '11px', color: 'var(--sol-muted)', textDecoration: 'line-through', letterSpacing: '0.04em' }}>
              {crossed}
            </span>
          )}
          <span className="font-jost" style={{ fontSize: 'clamp(18px, 3.4vw, 22px)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--sol-ink)' }}>
            {price}
          </span>
          {crossed && (
            <span className="font-jakarta" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--sol-bg)', background: accent, padding: '2px 7px', borderRadius: '9999px' }}>
              30% OFF
            </span>
          )}
        </div>

        {/* CTAs — Ver detalles (arriba) + Agregar al carrito (abajo) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
          <Link
            to={`/producto/${perfume.id}`}
            className="font-jakarta"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '11px', background: 'transparent',
              border: '0.5px solid var(--sol-line-mid)', color: 'var(--sol-ink-dim)',
              fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
              transition: 'border-color 0.3s, color 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sol-line-mid)'; e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
          >
            Ver detalles →
          </Link>
          <button
            type="button"
            onClick={() => addToCart(perfume)}
            className="font-jakarta"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: accent, color: 'var(--sol-bg)',
              border: 'none', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', cursor: 'pointer', transition: 'opacity 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <svg style={{ width: 13, height: 13, stroke: 'currentColor', fill: 'none', strokeWidth: 1.6 }} viewBox="0 0 24 24" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Agregar al carrito
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Sección de videos — "Lo que dicen ellos" ───────────────────────────────────
function VideoReviewsSection() {
  const headRef = useReveal();

  return (
    <section style={{ borderBottom: '0.5px solid var(--sol-line)', background: 'var(--sol-bg)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)', overflow: 'hidden' }}>
      <div ref={headRef} className="sol-reveal" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--sol-section-px)', textAlign: 'center', marginBottom: '36px' }}>
        <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '12px' }}>
          En sus palabras
        </div>
        <h2 className="font-jost" style={{ fontWeight: 400, fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--sol-ink)' }}>
          Lo que dicen <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>ellos</em>.
        </h2>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div className="sol-reel-row" style={{ paddingLeft: 'var(--sol-section-px)', paddingRight: 'var(--sol-section-px)' }}>
          {VIDEO_REVIEWS.map((review) => (
            <VideoReel key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoReel({ review }) {
  const [active, setActive] = useState(false);
  const hasUrl = Boolean(review.url);

  return (
    <div className="sol-reel-card">
      <div style={{ position: 'relative', aspectRatio: '9 / 16', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid var(--sol-line)', background: '#0b0b0b' }}>
        {/* Acento superior */}
        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: review.accent, zIndex: 3 }} />

        {active && hasUrl ? (
          <video
            src={review.url}
            poster={review.poster || undefined}
            controls
            autoPlay
            playsInline
            preload="metadata"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <button
            type="button"
            onClick={() => hasUrl && setActive(true)}
            disabled={!hasUrl}
            aria-label={hasUrl ? 'Reproducir video' : 'Video próximamente'}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
              background: 'transparent', border: 'none', cursor: hasUrl ? 'pointer' : 'default', padding: 0,
            }}
          >
            {review.poster && (
              <img src={review.poster} alt="" aria-hidden loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
            )}
            <span style={{ position: 'relative', zIndex: 2, width: 44, height: 44, borderRadius: '50%', background: 'rgba(244,241,236,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sol-ink)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            </span>
            {!hasUrl && (
              <span className="font-jakarta" style={{ position: 'relative', zIndex: 2, fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
                Próximamente
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ¿Cuál es tu momento? — 5 filas con íconos + CTA ────────────────────────────
function MomentoSection() {
  const headRef = useReveal();
  const listRef = useReveal();

  return (
    <section style={{ borderBottom: '0.5px solid var(--sol-line)', background: 'var(--sol-bg)', color: 'var(--sol-ink)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 var(--sol-section-px)' }}>

        {/* Head */}
        <div ref={headRef} className="sol-reveal" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '12px' }}>
            Encontrá el tuyo
          </div>
          <h2 className="font-jost" style={{ fontWeight: 400, fontSize: 'clamp(30px, 7vw, 48px)', lineHeight: 1.02, letterSpacing: '-0.03em', color: 'var(--sol-ink)', marginBottom: '14px' }}>
            ¿Cuál es <em style={{ fontStyle: 'italic', color: 'var(--sol-magenta)', fontWeight: 300 }}>tu momento?</em>
          </h2>
          <p className="font-jakarta" style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--sol-ink-dim)' }}>
            Cada fragancia tiene un propósito. Elegí la que va con tu día.
          </p>
        </div>

        {/* Filas */}
        <div ref={listRef} className="sol-reveal" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
          {MOMENTOS.map((m) => {
            const accent = SLUG_META[m.slug]?.dotColor || 'var(--sol-green)';
            return (
              <Link
                key={m.slug}
                to={`/producto/${m.slug}`}
                className="sol-momento-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: 'var(--sol-bg-card)', border: '0.5px solid var(--sol-line)',
                  borderRadius: '10px', padding: '14px 16px', textDecoration: 'none', color: 'var(--sol-ink)',
                  transition: 'border-color 0.3s var(--sol-ease)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sol-line-str)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sol-line)'; }}
              >
                <span aria-hidden style={{ width: 38, height: 38, borderRadius: '50%', background: m.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                  {m.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="font-jakarta" style={{ display: 'block', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '3px' }}>
                    {m.tag}
                  </span>
                  <span className="font-jost" style={{ display: 'block', fontSize: '16px', fontWeight: 600, lineHeight: 1.1, color: 'var(--sol-ink)' }}>
                    {m.name}<em style={{ fontStyle: 'normal', color: accent }}>.</em>
                  </span>
                  <span className="font-jakarta" style={{ display: 'block', fontSize: '10px', color: 'var(--sol-muted)', marginTop: '2px' }}>
                    → {m.reference}
                  </span>
                </span>
                <span aria-hidden className="font-jakarta" style={{ fontSize: '14px', color: 'var(--sol-muted)', flexShrink: 0 }}>→</span>
              </Link>
            );
          })}
        </div>

        {/* CTA final */}
        <div style={{ textAlign: 'center' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '14px' }}>
            5 Perfumes · 5 Momentos · 1 Solución
          </div>
          <a
            href="#coleccion"
            className="font-jakarta"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              width: '100%', maxWidth: 360, margin: '0 auto', padding: '16px',
              background: 'var(--sol-green)', color: 'var(--sol-bg)',
              border: 'none', fontSize: '11px', fontWeight: 800, letterSpacing: '0.16em',
              textTransform: 'uppercase', textDecoration: 'none', cursor: 'pointer', transition: 'opacity 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Elegí el tuyo →
          </a>
        </div>

      </div>
    </section>
  );
}

// ─── Combo section ─────────────────────────────────────────────────────────────
function TiendaComboSection({ perfumes, selectedPerfume1, setSelectedPerfume1, selectedPerfume2, setSelectedPerfume2, perfume1, perfume2, settings }) {
  const { addToCart } = useCart();
  const headRef = useReveal();
  const bodyRef = useReveal();

  const cfg = settings || normalizeComboSettings(null);

  const handleAddCombo = () => {
    if (perfume1) addToCart({ ...perfume1, combo_tag: 'Combo Día del Padre' });
    if (perfume2) addToCart({ ...perfume2, combo_tag: 'Combo Día del Padre' });
  };

  const comboProfile    = getComboProfile(selectedPerfume1, selectedPerfume2);
  const comboProfileKey = comboProfile
    ? normalizeComboKey(selectedPerfume1, selectedPerfume2)
    : `${selectedPerfume1 || 'empty'}__${selectedPerfume2 || 'empty'}`;

  const SLUG_ORDER = ['red-desire', 'yellow-bloom', 'black-code', 'white-ice', 'deep-blue'];
  const orderedPerfumes = [...perfumes].sort((a, b) => {
    const ai = SLUG_ORDER.indexOf((a.slug || '').toLowerCase());
    const bi = SLUG_ORDER.indexOf((b.slug || '').toLowerCase());
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Texto de cada <option>: "NOMBRE / REFERENCIA" desde combo_settings, con
  // fallback al name del producto + referencia de SLUG_META.
  function optionLabel(p) {
    const slug = (p.slug || '').trim().toLowerCase();
    const opt = cfg.options?.[slug];
    const name = (opt?.name || p.name || '').trim();
    const reference = (opt?.reference || SLUG_META[slug]?.reference || '').trim();
    return reference ? `${name} / ${reference}` : name;
  }

  return (
    <section id="combo" style={{ background: 'var(--sol-bg)', color: 'var(--sol-ink)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)', borderBottom: '0.5px solid var(--sol-line)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--sol-section-px)' }}>

        {/* Label — encima de la card, centrado */}
        <div ref={headRef} className="sol-reveal" style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div className="font-jakarta sol-combo-label" style={{ letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sol-ink)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px' }}>
            🎁 Oferta Día del Padre
          </div>
        </div>

        {/* Single-column content */}
        <div ref={bodyRef} className="sol-reveal">

          {/* Card — único bloque: título, slider, perfil, selectores, precio y CTA */}
          <div className="sol-combo-card" style={{ border: '0.5px solid rgba(255, 255, 255, 0.6)', background: 'rgba(245, 242, 238, 0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)', borderRadius: '16px', margin: '0 auto', width: '100%', padding: '20px 16px', textAlign: 'center', color: '#1a1a1a' }}>

            {/* 1. Título */}
            <p className="font-jakarta" style={{ fontWeight: 700, fontSize: 'clamp(16px, 3vw, 18px)', letterSpacing: '0.06em', lineHeight: 1.6, textAlign: 'center', color: '#1a1a1a', margin: 0 }}>
              LLEVÁ 2 PERFUMES SOLUTION<br />
              <span style={{ color: '#1a1a1a', marginLeft: '-9px' }}>+ PERFUMERO DE REGALO</span><br />
              + ENVÍO GRATIS + 30% OFF
            </p>

            {/* 2. Slider reducido */}
            <div style={{ marginTop: '12px' }}>
              <ComboCollectionShowcase settings={cfg} compact maxWidth={240} />
            </div>

            {/* 3. Perfil — solo label + nickname */}
            <div style={{ marginTop: '12px' }}>
              <motion.div
                key={comboProfileKey}
                initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="font-jakarta sol-combo-perfil-label" style={{ letterSpacing: '0.24em', textTransform: 'uppercase', color: comboProfile ? '#e040fb' : '#888', marginBottom: comboProfile ? '6px' : 0 }}>
                  Perfil de la combinación
                </div>
                {comboProfile && (
                  <h3 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(24px, 5.5vw, 34px)', letterSpacing: '-0.02em', color: '#1a1a1a', margin: 0 }}>
                    {comboProfile.nickname}
                  </h3>
                )}
              </motion.div>
            </div>

            {/* 4-5. Selectores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <ComboSelect
                label={cfg.select_label_1}
                value={selectedPerfume1}
                onChange={setSelectedPerfume1}
                options={orderedPerfumes}
                optionLabel={optionLabel}
              />
              <ComboSelect
                label={cfg.select_label_2}
                value={selectedPerfume2}
                onChange={setSelectedPerfume2}
                options={orderedPerfumes}
                optionLabel={optionLabel}
              />
            </div>

            {/* 6. Precio */}
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              {perfume1 && perfume2 && (() => {
                const cp1 = CROSSED_PRICES[(perfume1.slug || '').toLowerCase().trim()];
                const cp2 = CROSSED_PRICES[(perfume2.slug || '').toLowerCase().trim()];
                const crossedSum = cp1 && cp2 ? cp1 + cp2 : null;
                return crossedSum ? (
                  <span className="font-jakarta" style={{ fontSize: '13px', color: '#888', textDecoration: 'line-through', letterSpacing: '0.04em' }}>
                    ${crossedSum.toLocaleString('es-AR')} ARS
                  </span>
                ) : null;
              })()}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', justifyContent: 'center' }}>
                <span className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(30px, 7vw, 42px)', letterSpacing: '-0.025em', color: '#1a1a1a', lineHeight: 1 }}>
                  {perfume1 && perfume2 ? `$${(perfume1.price + perfume2.price).toLocaleString('es-AR')}` : '—'}
                </span>
                <span className="font-jakarta" style={{ fontSize: '10px', color: '#666', letterSpacing: '0.18em' }}>ARS</span>
              </div>
            </div>

            {/* 7. CTA */}
            <button
              type="button"
              onClick={handleAddCombo}
              disabled={!perfume1 || !perfume2}
              className="font-jakarta"
              style={{
                display: 'flex', width: '100%', marginTop: '12px', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '14px', background: '#00e5ff', color: '#000',
                border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', cursor: 'pointer', transition: 'opacity 0.3s',
                opacity: (!perfume1 || !perfume2) ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (perfume1 && perfume2) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = (!perfume1 || !perfume2) ? '0.4' : '1'; }}
            >
              {cfg.cta_text} →
            </button>

          </div>{/* end card */}
        </div>{/* end bodyRef single-column */}
      </div>
    </section>
  );
}

// ─── Combo select (native, custom chevron) ─────────────────────────────────────
function ComboSelect({ label, value, onChange, options, optionLabel }) {
  return (
    <div style={{ textAlign: 'left' }}>
      <label className="font-jakarta" style={{ display: 'block', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="font-jakarta sol-combo-select"
          style={{
            width: '100%', minHeight: '42px',
            padding: '10px 40px 10px 14px',
            background: 'rgba(255,255,255,0.7)', color: '#1a1a1a',
            border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 0,
            fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
            appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
            cursor: 'pointer', outline: 'none',
          }}
        >
          {options.map((p) => (
            <option key={p.id} value={p.id}>{optionLabel(p)}</option>
          ))}
        </select>
        <span aria-hidden style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#00e5ff', display: 'flex' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
    </div>
  );
}

// ─── Combo collection showcase ─────────────────────────────────────────────────
function ComboCollectionShowcase({ settings, compact = false, maxWidth = 540 }) {
  const cfg = settings || normalizeComboSettings(null);
  const radius = compact ? 16 : 30;
  const img1 = resolveComboImage(cfg.image_1);
  const img2 = resolveComboImage(cfg.image_2);
  const slides = [
    img1 ? { src: img1, alt: 'Colección completa Solution' } : null,
    img2 ? { src: img2, alt: 'Colección completa Solution' } : null,
  ].filter(Boolean);
  const hasRotation = slides.length > 1;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!hasRotation) return undefined;
    const interval = window.setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [hasRotation, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: compact ? `clamp(200px, 60vw, ${maxWidth}px)` : maxWidth, margin: '0 auto' }}>
      <motion.div
        style={{ position: 'absolute', inset: 0, borderRadius: radius, filter: 'blur(70px)', background: 'radial-gradient(circle at center, rgba(0,229,255,0.12) 0%, rgba(0,0,0,0) 78%)' }}
        animate={{ opacity: [0.12, 0.18, 0.12], scale: [0.985, 1.02, 0.985] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden', borderRadius: radius, border: '0.5px solid var(--sol-line)', background: '#050505', boxShadow: compact ? '0 14px 36px rgba(0,0,0,0.4)' : '0 24px 70px rgba(0,0,0,0.44)' }}>
        <div style={{ position: 'relative', aspectRatio: '4/5', overflow: 'hidden' }}>
          {slides.map((slide, index) => (
            <motion.div key={slide.src} style={{ position: 'absolute', inset: 0 }} initial={false}
              animate={{ opacity: activeIndex === index ? 1 : 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.img src={slide.src} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.12)', filter: 'blur(22px)', opacity: 0.28 }} draggable={false} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.28)' }} />
              <div style={{ position: 'absolute', inset: 0 }}>
                <motion.img src={slide.src} alt={slide.alt} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
                  animate={{ scale: activeIndex === index ? 1.01 : 1.02 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  draggable={false}
                />
              </div>
            </motion.div>
          ))}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.10) 0%,rgba(0,0,0,0.04) 38%,rgba(0,0,0,0.22) 100%)', pointerEvents: 'none' }} />
          {!compact && cfg.showcase_title && (
            <div style={{ position: 'absolute', top: 16, left: 16, borderRadius: 100, border: '0.5px solid var(--sol-line)', background: 'rgba(0,0,0,0.35)', padding: '6px 14px', backdropFilter: 'blur(8px)' }}>
              <p className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                {cfg.showcase_title}
              </p>
            </div>
          )}
          {!compact && cfg.showcase_subtitle && (
            <div style={{ position: 'absolute', bottom: 16, left: 16, borderRadius: 100, border: '0.5px solid rgba(224,64,251,0.4)', background: 'rgba(224,64,251,0.15)', padding: '6px 14px', backdropFilter: 'blur(8px)' }}>
              <p className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#e040fb' }}>
                {cfg.showcase_subtitle}
              </p>
            </div>
          )}
          {!compact && hasRotation && (
            <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 100, border: '0.5px solid var(--sol-line)', background: 'rgba(0,0,0,0.35)', padding: '6px 12px', backdropFilter: 'blur(8px)' }}>
              {slides.map((_, index) => (
                <motion.span key={index} style={{ display: 'block', height: 5, borderRadius: 100 }}
                  animate={{ width: activeIndex === index ? 18 : 6, opacity: activeIndex === index ? 1 : 0.35, backgroundColor: activeIndex === index ? '#fff' : 'rgba(255,255,255,0.6)' }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
