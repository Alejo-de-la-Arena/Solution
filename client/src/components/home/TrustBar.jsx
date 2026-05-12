const ITEMS = [
  {
    icon: (
      <svg style={{ width: 18, height: 18, margin: '0 auto 10px', stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1, display: 'block' }} viewBox="0 0 24 24" aria-hidden>
        <path d="M3 7h13v9H3z"/><path d="M16 11h4l1 2v3h-5z"/>
        <circle cx="7" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>
      </svg>
    ),
    title: 'EnvÃ­o gratis',
    sub: 'A todo el paÃ­s\ndesde $80.000',
  },
  {
    icon: (
      <svg style={{ width: 18, height: 18, margin: '0 auto 10px', stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1, display: 'block' }} viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="6" width="18" height="13" rx="1"/>
        <path d="M3 10h18"/>
      </svg>
    ),
    title: '12 cuotas',
    sub: 'Mercado Pago\nsin interÃ©s',
  },
  {
    icon: (
      <svg style={{ width: 18, height: 18, margin: '0 auto 10px', stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1, display: 'block' }} viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z"/>
        <path d="M9 12l2.2 2.2L15 10"/>
      </svg>
    ),
    title: '30 dÃ­as',
    sub: 'GarantÃ­a\nde calidad',
  },
];

export default function TrustBar() {
  return (
    <div
      style={{
        borderBottom: '0.5px solid var(--sol-line)',
        background: 'var(--sol-bg)',
      }}
    >
      <div className="sol-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
          }}
        >
          {ITEMS.map((item, i) => (
            <div
              key={item.title}
              style={{
                padding: '22px 14px',
                borderRight: i < ITEMS.length - 1 ? '0.5px solid var(--sol-line)' : 'none',
                textAlign: 'center',
              }}
            >
              {item.icon}
              <div
                className="font-jost"
                style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', color: 'var(--sol-ink)', marginBottom: '4px' }}
              >
                {item.title}
              </div>
              <div
                className="font-jakarta"
                style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-muted)', lineHeight: 1.5, whiteSpace: 'pre-line' }}
              >
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

