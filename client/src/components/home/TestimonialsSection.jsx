import { useReveal } from '../../hooks/useReveal';

const TESTIMONIALS = [
  {
    name: 'Andrés Ferrero', city: 'Buenos Aires', initial: 'A',
    quote: 'Les compre cuando vendían equivalencias y ahora con los perfumes nuevos, probé el Red Desire y el Black, ambos muy buenos, recomiendo!',
  },
  {
    name: 'Sebastian Carmona', city: 'Rosario', initial: 'S',
    quote: 'Si te gustan los perfumes dulces recomiendo el Yellow Bloom, tiene un parecido al Erba pura',
  },
  {
    name: 'Franco Belligoi', city: 'Córdoba', initial: 'F',
    quote: 'Compre el White ice y cumple con la descripción, super versátil y fresco para usar durante el dia',
  },
  {
    name: 'Nicolás Méndez', city: 'Buenos Aires', initial: 'N',
    quote: 'Buena atención, Buen producto',
  },
  {
    name: 'Ezequiel Zotto', city: 'Mendoza', initial: 'E',
    quote: 'Elegí el Deep Blue y cumplió 100%, pero lo que me compro fue el envase, original y practico para llevar durante el día',
  },
  {
    name: 'Patricia Montone', city: 'Mar del Plata', initial: 'P',
    quote: 'Compre el combo de 2 para regalarle a mi hijo, están barbaros, recomiendo!',
  },
];

// Duplicate for seamless infinite loop
const LOOP_CARDS = [...TESTIMONIALS, ...TESTIMONIALS];

function TestCard({ t }) {
  return (
    <div
      className="sol-test-card"
      style={{
        flex: '0 0 280px',
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
        style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--sol-ink)', fontWeight: 500, marginBottom: '28px', flex: 1 }}
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
              style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sol-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {t.name}
            </div>
            <div
              className="font-jakarta"
              style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {t.city}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
        overflow: 'hidden',
      }}
    >
      {/* Section head */}
      <div
        ref={headRef}
        className="sol-reveal sol-section-head"
        style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: '40px',
          padding: '0 var(--sol-section-px)',
          maxWidth: 1280, marginLeft: 'auto', marginRight: 'auto',
        }}
      >
        <div>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>
            Voces reales
          </div>
          <h2 className="font-jost" style={{ fontWeight: 400, fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--sol-ink)', marginTop: '12px' }}>
            Lo que dicen<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>quienes lo usan</em>.
          </h2>
        </div>
        <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-muted)', flexShrink: 0 }}>§ 03</div>
      </div>

      {/* Auto-scrolling track — edge to edge, no clipping on right */}
      <div
        style={{ overflow: 'hidden', paddingLeft: 'var(--sol-section-px)', paddingBottom: '8px' }}
        aria-label="Testimonios de clientes"
      >
        <div className="sol-test-track">
          {LOOP_CARDS.map((t, i) => (
            <TestCard key={`${t.name}-${i}`} t={t} />
          ))}
        </div>
      </div>

      {/* Decorative progress dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '24px', padding: '0 var(--sol-section-px)' }}>
        {TESTIMONIALS.map((_, i) => (
          <span key={i} style={{
            width: '16px', height: '0.5px',
            background: i === 0 ? 'var(--sol-green)' : 'var(--sol-line-mid)',
            display: 'block',
          }} />
        ))}
      </div>
    </section>
  );
}
