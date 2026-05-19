import { Link } from 'react-router-dom';
import { CONTACT_EMAIL, WHATSAPP_NUMBER, INSTAGRAM_URL } from '../../lib/contact';

const NAV_LINKS = [
  { label: 'Inicio',             to: '/' },
  { label: 'Tienda',             to: '/tienda' },
  { label: 'Programa mayorista', to: '/programa-mayorista' },
  { label: 'Aplicar mayorista',  to: '/aplicar-mayorista' },
  { label: 'Portal mayorista',   to: '/mayorista' },
];

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="font-jakarta"
      style={{
        display: 'block',
        fontSize: 13, fontWeight: 500,
        color: 'var(--sol-ink-dim)', textDecoration: 'none',
        padding: '5px 0',
        transition: 'color 0.3s var(--sol-ease)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
    >
      {children}
    </Link>
  );
}

function FooterAnchor({ href, icon, children }) {
  return (
    <a
      href={href}
      target={href.startsWith('mailto') ? undefined : '_blank'}
      rel="noopener noreferrer"
      className="font-jakarta"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontSize: 13, fontWeight: 500,
        color: 'var(--sol-ink-dim)', textDecoration: 'none',
        padding: '5px 0',
        transition: 'color 0.3s var(--sol-ease)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
    >
      {icon && <span style={{ color: 'var(--sol-green)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
      {children}
    </a>
  );
}

const igIcon = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const waIcon = (
  <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.172.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const mailIcon = (
  <svg style={{ width: 14, height: 14, stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

function ColLabel({ children }) {
  return (
    <div className="font-jakarta" style={{
      fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
      color: 'var(--sol-muted)', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ display: 'inline-block', width: 16, height: '0.5px', background: 'var(--sol-muted)', verticalAlign: 'middle' }} aria-hidden />
      {children}
    </div>
  );
}

export default function Footer() {
  return (
    <footer style={{ background: 'var(--sol-bg)', color: 'var(--sol-ink)', borderTop: '0.5px solid var(--sol-line-mid)' }}>
      <div className="sol-container" style={{ padding: 'var(--sol-section-py) var(--sol-section-px)' }}>

        {/* ── Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px 40px', marginBottom: 56 }}>

          {/* Brand */}
          <div>
            <div className="font-jakarta" style={{ fontSize: 14, letterSpacing: '0.28em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 6 }}>
              SOLUTION<span style={{ color: 'var(--sol-magenta)' }}>.</span>
            </div>
            <p className="font-jakarta" style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--sol-ink-dim)', maxWidth: 220, marginTop: 12 }}>
              Fragancias premium para el hombre argentino.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <ColLabel>Navegación</ColLabel>
            <div>
              {NAV_LINKS.map((l) => (
                <FooterLink key={l.to} to={l.to}>{l.label}</FooterLink>
              ))}
            </div>
          </div>

          {/* Contacto */}
          <div>
            <ColLabel>Contacto</ColLabel>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <FooterAnchor href={INSTAGRAM_URL} icon={igIcon}>Instagram</FooterAnchor>
              <FooterAnchor href={`https://wa.me/${WHATSAPP_NUMBER}`} icon={waIcon}>WhatsApp</FooterAnchor>
              <FooterAnchor href={`mailto:${CONTACT_EMAIL}`} icon={mailIcon}>{CONTACT_EMAIL}</FooterAnchor>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          paddingTop: 24,
          borderTop: '0.5px solid var(--sol-line-mid)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p className="font-jakarta" style={{ fontSize: 12, color: 'var(--sol-ink-dim)', fontWeight: 400 }}>
            © 2026 SOLUTION — Todos los derechos reservados.
          </p>
          <p className="font-jakarta sol-arg" style={{ fontSize: 12, color: 'var(--sol-ink-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
            Hecho en Argentina
          </p>
        </div>
      </div>
    </footer>
  );
}

