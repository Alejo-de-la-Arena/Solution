import { useReveal } from '../../hooks/useReveal';

const TESTIMONIALS = [
  {
    initial: 'AF',
    name: 'Andrés Ferrero',
    city: 'Buenos Aires',
    product: 'Red Desire',
    quote:
      'Probé el Red Desire y el Black Code — los dos son un 10. Antes vendían equivalencias y ya eran buenos, ahora con perfume propio subieron el nivel.',
  },
  {
    initial: 'EZ',
    name: 'Ezequiel Zotto',
    city: 'Mendoza',
    product: 'Deep Blue',
    quote:
      'Elegí el Deep Blue y cumplió 100%. Lo que me terminó de convencer fue el frasco — original y práctico para llevarlo a donde sea.',
  },
  {
    initial: 'SC',
    name: 'Sebastián Carmona',
    city: 'Rosario',
    product: 'Yellow Bloom',
    quote:
      'Yellow Bloom es un acierto. Tiene un parecido muy fiel al Erba Pura, y a una fracción del precio. Lo uso todos los días.',
  },
];

export default function TestimonialsSection() {
  const headRef = useReveal();

  return (
    <section
      style={{
        borderBottom: '0.5px solid var(--sol-line)',
        background: 'var(--sol-bg)',
        color: 'var(--sol-ink)',
        paddingTop: 'var(--sol-section-py)',
        paddingBottom: 'var(--sol-section-py)',
      }}
    >
      {/* Section head */}
      <div
        ref={headRef}
        className="sol-reveal"
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: '40px',
          padding: '0 var(--sol-section-px)',
          maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto',
        }}
      >
        <div>
          <div className="font-jmono" style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
            Voces reales
          </div>
          <h2 className="font-jost" style={{ fontWeight: 300, fontSize: '30px', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--sol-ink)', marginTop: '12px' }}>
            Lo que dicen<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>quienes lo usan</em>.
          </h2>
        </div>
        <div className="font-jmono" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-muted)' }}>§ 03</div>
      </div>

      {/* Horizontal scroll */}
      <div
        className="sol-scroll"
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingLeft: 'var(--sol-section-px)',
          paddingRight: 'var(--sol-section-px)',
          paddingBottom: '8px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="sol-test-card"
            style={{
              flex: '0 0 280px',
              scrollSnapAlign: 'start',
              background: 'var(--sol-bg-card)',
              border: '0.5px solid var(--sol-line)',
              padding: '26px 22px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Large green quote mark */}
            <div
              className="font-jost"
              style={{ fontSize: '56px', lineHeight: 0.5, color: 'var(--sol-green)', marginBottom: '18px', fontWeight: 300 }}
              aria-hidden
            >
              "
            </div>

            {/* Quote */}
            <p
              className="font-jakarta"
              style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--sol-ink)', fontWeight: 400, marginBottom: '28px', flex: 1 }}
            >
              {t.quote}
            </p>

            {/* Meta */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '12px',
                paddingTop: '18px',
                borderTop: '0.5px solid var(--sol-line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                {/* Avatar */}
                <div
                  className="font-jost"
                  style={{
                    flexShrink: 0,
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    border: '0.5px solid var(--sol-line-str)',
                    background: 'var(--sol-bg)',
                    color: 'var(--sol-ink)',
                    fontSize: '11px',
                    letterSpacing: '0.05em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  aria-hidden
                >
                  {t.initial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    className="font-jost"
                    style={{ fontSize: '13px', fontWeight: 500, color: 'var(--sol-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {t.name}
                  </div>
                  <div
                    className="font-jmono"
                    style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    {t.city}
                  </div>
                </div>
              </div>

              {/* Product label */}
              <div
                className="font-jmono sol-test-prod"
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--sol-green)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {t.product}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
