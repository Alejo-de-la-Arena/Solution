import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useReveal } from '../hooks/useReveal';
import { getPublicProducts, productToPerfume } from '../services/products';
import { ACCENT_COLORS } from '../lib/accentColors';
import { mediaUrl } from '../lib/mediaUrl';
import { getStoreProductImages } from '../lib/storeProductImages';
import { useCart } from '../contexts/CartContext';
import { getCrossedPrice, CROSSED_PRICES } from '../lib/crossedPrices';
import { getComboSettings, normalizeComboSettings, resolveComboImage } from '../services/combo';
import { getTiendaSettings, normalizeTiendaSettings } from '../services/tiendaSettings';
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

// Slugs de cada fila del slider (labels vienen de tienda_settings)
const SLIDER_ROWS_SLUGS = [
  ['red-desire', 'black-code'],
  ['deep-blue', 'yellow-bloom', 'white-ice'],
];

// ─── Videos de reseñas ──────────────────────────────────────────────────────────
// Sin atar a un perfume específico (la mayoría de reseñas son de Red Desire).
// Formato reel 9:16. Cada video carga sólo al darle play (preload="none"); el
// poster se muestra como imagen estática hasta entonces.
const VIDEO_BASE   = import.meta.env.VITE_R2_BASE_URL || 'https://pub-83d3712d47a849629a299c4d9f15a5b6.r2.dev';
const POSTER_BASE  = 'https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products/video';
const VIDEO_REVIEWS = [
  { id: 'v1', url: `${VIDEO_BASE}/red-desire-1.mp4`, poster: `${POSTER_BASE}/thumbnails/red-desire-1-thumbnail.jpg`, accent: '#FF2D55' },
  { id: 'v2', url: `${VIDEO_BASE}/red-desire-2.mp4`, poster: `${POSTER_BASE}/thumbnails/red-desire-2-thumbnail.jpg`, accent: '#00e5ff' },
  { id: 'v3', url: `${VIDEO_BASE}/red-desire-3.mp4`, poster: `${POSTER_BASE}/thumbnails/red-desire-3-thumbnail.jpg`, accent: '#e6a72f' },
  { id: 'v4', url: `${VIDEO_BASE}/red-desire-4.mp4`, poster: `${POSTER_BASE}/thumbnails/red-desire-4-thumbnail.jpg`, accent: '#378add' },
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
  const [tiendaSettings, setTiendaSettings]   = useState(() => normalizeTiendaSettings(null));

  useEffect(() => {
    let cancelled = false;
    getComboSettings()
      .then((row) => { if (!cancelled) setComboSettings(normalizeComboSettings(row)); })
      .catch(() => { if (!cancelled) setComboSettings(normalizeComboSettings(null)); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTiendaSettings()
      .then((row) => { if (!cancelled) setTiendaSettings(normalizeTiendaSettings(row)); })
      .catch(() => {});
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
      <TiendaHero settings={tiendaSettings} />

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

      <ProductSlidersSection perfumes={perfumes} settings={tiendaSettings} />

      <VideoReviewsSection settings={tiendaSettings} />

      <TestimonialsSection eyebrow={tiendaSettings.testimonios_eyebrow} title={tiendaSettings.testimonios_title} />

      <MomentoSection settings={tiendaSettings} />
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function TiendaHero({ settings }) {
  const headRef = useReveal();
  const statsRef = useReveal();

  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '0.5px solid var(--sol-line)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)', background: 'var(--sol-bg)' }}>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--sol-section-px)', position: 'relative', zIndex: 1 }}>

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
          <span style={{ display: 'block' }}>{settings.hero_title}</span>
          <em style={{ display: 'block', fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>{settings.hero_subtitle}</em>
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
function ProductSlidersSection({ perfumes, settings }) {
  const headRef = useReveal();
  const bySlug = new Map(perfumes.map(p => [(p.slug || '').trim().toLowerCase(), p]));

  const rows = [
    { label: settings.coleccion_row1_label, subtitle: settings.coleccion_row1_subtitle, slugs: SLIDER_ROWS_SLUGS[0] },
    { label: settings.coleccion_row2_label, subtitle: settings.coleccion_row2_subtitle, slugs: SLIDER_ROWS_SLUGS[1] },
  ];

  return (
    <section id="coleccion" style={{ borderBottom: '0.5px solid var(--sol-line)', background: 'var(--sol-bg)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)' }}>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--sol-section-px)' }}>

        {/* Section head */}
        <div ref={headRef} className="sol-reveal" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '12px' }}>
            {settings.coleccion_eyebrow}
          </div>
          <h2 className="font-jost" style={{ fontWeight: 400, fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--sol-ink)' }}>
            {settings.coleccion_title}
          </h2>
        </div>

        {/* Filas */}
        {rows.map((row) => {
          const items = row.slugs.map(s => bySlug.get(s)).filter(Boolean);
          if (items.length === 0) return null;
          return <SliderRow key={row.label} label={row.label} subtitle={row.subtitle} perfumes={items} />;
        })}

      </div>
    </section>
  );
}

function SliderRow({ label, subtitle, perfumes }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="sol-reveal" style={{ marginBottom: '36px' }}>
      <div className="font-jost sol-slider-rowlabel" style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--sol-ink)', marginBottom: subtitle ? '6px' : '18px' }}>
        {label}
      </div>
      {subtitle && (
        <div className="font-jakarta sol-slider-rowlabel" style={{ fontSize: '11px', color: 'var(--sol-ink-dim)', marginBottom: '14px', letterSpacing: '0.04em' }}>
          {subtitle}
        </div>
      )}
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
        background: 'rgba(245, 242, 238, 0.96)',
        border: '0.5px solid rgba(0,0,0,0.08)',
        borderTop: `2px solid ${accent}`,
        borderRadius: '10px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
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
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' }}
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
        <div className="font-jakarta" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#666', marginBottom: '8px' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dotColor || accent, boxShadow: '0 0 0 1px rgba(0,0,0,0.4)', flexShrink: 0 }} />
          {meta.momento || ''}
        </div>

        {/* Nombre */}
        <h3 className="font-jost" style={{ fontSize: 'clamp(20px, 3.4vw, 24px)', fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.01em', color: '#1a1a1a', marginBottom: '6px' }}>
          {perfume.name}<em style={{ fontStyle: 'normal', color: accent }}>.</em>
        </h3>

        {/* Referencia de mercado */}
        {meta.reference && (
          <div className="font-jakarta" style={{ alignSelf: 'flex-start', fontSize: '9px', fontWeight: 600, letterSpacing: '0.06em', color: '#555', background: 'rgba(0,0,0,0.04)', border: '0.5px solid rgba(0,0,0,0.12)', padding: '4px 9px', borderRadius: '4px', marginBottom: '12px' }}>
            <span style={{ color: '#888' }}>→ </span>{meta.reference}
          </div>
        )}

        {/* Precio */}
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {crossed && (
            <span className="font-jakarta" style={{ fontSize: '11px', color: '#888', textDecoration: 'line-through', letterSpacing: '0.04em' }}>
              {crossed}
            </span>
          )}
          <span className="font-jost" style={{ fontSize: 'clamp(18px, 3.4vw, 22px)', fontWeight: 600, letterSpacing: '-0.02em', color: '#1a1a1a' }}>
            {price}
          </span>
          {crossed && (
            <span className="font-jakarta" style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: '#000', background: accent, padding: '2px 7px', borderRadius: '9999px' }}>
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
              border: `0.5px solid ${accent}`, color: '#1a1a1a',
              fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', textDecoration: 'none',
              transition: 'opacity 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            Ver detalles →
          </Link>
          <button
            type="button"
            onClick={() => addToCart(perfume)}
            className="font-jakarta"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', background: accent, color: '#000',
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
function VideoReviewsSection({ settings }) {
  const headRef = useReveal();
  const videoRefs = useRef([]);
  const [startedIds, setStartedIds] = useState([]);

  // Un solo video a la vez: al reproducir uno, pausar todos los demás.
  const handlePlay = (id) => {
    setStartedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    videoRefs.current.forEach((v) => {
      if (v && v.dataset.id !== id && !v.paused) {
        v.pause();
      }
    });
  };

  // Performance: pausar cualquier video que salga del viewport.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const vids = videoRefs.current.filter(Boolean);
    if (vids.length === 0) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !entry.target.paused) {
            entry.target.pause();
          }
        });
      },
      { threshold: 0.35 }
    );
    vids.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, []);

  return (
    <section style={{ borderBottom: '0.5px solid var(--sol-line)', background: 'var(--sol-bg)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)', overflow: 'hidden' }}>
      <div ref={headRef} className="sol-reveal" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--sol-section-px)', textAlign: 'center', marginBottom: '36px' }}>
        <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '12px' }}>
          {settings.videos_eyebrow}
        </div>
        <h2 className="font-jost" style={{ fontWeight: 400, fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--sol-ink)' }}>
          {settings.videos_title} <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>{settings.videos_title_em}</em>.
        </h2>
        {settings.videos_subtitle && (
          <div className="font-jakarta" style={{ fontSize: '12px', color: 'var(--sol-ink-dim)', marginTop: '8px', letterSpacing: '0.04em' }}>
            {settings.videos_subtitle}
          </div>
        )}
        {settings.videos_description && (
          <p className="font-jakarta" style={{ fontSize: '13px', color: 'var(--sol-ink-dim)', marginTop: '6px', lineHeight: 1.6 }}>
            {settings.videos_description}
          </p>
        )}
      </div>

      <div className="sol-container">
        <div className="sol-reel-row">
          {VIDEO_REVIEWS.map((review, index) => (
            <VideoReel
              key={review.id}
              review={review}
              started={startedIds.includes(review.id)}
              onPlay={handlePlay}
              registerRef={(el) => { videoRefs.current[index] = el; }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoReel({ review, started, onPlay, registerRef }) {
  const videoRef = useRef(null);

  const startPlayback = () => {
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  return (
    <div className="sol-reel-card">
      <div style={{ position: 'relative', aspectRatio: '9 / 16', borderRadius: '12px', overflow: 'hidden', border: '0.5px solid var(--sol-line)', background: '#0b0b0b' }}>
        {/* Acento superior */}
        <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: review.accent, zIndex: 3 }} />

        {/* Video: poster estático + sin descarga hasta play (preload="none") */}
        <video
          ref={(el) => { videoRef.current = el; registerRef?.(el); }}
          data-id={review.id}
          src={review.url}
          poster={review.poster}
          controls
          playsInline
          preload="none"
          onPlay={() => onPlay(review.id)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Overlay con poster (imagen liviana, lazy) + botón de play.
            Se oculta de forma definitiva tras el primer play. */}
        {!started && (
          <button
            type="button"
            onClick={startPlayback}
            aria-label="Reproducir video"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, zIndex: 2,
            }}
          >
            <img
              src={review.poster}
              alt=""
              aria-hidden
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span style={{ position: 'relative', zIndex: 2, width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sol-ink)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ¿Cuál es tu momento? — 5 filas con íconos + CTA ────────────────────────────
function MomentoSection({ settings }) {
  const headRef = useReveal();
  const listRef = useReveal();

  return (
    <section style={{ borderBottom: '0.5px solid var(--sol-line)', background: 'var(--sol-bg)', color: 'var(--sol-ink)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 var(--sol-section-px)' }}>

        {/* Head */}
        <div ref={headRef} className="sol-reveal" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '12px' }}>
            {settings.cta_eyebrow}
          </div>
          <h2 className="font-jost" style={{ fontWeight: 400, fontSize: 'clamp(30px, 7vw, 48px)', lineHeight: 1.02, letterSpacing: '-0.03em', color: 'var(--sol-ink)', marginBottom: '14px' }}>
            {settings.cta_title}
          </h2>
          <p className="font-jakarta" style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--sol-ink-dim)' }}>
            {settings.cta_description}
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
                  display: 'flex', alignItems: 'center', gap: 'clamp(14px, 1.6vw, 20px)',
                  background: 'var(--sol-bg-card)', border: '0.5px solid var(--sol-line)',
                  borderRadius: '10px', padding: 'clamp(14px, 1.6vw, 22px) clamp(16px, 1.8vw, 26px)',
                  textDecoration: 'none', color: 'var(--sol-ink)',
                  transition: 'border-color 0.3s var(--sol-ease)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sol-line-str)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sol-line)'; }}
              >
                <span aria-hidden style={{ width: 'clamp(38px, 4vw, 52px)', height: 'clamp(38px, 4vw, 52px)', borderRadius: '50%', background: m.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(16px, 2vw, 22px)', flexShrink: 0 }}>
                  {m.icon}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="font-jakarta" style={{ display: 'block', fontSize: 'clamp(8px, 0.9vw, 11px)', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '3px' }}>
                    {m.tag}
                  </span>
                  <span className="font-jost" style={{ display: 'block', fontSize: 'clamp(16px, 1.9vw, 24px)', fontWeight: 600, lineHeight: 1.1, color: 'var(--sol-ink)' }}>
                    {m.name}<em style={{ fontStyle: 'normal', color: accent }}>.</em>
                  </span>
                  <span className="font-jakarta" style={{ display: 'block', fontSize: 'clamp(10px, 1.1vw, 13px)', color: 'var(--sol-muted)', marginTop: '3px' }}>
                    → {m.reference}
                  </span>
                </span>
                <span aria-hidden className="font-jakarta" style={{ fontSize: 'clamp(14px, 1.5vw, 18px)', color: 'var(--sol-muted)', flexShrink: 0 }}>→</span>
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
    if (perfume1) addToCart({ ...perfume1, combo_tag: 'Combo' });
    if (perfume2) addToCart({ ...perfume2, combo_tag: 'Combo' });
  };

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

        {/* Label — encima de la card, centrado
        <div ref={headRef} className="sol-reveal" style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div className="font-jakarta sol-combo-label" style={{ letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sol-ink)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px' }}>
            🎁 Oferta Día del Padre
          </div>
        </div> */}

        {/* Single-column content */}
        <div ref={bodyRef} className="sol-reveal">

          {/* Card — único bloque: título, slider, perfil, selectores, precio y CTA */}
          <div className="sol-combo-card" style={{ position: 'relative', borderRadius: '16px', margin: '0 auto', width: '100%', padding: '20px 16px', textAlign: 'center', color: '#f0ece6', background: 'linear-gradient(160deg, #050c18 0%, #07111f 100%)', border: '0.5px solid rgba(212,175,55,0.28)', borderTop: '1.5px solid rgba(212,175,55,0.45)', boxShadow: '0 8px 40px rgba(0,0,0,0.38), 0 2px 0 rgba(212,175,55,0.12), 0 0 48px rgba(117,170,219,0.09)' }}>

            {/* 1. Título */}
            <p className="font-jakarta" style={{ fontWeight: 700, fontSize: 'clamp(16px, 3vw, 18px)', letterSpacing: '0.06em', lineHeight: 1.6, textAlign: 'center', color: '#f0ece6', margin: '36px 0 0' }}>
              LLEVÁ 2 PERFUMES SOLUTION<br />
              <span style={{ marginLeft: '-9px' }}>+ PERFUMERO DE REGALO</span><br />
              + ENVÍO GRATIS + 30% OFF
            </p>

            {/* 2. Slider reducido */}
            <div style={{ marginTop: '12px' }}>
              <ComboCollectionShowcase settings={cfg} compact maxWidth={360} />
            </div>

            {/* 3. Selectores */}
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
                  <span className="font-jakarta" style={{ fontSize: '13px', color: 'rgba(240,236,230,0.45)', textDecoration: 'line-through', letterSpacing: '0.04em' }}>
                    ${crossedSum.toLocaleString('es-AR')} ARS
                  </span>
                ) : null;
              })()}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', justifyContent: 'center' }}>
                <span className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(30px, 7vw, 42px)', letterSpacing: '-0.025em', color: '#f0ece6', lineHeight: 1 }}>
                  {perfume1 && perfume2 ? `$${(perfume1.price + perfume2.price).toLocaleString('es-AR')}` : '—'}
                </span>
                <span className="font-jakarta" style={{ fontSize: '10px', color: 'rgba(240,236,230,0.4)', letterSpacing: '0.18em' }}>ARS</span>
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
      <label className="font-jakarta" style={{ display: 'block', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(240,236,230,0.45)', marginBottom: '8px' }}>
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
            background: 'rgba(255,255,255,0.09)', color: '#f0ece6',
            border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: 0,
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
    <div style={{ position: 'relative', width: '100%', maxWidth: compact ? `clamp(260px, 82vw, ${maxWidth}px)` : maxWidth, margin: '0 auto' }}>
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
