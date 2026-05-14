import { Link } from 'react-router-dom';
import { useReveal } from '../../hooks/useReveal';

function scrollToBeneficios() {
  document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' });
}

export default function WholesaleHero() {
  const headRef  = useReveal();
  const subRef   = useReveal();
  const statsRef = useReveal();
  const ctaRef   = useReveal();

  return (
    <section
      style={{
        borderBottom: '0.5px solid var(--sol-line)',
        paddingTop: 'calc(var(--sol-nav-h) + var(--sol-ticker-h) + var(--sol-section-py))',
        paddingBottom: 'var(--sol-section-py)',
        background: 'var(--sol-bg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Radial glow accent */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(60% 50% at 80% 60%, rgba(76,175,114,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="sol-container" style={{ padding: '0 var(--sol-section-px)', position: 'relative', zIndex: 1 }}>

        {/* Eyebrow */}
        <div ref={headRef} className="sol-reveal" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
            Programa Mayorista
          </div>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-muted)' }}>§ 03</div>
        </div>

        {/* Headline */}
        <h1
          className="font-jost"
          style={{
            fontWeight: 300,
            fontSize: 'clamp(38px, 9vw, 80px)',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: 'var(--sol-ink)',
            marginBottom: '28px',
          }}
        >
          Vendé Solution<br />
          <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>en tu tienda.</em>
        </h1>

        {/* Sub */}
        <div ref={subRef} className="sol-reveal" style={{ maxWidth: 540, marginBottom: '48px' }}>
          <p className="font-jakarta" style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--sol-muted)' }}>
            Convertite en revendedor oficial y accedé a condiciones exclusivas: márgenes reales, stock garantizado y soporte comercial dedicado.
          </p>
        </div>

        {/* CTAs */}
        <div ref={ctaRef} className="sol-reveal" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '64px' }}>
          <Link
            to="/aplicar-mayorista"
            className="font-jakarta sol-btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 28px',
              background: 'var(--sol-green)', color: 'var(--sol-bg)',
              border: 'none', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              textDecoration: 'none', cursor: 'pointer',
              transition: 'opacity 0.3s var(--sol-ease)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Aplicar ahora
            <span className="sol-arrow">→</span>
          </Link>
          <button
            type="button"
            onClick={scrollToBeneficios}
            className="font-jakarta"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 28px',
              background: 'transparent', color: 'var(--sol-ink-dim)',
              border: '0.5px solid var(--sol-line-mid)', fontSize: '11px',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'border-color 0.3s, color 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--sol-green)'; e.currentTarget.style.color = 'var(--sol-green)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sol-line-mid)'; e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
          >
            Ver beneficios
          </button>
        </div>

        {/* KPI strip */}
        <div ref={statsRef} className="sol-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '0.5px solid var(--sol-line)', paddingTop: '28px', gap: '16px' }}>
          {[
            { n: '40%', l: 'Margen\npromedio' },
            { n: '+120', l: 'Revendedores\nactivos' },
            { n: '48h', l: 'Tiempo\nde despacho' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: i === 1 ? 'center' : i === 2 ? 'right' : 'left' }}>
              <div className="font-jost" style={{ fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--sol-ink)', lineHeight: 1 }}>
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
