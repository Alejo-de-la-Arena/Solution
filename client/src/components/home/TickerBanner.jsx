import { useEffect, useRef } from 'react';

const ITEMS = [
  'Envío a todo el país',
  'Hasta 2 cuotas con Mercado Pago',
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
        position: 'sticky',
        top: 0,
        zIndex: 90,
        height: 'var(--sol-ticker-h)',
        overflow: 'hidden',
        background: 'var(--sol-bg)',
        borderBottom: '0.5px solid var(--sol-line)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      <div ref={trackRef} className="sol-ticker-track">
        {ITEMS.map((item) => (
          <span key={item}>
            <span
              className="font-jakarta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#999',
                lineHeight: 1,
              }}
            >
              {item}
            </span>
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                color: 'var(--sol-green)',
                fontSize: '8px',
                padding: '0 20px',
                verticalAlign: 'middle',
              }}
            >
              ◆
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
