const ITEMS = [
  {
    icon: (size) => (
      <svg style={{ width: size, height: size, margin: '0 auto 12px', stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1, display: 'block' }} viewBox="0 0 24 24" aria-hidden>
        <path d="M3 7h13v9H3z"/><path d="M16 11h4l1 2v3h-5z"/>
        <circle cx="7" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>
      </svg>
    ),
    title: 'Envío gratis',
    sub: 'A todo el país\ndesde $80.000',
  },
  {
    icon: (size) => (
      <svg style={{ width: size, height: size, margin: '0 auto 12px', stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1, display: 'block' }} viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="6" width="18" height="13" rx="1"/>
        <path d="M3 10h18"/>
      </svg>
    ),
    title: '2 cuotas',
    sub: 'Mercado Pago\nsin interés',
  },
  {
    icon: (size) => (
      <svg style={{ width: size, height: size, margin: '0 auto 12px', stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1, display: 'block' }} viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z"/>
        <path d="M9 12l2.2 2.2L15 10"/>
      </svg>
    ),
    title: '30 días',
    sub: 'Garantía\nde calidad',
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
              className="sol-trust-item"
              style={{
                borderRight: i < ITEMS.length - 1 ? '0.5px solid var(--sol-line)' : 'none',
                textAlign: 'center',
              }}
            >
              <span className="sol-trust-icon">{item.icon(18)}</span>
              <span className="sol-trust-icon-lg" style={{ display: 'none' }}>{item.icon(40)}</span>
              <div className="font-jost sol-trust-title" style={{ fontWeight: 500, letterSpacing: '0.04em', color: 'var(--sol-ink)', marginBottom: '4px' }}>
                {item.title}
              </div>
              <div className="font-jakarta sol-trust-sub" style={{ letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-muted)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                {item.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
