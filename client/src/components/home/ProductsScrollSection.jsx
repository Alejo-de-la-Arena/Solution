import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProducts, productToPerfume } from '../../services/products';
import { useReveal } from '../../hooks/useReveal';

// ─── Hardcoded por decisión del cliente ───────────────────────────────────────
const REFERENCIAS = {
  'red-desire':   'Stronger with you',
  'black-code':   'Creed Aventus',
  'deep-blue':    'Bleu de Chanel',
  'yellow-bloom': 'Erba Pura',
  'white-ice':    'Acqua Di Gio',
};

const PRODUCT_META = {
  'red-desire':   { momento: 'Noche',   dotColor: '#c0392b', btl1: '#3a1612', btl2: '#1a0907' },
  'black-code':   { momento: 'Salida',  dotColor: '#888888', btl1: '#1a1a1c', btl2: '#070708' },
  'yellow-bloom': { momento: 'Día',     dotColor: '#e6a72f', btl1: '#3a2e10', btl2: '#1a1207' },
  'deep-blue':    { momento: 'Trabajo', dotColor: '#378add', btl1: '#0f2236', btl2: '#060c14' },
  'white-ice':    { momento: 'Gym',     dotColor: '#0dd3b8', btl1: '#1a2624', btl2: '#080d0c' },
};

const BADGE_SLUG   = 'red-desire';
const CARD_WIDTH   = 260;
const CARD_GAP     = 12;

// ─── Registration corner marks ───────────────────────────────────────────────
function RegMarks() {
  const base = { position: 'absolute', width: '10px', height: '10px', borderColor: 'var(--sol-muted-2)', borderStyle: 'solid' };
  return (
    <>
      <span aria-hidden style={{ ...base, top: 8, left: 8,  borderWidth: '0.5px 0 0 0.5px' }} />
      <span aria-hidden style={{ ...base, top: 8, right: 8, borderWidth: '0.5px 0.5px 0 0' }} />
      <span aria-hidden style={{ ...base, bottom: 8, left: 8,  borderWidth: '0 0 0.5px 0.5px' }} />
      <span aria-hidden style={{ ...base, bottom: 8, right: 8, borderWidth: '0 0.5px 0.5px 0' }} />
    </>
  );
}

// ─── CSS bottle placeholder ───────────────────────────────────────────────────
function CSSBottle({ name, btl1, btl2 }) {
  return (
    <div
      className="sol-bottle"
      style={{
        position: 'relative',
        width: '56%',
        height: '78%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.55))',
        transition: 'transform 0.6s var(--sol-ease)',
      }}
    >
      {/* Cap */}
      <div style={{ width: '38%', height: '14%', background: 'linear-gradient(180deg,#2a2a2a,#161616)', border: '0.5px solid rgba(244,241,236,0.06)', borderRadius: '2px 2px 0 0' }} />
      {/* Neck */}
      <div style={{ width: '22%', height: '6%', background: 'linear-gradient(180deg,#1a1a1a,#0e0e0e)' }} />
      {/* Body */}
      <div
        className="sol-bottle-body"
        style={{
          width: '100%',
          flex: 1,
          background: `linear-gradient(160deg, ${btl1} 0%, ${btl2} 60%, #0a0907 100%)`,
          border: '0.5px solid rgba(244,241,236,0.06)',
          borderRadius: '2px',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          position: 'relative',
        }}
      >
        <div
          className="font-jost"
          style={{
            position: 'absolute',
            top: '38%', left: '50%',
            transform: 'translateX(-50%)',
            width: '70%',
            textAlign: 'center',
            color: 'var(--sol-ink)',
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            opacity: 0.92,
          }}
        >
          {name.replace(' ', '\n')}
          <small
            className="font-jmono"
            style={{ display: 'block', fontSize: '7px', letterSpacing: '0.22em', color: 'var(--sol-ink-dim)', marginTop: '3px', opacity: 0.7 }}
          >
            EDP · 100ML
          </small>
        </div>
      </div>
    </div>
  );
}

// ─── Single product card ──────────────────────────────────────────────────────
function ProductCard({ product }) {
  const meta = PRODUCT_META[product.slug] || { momento: product.usage || '', dotColor: product.accent_color || '#888', btl1: '#1a1a1a', btl2: '#0a0a0a' };
  const referencia = REFERENCIAS[product.slug] || '';
  const price = product.price ? `$${Number(product.price).toLocaleString('es-AR')}` : '';
  const isFeatured = product.slug === BADGE_SLUG;

  return (
    <Link
      to={`/producto/${product.slug}`}
      className="sol-prod-card"
      style={{
        flex: `0 0 ${CARD_WIDTH}px`,
        scrollSnapAlign: 'start',
        background: 'var(--sol-bg-card)',
        border: `0.5px solid ${isFeatured ? 'var(--sol-green-dim)' : 'var(--sol-line)'}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.4s var(--sol-ease)',
      }}
      aria-label={`Ver ${product.name}`}
    >
      {/* Badge */}
      {isFeatured && (
        <span
          className="font-jmono"
          style={{
            position: 'absolute', top: '12px', right: '12px',
            fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase',
            background: 'var(--sol-green)', color: 'var(--sol-bg)',
            padding: '4px 8px', fontWeight: 500, zIndex: 2,
          }}
        >
          Más vendido
        </span>
      )}

      {/* Momento tag */}
      <span
        className="font-jmono"
        style={{
          position: 'absolute', top: '12px', left: '12px',
          fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--sol-ink-dim)',
          display: 'flex', alignItems: 'center', gap: '6px',
          zIndex: 2,
        }}
      >
        <span
          style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.dotColor, boxShadow: '0 0 0 1px rgba(0,0,0,0.35)', flexShrink: 0 }}
          aria-hidden
        />
        {meta.momento}
      </span>

      {/* Image / CSS bottle */}
      <div
        style={{
          width: '100%',
          aspectRatio: '3/4',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg,#0e0e0e 0%,#060606 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <RegMarks />
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
          />
        ) : (
          <CSSBottle name={product.name} btl1={meta.btl1} btl2={meta.btl2} />
        )}
      </div>

      {/* Info */}
      <div
        style={{
          padding: '18px 16px',
          borderTop: '0.5px solid var(--sol-line)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        <div className="font-jost" style={{ fontSize: '17px', fontWeight: 500, color: 'var(--sol-ink)', letterSpacing: '-0.005em' }}>
          {product.name}
        </div>
        <div
          className="font-jmono"
          style={{ fontSize: '9.5px', letterSpacing: '0.18em', color: 'var(--sol-muted)', textTransform: 'uppercase', marginBottom: '14px' }}
        >
          {referencia ? `→ ${referencia}` : ''}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '0.5px solid var(--sol-line)' }}>
          <div className="font-jost" style={{ fontSize: '16px', fontWeight: 400, color: 'var(--sol-ink)' }}>
            {price}
            <small className="font-jmono" style={{ fontSize: '9px', color: 'var(--sol-muted)', letterSpacing: '0.18em', marginLeft: '4px' }}>ARS</small>
          </div>
          <div
            className="sol-prod-add"
            style={{
              width: '32px', height: '32px',
              border: '0.5px solid var(--sol-line-mid)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sol-ink)',
              transition: 'background 0.3s var(--sol-ease), color 0.3s var(--sol-ease), border-color 0.3s var(--sol-ease)',
            }}
            aria-label={`Ver ${product.name}`}
          >
            <svg style={{ width: '12px', height: '12px', stroke: 'currentColor', fill: 'none', strokeWidth: 1.2 }} viewBox="0 0 24 24" aria-hidden>
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      style={{
        flex: `0 0 ${CARD_WIDTH}px`,
        background: 'var(--sol-bg-card)',
        border: '0.5px solid var(--sol-line)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ aspectRatio: '3/4', background: '#111' }} />
      <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ height: '17px', background: 'var(--sol-line-mid)', borderRadius: '2px', width: '60%' }} />
        <div style={{ height: '10px', background: 'var(--sol-line)', borderRadius: '2px', width: '80%' }} />
        <div style={{ height: '16px', background: 'var(--sol-line-mid)', borderRadius: '2px', width: '40%', marginTop: '4px' }} />
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export default function ProductsScrollSection() {
  const [products, setProducts] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef(null);
  const headRef   = useReveal();

  useEffect(() => {
    let cancelled = false;
    getPublicProducts()
      .then((rows) => {
        if (cancelled) return;
        setProducts(rows.map(productToPerfume).filter(Boolean).slice(0, 5));
      })
      .catch(() => { if (!cancelled) setProducts([]); });
    return () => { cancelled = true; };
  }, []);

  // Scroll dots
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.min(
        products.length - 1,
        Math.round(el.scrollLeft / (CARD_WIDTH + CARD_GAP))
      );
      setActiveIdx(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [products.length]);

  const dotCount = products.length || 5;

  return (
    <section
      style={{
        paddingTop: 'var(--sol-section-py)',
        paddingBottom: 'var(--sol-section-py)',
        borderBottom: '0.5px solid var(--sol-line)',
        background: 'var(--sol-bg)',
        color: 'var(--sol-ink)',
      }}
    >
      {/* Section head */}
      <div
        ref={headRef}
        className="sol-reveal"
        style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '40px', padding: '0 var(--sol-section-px)', maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto' }}
      >
        <div>
          <div className="font-jmono" style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
            La colección
          </div>
          <h2 className="font-jost" style={{ fontWeight: 300, fontSize: '30px', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--sol-ink)', marginTop: '12px' }}>
            Cinco fragancias.<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>Cinco momentos.</em>
          </h2>
        </div>
        <div className="font-jmono" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-muted)' }}>§ 02</div>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="sol-scroll"
        style={{
          display: 'flex',
          gap: `${CARD_GAP}px`,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          padding: '0 var(--sol-section-px) 8px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {products.length === 0
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : products.map((p) => <ProductCard key={p.slug} product={p} />)}
      </div>

      {/* Scroll dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px' }}>
        {Array.from({ length: dotCount }).map((_, i) => (
          <span
            key={i}
            style={{
              width: '16px',
              height: '0.5px',
              background: i === activeIdx ? 'var(--sol-green)' : 'var(--sol-line-mid)',
              transition: 'background 0.3s var(--sol-ease)',
              display: 'block',
            }}
          />
        ))}
      </div>

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '24px',
          padding: '0 var(--sol-section-px)',
          maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto',
        }}
      >
        <span className="font-jmono" style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
          Deslizá →
        </span>
        <Link
          to="/tienda"
          className="font-jmono"
          style={{
            fontSize: '10px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--sol-ink)',
            textDecoration: 'none',
            borderBottom: '0.5px solid var(--sol-line-mid)',
            paddingBottom: '4px',
            transition: 'color 0.3s var(--sol-ease), border-color 0.3s var(--sol-ease)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-green)'; e.currentTarget.style.borderColor = 'var(--sol-green)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; e.currentTarget.style.borderColor = 'var(--sol-line-mid)'; }}
        >
          Ver la colección completa
        </Link>
      </div>
    </section>
  );
}
