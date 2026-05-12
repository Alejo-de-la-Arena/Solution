import { useEffect, useRef } from 'react';

const ITEMS = [
  'Envío a todo el país',
  'Hasta 12 cuotas con Mercado Pago',
  'Garantía 30 días',
  'Producción argentina',
];

export default function TickerBanner() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (track) track.innerHTML += track.innerHTML;
  }, []);

  return (
    <div
      style={{
        overflow: 'hidden',
        background: '#050505',
        borderBottom: '0.5px solid var(--sol-line)',
        padding: '10px 0',
        whiteSpace: 'nowrap',
      }}
    >
      <div ref={trackRef} className="sol-ticker-track">
        {ITEMS.map((item) => (
          <span key={item}>
            <span
              className="font-jmono"
              style={{
                display: 'inline-block',
                fontSize: '10px',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--sol-ink-dim)',
                padding: '0 22px',
              }}
            >
              {item}
            </span>
            <span
              className="font-jmono"
              style={{ color: 'var(--sol-green)', fontSize: '8px', padding: '0 4px' }}
              aria-hidden
            >
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
