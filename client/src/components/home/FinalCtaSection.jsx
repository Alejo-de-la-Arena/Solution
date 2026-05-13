import { Link } from 'react-router-dom';
import { useReveal } from '../../hooks/useReveal';

export default function FinalCtaSection() {
  const innerRef = useReveal();

  return (
    <section
      className="sol-cta-final"
      style={{
        textAlign: 'center',
        background: 'var(--sol-bg)',
        color: 'var(--sol-ink)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="sol-container"
        style={{ padding: 'var(--sol-section-py) var(--sol-section-px)' }}
      >
        <div ref={innerRef} className="sol-reveal" style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <div
            className="font-jakarta sol-cta-eyebrow"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '9px',
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--sol-muted)',
              marginBottom: '32px',
              position: 'relative',
            }}
          >
            El perfume más caro es el que no usás
          </div>

          {/* Headline */}
          <h2
            className="font-jost"
            style={{
              fontWeight: 300,
              fontSize: 'clamp(40px, 11vw, 60px)',
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: 'var(--sol-ink)',
              fontWeight: 400,
              marginBottom: '24px',
            }}
          >
            ¿Cuál es<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sol-green)', fontWeight: 300 }}>
              tu momento?
            </em>
          </h2>

          {/* Subtext */}
          <p
            className="font-jakarta"
            style={{
              fontSize: '13px',
              lineHeight: 1.65,
              color: 'var(--sol-ink-dim)',
              marginBottom: '40px',
            }}
          >
            Cinco fragancias para cinco momentos.<br />
            Envío a todo el país. Garantía de 30 días.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '340px', margin: '0 auto' }}>
            <Link
              to="/tienda"
              className="sol-btn font-jakarta"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '18px 22px',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
                background: 'var(--sol-ink)',
                color: 'var(--sol-bg)',
                transition: 'background 0.3s var(--sol-ease), color 0.3s var(--sol-ease)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--sol-green)'; e.currentTarget.style.color = 'var(--sol-ink)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--sol-ink)'; e.currentTarget.style.color = 'var(--sol-bg)'; }}
            >
              <span>Ir a la tienda</span>
              <span className="sol-arrow">→</span>
            </Link>

            <Link
              to="/aplicar-mayorista"
              className="sol-btn font-jakarta"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                padding: '18px 22px',
                fontSize: '11.5px',
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--sol-ink-dim)',
                border: '0.5px solid var(--sol-line-mid)',
                transition: 'color 0.3s var(--sol-ease), border-color 0.3s var(--sol-ease)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; e.currentTarget.style.borderColor = 'var(--sol-line-str)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; e.currentTarget.style.borderColor = 'var(--sol-line-mid)'; }}
            >
              <span>Ser punto de venta</span>
              <span className="sol-arrow">↗</span>
            </Link>
          </div>

          {/* Footer tag */}
          <div
            className="font-jakarta sol-arg"
            style={{
              marginTop: '48px',
              fontSize: '9px',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--sol-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Hecho en Argentina
          </div>
        </div>
      </div>
    </section>
  );
}

