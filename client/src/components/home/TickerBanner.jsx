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
        position: 'sticky',
        top: 0,
        zIndex: 90,
        height: 'var(--sol-ticker-h)',
        overflow: 'hidden',
        background: 'var(--sol-green)',
        display: 'flex',
        alignItems: 'center',
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
                fontWeight: 700,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'rgba(0,0,0,0.82)',
                padding: '0 22px',
              }}
            >
              {item}
            </span>
            <span
              className="font-jmono"
              style={{ color: 'rgba(0,0,0,0.80)', fontSize: '8px', padding: '0 4px' }}
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
