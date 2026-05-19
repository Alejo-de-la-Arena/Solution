import { useReveal } from '../../hooks/useReveal';

const BENEFITS = [
  {
    title: 'Envíos rápidos',
    description: 'Despachos en 48 h con prioridad logística para revendedores activos.',
    icon: (
      <svg style={{ width: 26, height: 26, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1.2, flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
        <path d="M3 7h13v9H3z"/><path d="M16 11h4l1 2v3h-5z"/>
        <circle cx="7" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>
      </svg>
    ),
  },
  {
    title: 'Márgenes reales',
    description: 'Hasta 40 % de ganancia sobre precio de lista. Sin costos ocultos ni sorpresas.',
    icon: (
      <svg style={{ width: 26, height: 26, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1.2, flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    title: 'Stock garantizado',
    description: 'Acceso prioritario a reposiciones y reserva de unidades para planes avanzados.',
    icon: (
      <svg style={{ width: 26, height: 26, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1.2, flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3Z"/>
        <path d="M9 12l2.2 2.2L15 10"/>
      </svg>
    ),
  },
  {
    title: 'Soporte comercial',
    description: 'Asesor dedicado por WhatsApp. Estrategia de venta, pricing y objeciones.',
    icon: (
      <svg style={{ width: 26, height: 26, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1.2, flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    title: 'Material listo',
    description: 'Fotos, videos y copies para redes sociales. Solo publicás y vendés.',
    icon: (
      <svg style={{ width: 26, height: 26, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1.2, flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    title: 'Sin mínimo inicial',
    description: 'Una vez aprobado, empezás con el volumen que tu negocio necesita.',
    icon: (
      <svg style={{ width: 26, height: 26, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1.2, flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

function BenefitItem({ item }) {
  const itemRef = useReveal();
  return (
    <div
      ref={itemRef}
      className="sol-reveal"
      style={{
        background: '#111',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Icon + title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {item.icon}
        <h3 className="font-jost" style={{ fontWeight: 500, fontSize: '15px', color: 'var(--sol-ink)', letterSpacing: '-0.01em', margin: 0 }}>
          {item.title}
        </h3>
      </div>
      {/* Description */}
      <p className="font-jakarta" style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--sol-muted)', margin: 0 }}>
        {item.description}
      </p>
    </div>
  );
}

export default function WholesaleBenefitsGrid() {
  const headRef = useReveal();

  return (
    <section
      id="beneficios"
      style={{
        borderBottom: '0.5px solid var(--sol-line)',
        paddingTop: 'var(--sol-section-py)',
        paddingBottom: 'var(--sol-section-py)',
        background: 'var(--sol-bg)',
      }}
    >
      <div className="sol-container" style={{ padding: '0 var(--sol-section-px)' }}>

        {/* Section header */}
        <div ref={headRef} className="sol-reveal" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
              Beneficios
            </div>
          </div>
          <h2 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--sol-ink)', maxWidth: 520 }}>
            Todo lo que necesitás<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)' }}>para vender.</em>
          </h2>
        </div>

        {/* Grid: 1 col mobile, 3 cols desktop */}
        <div className="sol-benefits-grid">
          {BENEFITS.map((item) => (
            <BenefitItem key={item.title} item={item} />
          ))}
        </div>

      </div>
    </section>
  );
}
