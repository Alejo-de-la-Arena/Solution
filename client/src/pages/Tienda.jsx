import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useReveal } from '../hooks/useReveal';
import { getPublicProducts, productToPerfume } from '../services/products';
import { ACCENT_COLORS } from '../lib/accentColors';
import { getComboProfile, normalizeComboKey } from '../data/comboProfiles';
import { mediaUrl } from '../lib/mediaUrl';
import { getStoreProductImages } from '../lib/storeProductImages';
import { useCart } from '../contexts/CartContext';

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
    reference:  'Acqua Di Gio',
    momento:    'Gym',
    dotColor:   '#0dd3b8',
    notes:      ['Acuático', 'Bergamota', 'Pachulí'],
    featured:   false,
  },
};

const FILTER_PILLS = [
  { key: 'all',      label: 'Todas',    dot: 'var(--sol-ink-dim)' },
  { key: 'noche',    label: 'Noche',    dot: '#c0392b' },
  { key: 'salida',   label: 'Salida',   dot: '#888888' },
  { key: 'dia',      label: 'Día',      dot: '#e6a72f' },
  { key: 'trabajo',  label: 'Trabajo',  dot: '#378add' },
  { key: 'gym',      label: 'Gym',      dot: '#0dd3b8' },
];

function momentoKey(slug) {
  const m = SLUG_META[slug]?.momento || '';
  return m.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Tienda() {
  const [perfumes, setPerfumes]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [selectedPerfume1, setSelectedPerfume1] = useState(null);
  const [selectedPerfume2, setSelectedPerfume2] = useState(null);
  const [altView, setAltView]                 = useState(false);
  const [activeFilter, setActiveFilter]       = useState('all');

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

  // Auto-switch de imagen para todo el listado
  useEffect(() => {
    const id = window.setInterval(() => { setAltView(v => !v); }, 6500);
    return () => window.clearInterval(id);
  }, []);

  const perfume1 = perfumes.find(p => p.id === selectedPerfume1);
  const perfume2 = perfumes.find(p => p.id === selectedPerfume2);

  const visiblePerfumes = activeFilter === 'all'
    ? perfumes
    : perfumes.filter(p => momentoKey(p.slug) === activeFilter);

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
      <MomentFilter
        pills={FILTER_PILLS}
        active={activeFilter}
        onChange={setActiveFilter}
        count={visiblePerfumes.length}
      />

      {/* Product list */}
      <section style={{ borderBottom: '0.5px solid var(--sol-line)' }}>
        {visiblePerfumes.length === 0 ? (
          <div style={{ padding: '80px var(--sol-section-px)', textAlign: 'center' }}>
            <p className="font-jakarta" style={{ fontSize: '13px', color: 'var(--sol-muted)', letterSpacing: '0.1em' }}>
              Sin fragancias para este momento.
            </p>
          </div>
        ) : (
          visiblePerfumes.map((perfume, index) => (
            <ProductCard key={perfume.id} perfume={perfume} index={index} altView={altView} />
          ))
        )}
      </section>

      {perfumes.length >= 2 && (
        <TiendaComboSection
          perfumes={perfumes}
          selectedPerfume1={selectedPerfume1}
          setSelectedPerfume1={setSelectedPerfume1}
          selectedPerfume2={selectedPerfume2}
          setSelectedPerfume2={setSelectedPerfume2}
          perfume1={perfume1}
          perfume2={perfume2}
        />
      )}
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────
function TiendaHero() {
  const headRef = useReveal();
  const subRef  = useReveal();
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
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-magenta)' }}>§ 02</div>
        </div>

        {/* Headline */}
        <h1
          className="font-jost"
          style={{ fontWeight: 300, fontSize: 'clamp(36px, 9vw, 72px)', lineHeight: 1.0, letterSpacing: '-0.03em', color: 'var(--sol-ink)', marginBottom: '24px' }}
        >
          Cinco<br />fragancias.<br />
          <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>Tu momento.</em>
        </h1>

        {/* Sub */}
        <div ref={subRef} className="sol-reveal" style={{ maxWidth: 480, marginBottom: '48px' }}>
          <p className="font-jakarta" style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--sol-muted)' }}>
            Cada perfume sigue la línea de una referencia de nicho reconocida. Elegís el momento, nosotros te decimos cuál usar. Sin marketing vacío.
          </p>
        </div>

        {/* Stats strip */}
        <div ref={statsRef} className="sol-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '0.5px solid var(--sol-line)', paddingTop: '28px', gap: '16px' }}>
          {[
            { n: '05', l: 'Fragancias\nactivas' },
            { n: '100ml', l: 'Eau de\nParfum' },
            { n: '30d', l: 'Garantía\ntotal' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: i === 1 ? 'center' : i === 2 ? 'right' : 'left' }}>
              <div className="font-jost" style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--sol-ink)', lineHeight: 1 }}>
                {s.n}
              </div>
              <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginTop: '6px', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

// ─── Moment filter pills ───────────────────────────────────────────────────────
function MomentFilter({ pills, active, onChange, count }) {
  return (
    <div style={{ borderBottom: '0.5px solid var(--sol-line)', background: 'var(--sol-bg)', position: 'sticky', top: 'calc(var(--sol-nav-h, 56px) + var(--sol-ticker-h, 40px))', zIndex: 10 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px var(--sol-section-px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 1, minWidth: 0 }}>
          {pills.map(pill => {
            const isActive = pill.key === active;
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => onChange(pill.key)}
                className="font-jakarta"
                style={{
                  flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px',
                  fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase',
                  background: isActive ? 'var(--sol-green)' : 'transparent',
                  color: isActive ? 'var(--sol-bg)' : 'var(--sol-ink-dim)',
                  border: `0.5px solid ${isActive ? 'var(--sol-green)' : 'var(--sol-line-mid)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s var(--sol-ease)',
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? 'var(--sol-bg)' : pill.dot, flexShrink: 0 }} />
                {pill.label}
              </button>
            );
          })}
        </div>
        <div className="font-jakarta" style={{ flexShrink: 0, fontSize: '10px', letterSpacing: '0.18em', color: 'var(--sol-muted)', whiteSpace: 'nowrap' }}>
          {count} {count === 1 ? 'fragancia' : 'fragancias'}
        </div>
      </div>
    </div>
  );
}

// ─── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ perfume, index, altView }) {
  const { addToCart } = useCart();
  const slug     = (perfume.slug || '').trim().toLowerCase();
  const meta     = SLUG_META[slug] || {};
  const accent   = perfume.accent_color || ACCENT_COLORS[index] || 'var(--sol-green)';
  const accentGlow = `${accent}22`;
  const isFeatured = meta.featured || slug === 'red-desire';
  const price    = perfume.price ? `$${Number(perfume.price).toLocaleString('es-AR')}` : '';
  const idx      = String(index + 1).padStart(2, '0');
  const notes    = meta.notes || [];
  const cardRef  = useReveal();

  return (
    <article
      ref={cardRef}
      className="sol-reveal"
      style={{
        borderBottom: '0.5px solid var(--sol-line)',
        background: 'var(--sol-bg)',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 'var(--sol-section-py) var(--sol-section-px)' }}>

        {/* Top row: index + momento */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
            N°/{idx} — F26
          </div>
          <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-ink-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dotColor || accent, boxShadow: `0 0 0 1px rgba(0,0,0,0.4)` }} />
            {meta.momento || ''}
          </div>
        </div>

        {/* Product name */}
        <div style={{ marginBottom: '10px' }}>
          <h2 className="font-jost" style={{
            fontWeight: 300, fontSize: 'clamp(36px, 9vw, 64px)', lineHeight: 1,
            letterSpacing: '-0.03em', color: 'var(--sol-ink)',
          }}>
            {perfume.name}<em style={{ fontStyle: 'italic', color: accent }}>.</em>
          </h2>
          {meta.subtitle && (
            <p className="font-jost" style={{ fontStyle: 'italic', fontWeight: 300, fontSize: '15px', color: 'var(--sol-ink-dim)', marginTop: '6px' }}>
              {meta.subtitle}
            </p>
          )}
        </div>

        {/* Reference — prominently styled with accent */}
        {meta.reference && (
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', marginBottom: '28px',
              border: `0.5px solid ${accent}55`,
              background: accentGlow,
              position: 'relative', overflow: 'hidden',
            }}
          >
            <span style={{ color: accent, fontSize: '12px', lineHeight: 1 }}>→</span>
            <span className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
              Referencia:
            </span>
            <span className="font-jost" style={{ fontSize: '14px', fontWeight: 500, color: accent, letterSpacing: '-0.01em' }}>
              {meta.reference}
            </span>
          </div>
        )}

        {/* "Más vendido" badge */}
        {isFeatured && (
          <div style={{ marginBottom: '16px' }}>
            <span className="font-jakarta" style={{
              display: 'inline-block',
              fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase',
              background: 'var(--sol-magenta)', color: 'var(--sol-bg)',
              padding: '5px 10px', fontWeight: 600,
            }}>
              Más vendido
            </span>
          </div>
        )}

        {/* Desktop: 2-col layout (image left, info right) */}
        <div className="sol-prod-tienda-grid">

          {/* Image */}
          <div>
            <PerfumeStoreImage perfume={perfume} accentColor={accent} altView={altView} />
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: '8px' }}>

            {/* Notes tags */}
            {notes.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '32px' }}>
                {notes.map(note => (
                  <span key={note} className="font-jakarta" style={{
                    fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: 'var(--sol-ink-dim)', border: '0.5px solid var(--sol-line-mid)',
                    padding: '6px 12px',
                  }}>
                    {note}
                  </span>
                ))}
              </div>
            )}

            {/* Price + buy */}
            <div style={{ borderTop: '0.5px solid var(--sol-line)', paddingTop: '24px' }}>
              {/* Price */}
              <div style={{ marginBottom: '6px' }}>
                <span className="font-jost" style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 300, letterSpacing: '-0.025em', color: 'var(--sol-ink)' }}>
                  {price}
                </span>
                <span className="font-jakarta" style={{ fontSize: '10px', color: 'var(--sol-muted)', letterSpacing: '0.18em', marginLeft: '6px' }}>ARS</span>
              </div>
              <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '20px' }}>
                100ml · Eau de Parfum · 12 cuotas sin interés
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => addToCart(perfume)}
                  className="font-jakarta"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '16px', background: accent, color: 'var(--sol-bg)',
                    border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em',
                    textTransform: 'uppercase', cursor: 'pointer', transition: 'opacity 0.3s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <svg style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none', strokeWidth: 1.5 }} viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Agregar al carrito
                </button>
                <Link
                  to={`/producto/${perfume.id}`}
                  className="font-jakarta"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '14px', background: 'transparent',
                    border: `0.5px solid var(--sol-line-mid)`,
                    color: 'var(--sol-ink-dim)', fontSize: '11px', letterSpacing: '0.18em',
                    textTransform: 'uppercase', textDecoration: 'none',
                    transition: 'border-color 0.3s, color 0.3s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sol-line-mid)'; e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                >
                  Ver detalles →
                </Link>
              </div>

              {/* Trust mini */}
              <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>Envío 48h</span>
                <span style={{ color: 'var(--sol-line-mid)' }}>·</span>
                <span>Garantía 30 días</span>
                <span style={{ color: 'var(--sol-line-mid)' }}>·</span>
                <span style={{ color: 'var(--sol-green)' }}>● En stock</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </article>
  );
}

// ─── Product image (unchanged logic from original) ─────────────────────────────
function PerfumeStoreImage({ perfume, accentColor, altView }) {
  const [defaultError, setDefaultError] = useState(false);
  const [altError, setAltError]         = useState(false);

  const productImages = getStoreProductImages(perfume);
  const defaultSrc    = productImages?.default ? mediaUrl(productImages.default) : null;
  const altSrc        = productImages?.hover   ? mediaUrl(productImages.hover)   : null;
  const hasAlt        = Boolean(altSrc);
  const showAlt       = Boolean(altView && hasAlt && !altError);
  const isBlackCode   = (perfume.slug || '').trim().toLowerCase() === 'black-code';
  const baseScale     = isBlackCode ? 0.985 : 1;
  const activeScale   = showAlt ? (isBlackCode ? 1.01 : 1.015) : baseScale;
  const inactiveScale = showAlt ? baseScale : (isBlackCode ? 1.01 : 1.04);

  if (!defaultSrc) {
    return (
      <div style={{
        aspectRatio: '4/5', background: 'linear-gradient(180deg,#111 0%,#050505 100%)',
        border: '0.5px solid var(--sol-line)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        maxWidth: 420, margin: '0 auto',
      }}>
        <p className="font-jakarta" style={{ fontSize: '11px', color: 'var(--sol-muted)', letterSpacing: '0.16em' }}>Imagen no configurada</p>
      </div>
    );
  }

  return (
    <Link to={`/producto/${perfume.id}`} className="group block" style={{ display: 'block', maxWidth: 420, margin: '0 auto' }}>
      <motion.div style={{ position: 'relative', width: '100%' }} initial={false}>
        {/* Glow */}
        <motion.div
          style={{ position: 'absolute', inset: 0, filter: 'blur(58px)', backgroundColor: accentColor, borderRadius: 28 }}
          animate={{ opacity: showAlt ? 0.22 : 0.16, scale: showAlt ? 1.0 : 0.94 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Card */}
        <motion.div
          style={{ position: 'relative', zIndex: 1, aspectRatio: '4/5', overflow: 'hidden', borderRadius: 28, border: '1px solid rgba(255,255,255,0.1)', background: '#080808' }}
          animate={{ borderColor: `${accentColor}AA`, boxShadow: showAlt ? `0 22px 70px rgba(0,0,0,0.52), 0 0 24px ${accentColor}14` : '0 16px 48px rgba(0,0,0,0.38)' }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Inner glow */}
          <motion.div
            style={{ position: 'absolute', bottom: '6%', left: '18%', right: '18%', height: '24%', borderRadius: '50%', filter: 'blur(56px)', backgroundColor: accentColor, pointerEvents: 'none' }}
            animate={{ opacity: showAlt ? 0.2 : 0.14, scale: showAlt ? 1.04 : 1 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Base image */}
          {!defaultError && (
            <motion.img
              src={defaultSrc} alt={perfume.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
              animate={{ opacity: showAlt ? 0 : 1, scale: showAlt ? inactiveScale : activeScale, filter: showAlt ? 'blur(2px)' : 'blur(0px)' }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onError={() => setDefaultError(true)}
            />
          )}
          {/* Alt image */}
          {altSrc && !altError && (
            <motion.img
              src={altSrc} alt={`${perfume.name} combo`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy" initial={false}
              animate={{ opacity: showAlt ? 1 : 0, scale: showAlt ? activeScale : inactiveScale, filter: showAlt ? 'blur(0px)' : 'blur(2px)' }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onError={() => setAltError(true)}
            />
          )}
          {/* Overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.10) 0%,rgba(0,0,0,0.03) 38%,rgba(0,0,0,0.18) 100%)', pointerEvents: 'none' }} />
          {/* Thumb preview */}
          {hasAlt && (
            <div style={{ position: 'absolute', bottom: 16, right: 16, pointerEvents: 'none' }}>
              <div style={{ borderRadius: 18, border: '1px solid rgba(0,0,0,0.5)', background: 'rgba(0,0,0,0.45)', overflow: 'hidden', backdropFilter: 'blur(8px)', boxShadow: '0 18px 40px rgba(0,0,0,0.45)' }}>
                <div style={{ position: 'relative', width: 56, height: 56 }}>
                  <img src={showAlt ? defaultSrc : altSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} draggable={false} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.06) 0%,rgba(0,0,0,0.26) 100%)' }} />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </Link>
  );
}

// ─── Combo section ─────────────────────────────────────────────────────────────
function TiendaComboSection({ perfumes, selectedPerfume1, setSelectedPerfume1, selectedPerfume2, setSelectedPerfume2, perfume1, perfume2 }) {
  const { addToCart } = useCart();
  const headRef = useReveal();
  const bodyRef = useReveal();

  const handleAddCombo = () => {
    if (perfume1) addToCart(perfume1);
    if (perfume2) addToCart(perfume2);
  };

  const comboProfile    = getComboProfile(selectedPerfume1, selectedPerfume2);
  const comboProfileKey = comboProfile
    ? normalizeComboKey(selectedPerfume1, selectedPerfume2)
    : `${selectedPerfume1 || 'empty'}__${selectedPerfume2 || 'empty'}`;

  const SEC = { borderBottom: '0.5px solid var(--sol-line)' };

  return (
    <section style={{ background: 'var(--sol-bg)', color: 'var(--sol-ink)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 var(--sol-section-px)' }}>

        {/* Head */}
        <div ref={headRef} className="sol-reveal" style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '0.5px solid var(--sol-line)' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-green)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
            Oferta especial · Combo
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '16px' }}>
            <h2 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(28px, 7vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.025em', color: 'var(--sol-ink)' }}>
              Dos perfumes,<br />
              <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>tu ritual.</em>
            </h2>
            <div className="font-jakarta" style={{ flexShrink: 0, fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-magenta)' }}>§ 03</div>
          </div>
          <p className="font-jakarta" style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--sol-muted)', marginTop: '16px', maxWidth: 480 }}>
            Armá tu combo con dos fragancias de la colección. Envío gratis a todo el país y 3 cuotas sin interés.
          </p>
        </div>

        {/* Builder + profile */}
        <div ref={bodyRef} className="sol-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>

          {/* Slot 1 */}
          <div>
            <div className="font-jakarta" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', border: '0.5px solid var(--sol-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sol-green)', fontSize: '9px', flexShrink: 0 }}>1</span>
              Primera fragancia
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {perfumes.map((p, idx) => {
                const ac = p.accent_color || ACCENT_COLORS[idx];
                const slug = (p.slug || '').trim().toLowerCase();
                const meta = SLUG_META[slug] || {};
                const isSelected = selectedPerfume1 === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setSelectedPerfume1(p.id)}
                    className="font-jakarta"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', fontSize: '10px', letterSpacing: '0.16em',
                      textTransform: 'uppercase', cursor: 'pointer',
                      background: isSelected ? ac : 'transparent',
                      color: isSelected ? 'var(--sol-bg)' : 'var(--sol-ink-dim)',
                      border: `0.5px solid ${isSelected ? ac : 'var(--sol-line-mid)'}`,
                      transition: 'all 0.25s var(--sol-ease)',
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'var(--sol-bg)' : meta.dotColor || ac, flexShrink: 0 }} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot 2 */}
          <div style={{ borderTop: '0.5px solid var(--sol-line)', paddingTop: '24px' }}>
            <div className="font-jakarta" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', border: '0.5px solid var(--sol-line-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sol-ink-dim)', fontSize: '9px', flexShrink: 0 }}>2</span>
              Segunda fragancia
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {perfumes.map((p, idx) => {
                const ac = p.accent_color || ACCENT_COLORS[idx];
                const slug = (p.slug || '').trim().toLowerCase();
                const meta = SLUG_META[slug] || {};
                const isSelected = selectedPerfume2 === p.id;
                return (
                  <button key={p.id} type="button" onClick={() => setSelectedPerfume2(p.id)}
                    className="font-jakarta"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', fontSize: '10px', letterSpacing: '0.16em',
                      textTransform: 'uppercase', cursor: 'pointer',
                      background: isSelected ? ac : 'transparent',
                      color: isSelected ? 'var(--sol-bg)' : 'var(--sol-ink-dim)',
                      border: `0.5px solid ${isSelected ? ac : 'var(--sol-line-mid)'}`,
                      transition: 'all 0.25s var(--sol-ease)',
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'var(--sol-bg)' : meta.dotColor || ac, flexShrink: 0 }} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Profile */}
          <div style={{ borderTop: '0.5px solid var(--sol-line)', paddingTop: '32px' }}>
            <motion.div
              key={comboProfileKey}
              initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {comboProfile ? (
                <div>
                  <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '10px' }}>
                    Perfil de la combinación
                  </div>
                  <h3 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(22px, 5vw, 32px)', letterSpacing: '-0.02em', color: 'var(--sol-ink)', marginBottom: '12px' }}>
                    {comboProfile.nickname}
                  </h3>
                  <p className="font-jost" style={{ fontStyle: 'italic', fontSize: '16px', color: 'var(--sol-ink-dim)', marginBottom: '16px' }}>
                    {comboProfile.summary}
                  </p>
                  {comboProfile.description?.map((par, i) => (
                    <p key={i} className="font-jakarta" style={{ fontSize: i === 0 ? '14px' : '12px', lineHeight: 1.7, color: i === 0 ? 'var(--sol-ink-dim)' : 'var(--sol-muted)', marginBottom: '10px' }}>
                      {par}
                    </p>
                  ))}
                </div>
              ) : (
                <div>
                  <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '10px' }}>
                    Perfil de la combinación
                  </div>
                  <h3 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(20px, 4vw, 28px)', color: 'var(--sol-ink-dim)', marginBottom: '12px' }}>
                    Combiná dos fragancias
                  </h3>
                  <p className="font-jakarta" style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--sol-muted)' }}>
                    Seleccioná dos perfumes distintos para descubrir el subtítulo y descripción completa de la combinación.
                  </p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Price + CTA */}
          <div style={{ borderTop: '0.5px solid var(--sol-line)', paddingTop: '28px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {[
                'X2 perfumes a elección',
                'Envío gratis a todo el país',
                '3 cuotas sin interés',
              ].map(item => (
                <span key={item} className="font-jakarta" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sol-ink-dim)', border: '0.5px solid var(--sol-line)', padding: '5px 10px' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sol-green)', flexShrink: 0 }} />
                  {item}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
              <span className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(32px, 7vw, 48px)', letterSpacing: '-0.025em', color: 'var(--sol-ink)', lineHeight: 1 }}>
                {perfume1 && perfume2 ? `$${(perfume1.price + perfume2.price).toLocaleString('es-AR')}` : '—'}
              </span>
              <span className="font-jakarta" style={{ fontSize: '10px', color: 'var(--sol-muted)', letterSpacing: '0.18em' }}>ARS</span>
            </div>

            <button
              type="button"
              onClick={handleAddCombo}
              disabled={!perfume1 || !perfume2}
              className="font-jakarta"
              style={{
                display: 'flex', width: '100%', maxWidth: 480, alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '18px', background: 'var(--sol-green)', color: 'var(--sol-bg)',
                border: 'none', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', cursor: 'pointer', transition: 'opacity 0.3s',
                opacity: (!perfume1 || !perfume2) ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (perfume1 && perfume2) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = (!perfume1 || !perfume2) ? '0.4' : '1'; }}
            >
              Agregar combo al carrito →
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}

// ─── Combo collection showcase (preserved from original) ──────────────────────
function ComboCollectionShowcase() {
  const slides = [
    { src: mediaUrl('all-products/large/all-perfumes-vidrio.webp'), alt: 'Colección completa Solution en vidrio' },
    { src: mediaUrl('all-products/large/perfumes.webp'), alt: 'Colección completa Solution' },
  ];
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [slides.length]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 540, margin: '0 auto' }}>
      <motion.div
        style={{ position: 'absolute', inset: 0, borderRadius: 30, filter: 'blur(70px)', background: 'radial-gradient(circle at center, rgba(0,229,255,0.12) 0%, rgba(0,0,0,0) 78%)' }}
        animate={{ opacity: [0.12, 0.18, 0.12], scale: [0.985, 1.02, 0.985] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden', borderRadius: 30, border: '0.5px solid var(--sol-line)', background: '#050505', boxShadow: '0 24px 70px rgba(0,0,0,0.44)' }}>
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
          <div style={{ position: 'absolute', top: 16, left: 16, borderRadius: 100, border: '0.5px solid var(--sol-line)', background: 'rgba(0,0,0,0.35)', padding: '6px 14px', backdropFilter: 'blur(8px)' }}>
            <p className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
              Colección completa
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: '6px', borderRadius: 100, border: '0.5px solid var(--sol-line)', background: 'rgba(0,0,0,0.35)', padding: '6px 12px', backdropFilter: 'blur(8px)' }}>
            {slides.map((_, index) => (
              <motion.span key={index} style={{ display: 'block', height: 5, borderRadius: 100 }}
                animate={{ width: activeIndex === index ? 18 : 6, opacity: activeIndex === index ? 1 : 0.35, backgroundColor: activeIndex === index ? '#fff' : 'rgba(255,255,255,0.6)' }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
