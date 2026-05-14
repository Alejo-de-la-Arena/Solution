import WholesaleHero from '../components/wholesale/WholesaleHero';
import WholesaleBenefitsGrid from '../components/wholesale/WholesaleBenefitsGrid';
import WholesaleTypes from '../components/wholesale/WholesaleTypes';
import WholesalePriceTable from '../components/wholesale/WholesalePriceTable';
import WholesaleAccess from '../components/wholesale/WholesaleAccess';
import { useReveal } from '../hooks/useReveal';
import { Link } from 'react-router-dom';

// ─── Cómo funciona ─────────────────────────────────────────────────────────────
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
      <div className="font-jost" style={{ fontSize: '40px', fontWeight: 300, letterSpacing: '-0.03em', color: 'var(--sol-line-str)', lineHeight: 1, marginBottom: '28px' }}>
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
        <div ref={headRef} className="sol-reveal" style={{ marginBottom: '56px' }}>
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
            Proceso
          </div>
          <h2 className="font-jost" style={{ fontWeight: 300, fontSize: 'clamp(28px, 5vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--sol-ink)', maxWidth: 520 }}>
            Cómo funciona<br />
            <em style={{ fontStyle: 'italic', color: 'var(--sol-ink-dim)' }}>el programa.</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', background: 'var(--sol-line)' }}>
          {STEPS.map((step) => (
            <StepItem key={step.n} step={step} />
          ))}
        </div>

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

// ─── Testimonials B2B ──────────────────────────────────────────────────────────
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
      {/* Stars */}
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
          <div className="font-jakarta" style={{ fontSize: '10px', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sol-green)', display: 'inline-block' }} />
            Revendedores
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

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function WholesaleLanding() {
  return (
    <div style={{ background: 'var(--sol-bg)', color: 'var(--sol-ink)', minHeight: '100vh' }}>
      <WholesaleHero />
      <WholesaleBenefitsGrid />
      <ComoFunciona />
      <WholesaleTypes />
      <WholesalePriceTable />
      <WholesaleTestimonials />
      <WholesaleAccess />
    </div>
  );
}
