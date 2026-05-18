import WholesaleHero from '../components/wholesale/WholesaleHero';
import WholesaleBenefitsGrid from '../components/wholesale/WholesaleBenefitsGrid';
import WholesaleTypes from '../components/wholesale/WholesaleTypes';
import WholesalePriceTable from '../components/wholesale/WholesalePriceTable';
import WholesaleAccess from '../components/wholesale/WholesaleAccess';
import { useReveal } from '../hooks/useReveal';
import { Link } from 'react-router-dom';

// ─── § 02 — Stats strip ────────────────────────────────────────────────────────
const STATS = [
  {
    n: '40%',
    label: 'Margen\npromedio',
    icon: (
      <svg style={{ width: 32, height: 32, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1 }} viewBox="0 0 24 24" aria-hidden>
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    n: '+120',
    label: 'Revendedores\nactivos',
    icon: (
      <svg style={{ width: 32, height: 32, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1 }} viewBox="0 0 24 24" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    n: '48hs',
    label: 'Tiempo\nde despacho',
    icon: (
      <svg style={{ width: 32, height: 32, stroke: 'var(--sol-green)', fill: 'none', strokeWidth: 1 }} viewBox="0 0 24 24" aria-hidden>
        <path d="M3 7h13v9H3z"/><path d="M16 11h4l1 2v3h-5z"/>
        <circle cx="7" cy="18" r="1.6"/><circle cx="18" cy="18" r="1.6"/>
      </svg>
    ),
  },
];

function StatItem({ stat }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="sol-reveal"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '32px 16px' }}
    >
      <div style={{ width: 56, height: 56, border: '0.5px solid var(--sol-green-soft)', background: 'var(--sol-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {stat.icon}
      </div>
      <div className="font-jost" style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--sol-ink)', lineHeight: 1, textAlign: 'center' }}>
        {stat.n}
      </div>
      <div className="font-jakarta" style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sol-muted)', whiteSpace: 'pre-line', lineHeight: 1.5, textAlign: 'center' }}>
        {stat.label}
      </div>
    </div>
  );
}

function WholesaleStats() {
  const headRef = useReveal();
  return (
    <section style={{ borderBottom: '0.5px solid var(--sol-line)', background: 'var(--sol-bg)' }}>
      <div className="sol-container" style={{ padding: '0 var(--sol-section-px)' }}>
        {/* Eyebrow */}
        <div ref={headRef} className="sol-reveal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--sol-line)', padding: '16px 0' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
            En números
          </div>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-magenta)' }}>§ 02</div>
        </div>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--sol-line)' }}>
          {STATS.map((stat) => (
            <StatItem key={stat.n} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── § 04 — Cómo funciona ──────────────────────────────────────────────────────
const STEPS = [
  {
    n: '01',
    title: 'Completás la solicitud',
    body: 'Llenás el formulario con los datos de tu negocio. Sin costo ni compromiso. Te respondemos en 48 h.',
  },
  {
    n: '02',
    title: 'Revisamos y aprobamos',
    body: 'Nuestro equipo evalúa tu perfil comercial y te asigna el plan que mejor se adapta a tu volumen.',
  },
  {
    n: '03',
    title: 'Empezás a vender',
    body: 'Accedés al portal mayorista, hacés tu primer pedido y recibís el material promo listo para publicar.',
  },
];

function StepItem({ step }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="sol-reveal"
      style={{ background: 'var(--sol-bg)', padding: '40px 28px' }}
    >
      <div className="font-jost" style={{ fontSize: '48px', fontWeight: 300, letterSpacing: '-0.03em', color: 'var(--sol-line-str)', lineHeight: 1, marginBottom: '24px' }}>
        {step.n}
      </div>
      <h3 className="font-jost" style={{ fontWeight: 500, fontSize: '18px', color: 'var(--sol-ink)', marginBottom: '12px', letterSpacing: '-0.01em' }}>
        {step.title}
      </h3>
      <p className="font-jakarta" style={{ fontSize: '13px', lineHeight: 1.75, color: 'var(--sol-muted)' }}>
        {step.body}
      </p>
    </div>
  );
}

function ComoFunciona() {
  const headRef = useReveal();
  return (
    <section style={{ borderBottom: '0.5px solid var(--sol-line)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)', background: 'var(--sol-bg)' }}>
      <div className="sol-container" style={{ padding: '0 var(--sol-section-px)' }}>
        {/* Section header */}
        <div ref={headRef} className="sol-reveal" style={{ marginBottom: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
              Proceso
            </div>
            <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-magenta)' }}>§ 04</div>
          </div>
          <h2 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--sol-ink)', maxWidth: 520 }}>
            Cómo funciona<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)' }}>el programa.</em>
          </h2>
        </div>

        {/* Steps grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', background: 'var(--sol-line)' }}>
          {STEPS.map((step) => (
            <StepItem key={step.n} step={step} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Link
            to="/aplicar-mayorista"
            className="font-jakarta"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '16px 36px',
              background: 'var(--sol-green)', color: 'var(--sol-bg)',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'opacity 0.3s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Quiero aplicar →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── § 07 — Testimonios ────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: 'En el primer mes recuperé la inversión. Los productos se venden solos porque la gente ya conoce las referencias.',
    name: 'Valentina R.',
    role: 'Revendedora · Córdoba',
    initial: 'V',
  },
  {
    quote: 'El soporte comercial es lo que más valoro. Me ayudaron a armar una estrategia de ventas desde cero.',
    name: 'Matías G.',
    role: 'Tienda multimarca · Rosario',
    initial: 'M',
  },
  {
    quote: 'Los márgenes son reales. Nada de promesas. Trabajo con cuatro marcas mayoristas y Solution es la más transparente.',
    name: 'Lucía F.',
    role: 'Emprendedora · Buenos Aires',
    initial: 'L',
  },
];

function TestimonialCard({ t }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className="sol-reveal"
      style={{
        background: 'var(--sol-bg-card)',
        border: '0.5px solid var(--sol-line)',
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div style={{ display: 'flex', gap: '3px' }}>
        {[0,1,2,3,4].map(i => (
          <svg key={i} style={{ width: 12, height: 12, fill: 'var(--sol-green)' }} viewBox="0 0 24 24" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
      <p className="font-jakarta" style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--sol-ink-dim)', fontStyle: 'italic', flex: 1 }}>
        &ldquo;{t.quote}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '0.5px solid var(--sol-line)', paddingTop: '20px' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sol-green-soft)', border: '0.5px solid var(--sol-green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="font-jost" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--sol-green)' }}>{t.initial}</span>
        </div>
        <div>
          <div className="font-jost" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--sol-ink)' }}>{t.name}</div>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sol-muted)' }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

function WholesaleTestimonials() {
  const headRef = useReveal();
  return (
    <section style={{ borderBottom: '0.5px solid var(--sol-line)', paddingTop: 'var(--sol-section-py)', paddingBottom: 'var(--sol-section-py)', background: 'var(--sol-bg)' }}>
      <div className="sol-container" style={{ padding: '0 var(--sol-section-px)' }}>
        <div ref={headRef} className="sol-reveal" style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
              Revendedores
            </div>
            <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-magenta)' }}>§ 07</div>
          </div>
          <h2 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--sol-ink)', maxWidth: 460 }}>
            Lo que dicen<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)' }}>quienes ya venden.</em>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── § 08 — Access eyebrow wrapper ────────────────────────────────────────────
function AccessEyebrow() {
  return (
    <div className="sol-container" style={{ padding: '16px var(--sol-section-px) 0', background: 'var(--sol-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--sol-line)', paddingBottom: '12px' }}>
        <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
          Acceso
        </div>
        <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.22em', color: 'var(--sol-magenta)' }}>§ 08</div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function WholesaleLanding() {
  return (
    <div style={{ background: 'var(--sol-bg)', color: 'var(--sol-ink)', minHeight: '100vh' }}>
      <WholesaleHero />      {/* § 01 */}
      <WholesaleStats />     {/* § 02 */}
      <WholesaleBenefitsGrid /> {/* § 03 */}
      <ComoFunciona />       {/* § 04 */}
      <WholesaleTypes />     {/* § 05 — eyebrow inside component */}
      <WholesalePriceTable /> {/* § 06 — eyebrow inside component */}
      <WholesaleTestimonials /> {/* § 07 */}
      <AccessEyebrow />
      <WholesaleAccess />    {/* § 08 */}
    </div>
  );
}
