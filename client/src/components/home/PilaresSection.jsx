import { useState } from 'react';
import { useReveal } from '../../hooks/useReveal';

const PILARES = [
  {
    num: '01',
    title: 'Identidad olfativa',
    body: (
      <>
        <p style={{ fontSize: '13.5px', lineHeight: 1.65, color: 'var(--sol-ink-dim)', marginBottom: '16px' }}>
          Cada fragancia sigue la línea de una <strong style={{ color: 'var(--sol-ink)', fontWeight: 500 }}>referencia reconocida del mercado de nicho</strong>. Sabés exactamente qué estás eligiendo antes de comprarlo — sin rodeos, sin marketing vacío.
        </p>
        <span className="font-jakarta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-ink-dim)', border: '0.5px solid var(--sol-line-mid)', padding: '7px 11px' }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block', flexShrink: 0 }} aria-hidden />
          Black Code → Creed Aventus
        </span>
      </>
    ),
  },
  {
    num: '02',
    title: 'Cinco momentos reales',
    body: (
      <>
        <p style={{ fontSize: '13.5px', lineHeight: 1.65, color: 'var(--sol-ink-dim)', marginBottom: '16px' }}>
          Trabajo, gimnasio, salida, día a día, noche. <strong style={{ color: 'var(--sol-ink)', fontWeight: 500 }}>No necesitás saber de perfumería</strong>. Solo elegís tu momento y nosotros te decimos cuál usar.
        </p>
        <span className="font-jakarta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-ink-dim)', border: '0.5px solid var(--sol-line-mid)', padding: '7px 11px' }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block', flexShrink: 0 }} aria-hidden />
          Sin complicaciones
        </span>
      </>
    ),
  },
  {
    num: '03',
    title: 'Precio inteligente',
    body: (
      <>
        <p style={{ fontSize: '13.5px', lineHeight: 1.65, color: 'var(--sol-ink-dim)', marginBottom: '16px' }}>
          No somos baratos. Somos <strong style={{ color: 'var(--sol-ink)', fontWeight: 500 }}>justos</strong>. Pagás por la fragancia, no por el logo en la caja ni por la campaña de medios. Lujo sin barreras.
        </p>
        <span className="font-jakarta" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-ink-dim)', border: '0.5px solid var(--sol-line-mid)', padding: '7px 11px' }}>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block', flexShrink: 0 }} aria-hidden />
          Calidad sin sobreprecio
        </span>
      </>
    ),
  },
];

export default function PilaresSection() {
  const [open, setOpen] = useState(0);
  const headRef = useReveal();

  const toggle = (i) => setOpen((prev) => (prev === i ? null : i));

  return (
    <section
      style={{
        borderBottom: '0.5px solid var(--sol-line)',
        background: 'var(--sol-bg)',
        color: 'var(--sol-ink)',
      }}
    >
      <div
        className="sol-container"
        style={{ padding: 'var(--sol-section-py) var(--sol-section-px)' }}
      >
        {/* Section head */}
        <div
          ref={headRef}
          className="sol-reveal sol-section-head"
          style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '40px' }}
        >
          <div>
            <div
              className="font-jakarta"
              style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}
            >
              Por qué Solution
            </div>
            <h2
              className="font-jost"
              style={{ fontWeight: 400, fontSize: 'clamp(26px, 5vw, 40px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--sol-ink)', marginTop: '12px' }}
            >
              Tres ideas que<br />
              <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)', fontWeight: 300 }}>nos sostienen</em>.
            </h2>
          </div>
        </div>

        {/* Accordion */}
        {PILARES.map((p, i) => {
          const isOpen = open === i;
          return (
            <div
              key={p.num}
              className={`sol-pilar${isOpen ? ' sol-open' : ''}`}
              style={{
                borderTop: '0.5px solid var(--sol-line)',
                ...(i === PILARES.length - 1 ? { borderBottom: '0.5px solid var(--sol-line)' } : {}),
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  padding: '22px 0',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <div
                  className="font-jakarta"
                  style={{
                    fontSize: '10px',
                    letterSpacing: '0.22em',
                    color: isOpen ? 'var(--sol-green)' : 'var(--sol-muted)',
                    flexShrink: 0,
                    width: '22px',
                    transition: 'color 0.4s var(--sol-ease)',
                  }}
                >
                  {p.num}
                </div>
                <div
                  className="font-jost"
                  style={{
                    fontSize: 'clamp(18px, 3vw, 22px)',
                    fontWeight: 500,
                    letterSpacing: '-0.005em',
                    color: isOpen ? 'var(--sol-green)' : 'var(--sol-ink)',
                    flex: 1,
                    textAlign: 'left',
                    transition: 'color 0.4s var(--sol-ease)',
                  }}
                >
                  {p.title}
                </div>
                <div className="sol-pilar-toggle" aria-hidden />
              </button>

              {/* Body */}
              <div
                style={{
                  maxHeight: isOpen ? '320px' : '0',
                  overflow: 'hidden',
                  opacity: isOpen ? 1 : 0,
                  transition: 'max-height 0.5s var(--sol-ease), opacity 0.4s var(--sol-ease)',
                  paddingLeft: '40px',
                  paddingRight: '4px',
                  ...(isOpen ? { paddingBottom: '28px' } : {}),
                }}
              >
                {p.body}
              </div>

              {/* Green bottom line */}
              <div className="sol-pilar-line" aria-hidden />
            </div>
          );
        })}
      </div>
    </section>
  );
}

