import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { useTrackedOrders } from '../../hooks/useTrackedOrders';
import CartDrawer from '../cart/CartDrawer';
import { CONTACT_EMAIL, WHATSAPP_NUMBER, INSTAGRAM_URL } from '../../lib/contact';

// ─── Tracked order dot ────────────────────────────────────────────────────────
function trackedOrderDotColor(status) {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return 'var(--sol-green)';
  if (['payment_failed', 'cancelled', 'chargeback', 'refunded'].includes(s)) return '#ef4444';
  return '#fbbf24';
}

function TrackedOrderIcon({ latest, onClick }) {
  if (!latest?.orderId) return null;
  return (
    <Link
      to={`/mi-pedido/${latest.orderId}`}
      onClick={onClick}
      aria-label="Seguir mi pedido"
      style={{ position: 'relative', color: 'var(--sol-ink-dim)', display: 'flex', alignItems: 'center', transition: 'color 0.3s var(--sol-ease)' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-green)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
    >
      <svg style={{ width: 'var(--sol-nav-icon-sz)', height: 'var(--sol-nav-icon-sz)', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7L12 3 4 7m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <span aria-hidden style={{
        position: 'absolute', top: -2, right: -3,
        width: 7, height: 7, borderRadius: '50%',
        background: trackedOrderDotColor(latest.status),
        border: '1.5px solid var(--sol-bg)',
      }} />
    </Link>
  );
}

// ─── Cart button ─────────────────────────────────────────────────────────────
function CartBtn({ totalItems, toggleCart, isCheckoutPage }) {
  return (
    <button
      type="button"
      onClick={toggleCart}
      disabled={isCheckoutPage}
      aria-label="Carrito"
      style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        background: 'none', border: 'none', padding: 0,
        cursor: isCheckoutPage ? 'not-allowed' : 'pointer',
        opacity: isCheckoutPage ? 0.4 : 1,
        color: 'var(--sol-ink-dim)',
        transition: 'color 0.3s var(--sol-ease)',
      }}
      onMouseEnter={(e) => { if (!isCheckoutPage) e.currentTarget.style.color = 'var(--sol-green)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
    >
      <svg style={{ width: 'var(--sol-nav-icon-sz)', height: 'var(--sol-nav-icon-sz)', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {totalItems > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -5,
          background: 'var(--sol-green)', color: 'var(--sol-bg)',
          fontSize: 9, fontWeight: 700,
          minWidth: 16, height: 16, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px', lineHeight: 1,
        }}>
          {totalItems}
        </span>
      )}
    </button>
  );
}

const SCROLL_THRESHOLD = 40;

export default function Navbar() {
  const { user, profile, loading, signOut, isWholesaleApproved, isAdmin } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { latest: latestTrackedOrder } = useTrackedOrders();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled]  = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const isCheckoutPage = location.pathname === '/checkout';
  const isHome         = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navTransparent = isHome && !scrolled;
  const navTop         = 'var(--sol-ticker-h)';

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  const close = () => setMenuOpen(false);

  const wholesaleTo  = user ? (isWholesaleApproved ? '/mayorista' : '/programa-mayorista') : '/programa-mayorista';
  const accountLabel = profile?.email ?? user?.email ?? null;

  return (
    <>
      {/* ── Fixed bar ── */}
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: navTop, left: 0, right: 0,
          zIndex: 80,
          height: 'var(--sol-nav-h)',
          background: navTransparent ? 'transparent' : 'rgba(6,6,6,0.88)',
          backdropFilter: navTransparent ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: navTransparent ? 'none' : 'blur(20px)',
          borderBottom: `0.5px solid ${navTransparent ? 'transparent' : 'var(--sol-line)'}`,
          transition: 'background 0.4s var(--sol-ease), border-color 0.4s var(--sol-ease)',
        }}
      >
        <div
          className="sol-container"
          style={{
            height: '100%', padding: '0 22px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
          }}
        >
          {/* Left — Hamburger */}
          <div>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              {[
                menuOpen ? 'translateY(6px) rotate(45deg)' : 'none',
                null,
                menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
              ].map((transform, i) => (
                <span key={i} style={{
                  display: 'block',
                  width: 'var(--sol-ham-w)', height: '1px',
                  background: 'var(--sol-ink)',
                  transform: transform ?? undefined,
                  opacity: i === 1 && menuOpen ? 0 : 1,
                  transition: 'transform 0.35s var(--sol-ease), opacity 0.3s var(--sol-ease)',
                  transformOrigin: 'center',
                }} />
              ))}
            </button>
          </div>

          {/* Center — Logo */}
          <Link
            to="/"
            onClick={close}
            className="font-jakarta"
            style={{
              fontSize: 'var(--sol-nav-logo-fs)',
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'var(--sol-ink)', textDecoration: 'none',
              fontWeight: 500,
              transition: 'opacity 0.3s var(--sol-ease)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            SOLUTION<span style={{ color: 'var(--sol-magenta)' }}>.</span>
          </Link>

          {/* Right — Tracked + Cart */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 20 }}>
            <TrackedOrderIcon latest={latestTrackedOrder} onClick={close} />
            <CartBtn totalItems={totalItems} toggleCart={toggleCart} isCheckoutPage={isCheckoutPage} />
          </div>
        </div>
      </motion.nav>

      {/* ── Side panel ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.65)' }}
              onClick={close}
            />

            {/* Panel */}
            <motion.aside
              key="panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.38, ease: [0.22, 0.61, 0.36, 1] }}
              style={{
                position: 'fixed', left: 0, top: 0, bottom: 0,
                width: '80%', maxWidth: 400,
                zIndex: 200,
                background: 'var(--sol-bg)',
                borderRight: '0.5px solid var(--sol-line)',
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
              }}
            >
              {/* Panel header */}
              <div style={{
                height: 'calc(var(--sol-ticker-h) + var(--sol-nav-h))',
                padding: '0 24px',
                borderBottom: '0.5px solid var(--sol-line)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <span className="font-jakarta" style={{ fontSize: 13, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--sol-ink)', fontWeight: 500 }}>
                  SOLUTION<span style={{ color: 'var(--sol-magenta)' }}>.</span>
                </span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar menú"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sol-muted)', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.3s var(--sol-ease)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-muted)'; }}
                >
                  <svg style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ── Nav links ── */}
              <nav style={{ flex: 1 }}>
                {/* Main links */}
                {[
                  { label: 'Tienda',    to: '/tienda' },
                  { label: 'Mayorista', to: wholesaleTo },
                ].map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={close}
                    className="font-jost"
                    style={{
                      display: 'block', padding: '20px 24px',
                      fontSize: 'clamp(26px, 6vw, 34px)',
                      fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1,
                      color: 'var(--sol-ink-dim)', textDecoration: 'none',
                      borderBottom: '0.5px solid var(--sol-line)',
                      transition: 'color 0.3s var(--sol-ease)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                  >
                    {label}
                  </Link>
                ))}

                {/* Secondary: ¿Ya sos mayorista? */}
                {!loading && !user && (
                  <Link
                    to="/acceso"
                    onClick={close}
                    className="font-jakarta"
                    style={{
                      display: 'block', padding: '14px 24px',
                      fontSize: 12, fontWeight: 500,
                      color: 'var(--sol-muted)', textDecoration: 'none',
                      borderBottom: '0.5px solid var(--sol-line)',
                      transition: 'color 0.3s var(--sol-ease)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-muted)'; }}
                  >
                    ¿Ya sos mayorista? Ingresá
                  </Link>
                )}

                {/* Admin */}
                {!loading && user && isAdmin && (
                  <Link
                    to="/admin"
                    onClick={close}
                    className="font-jost"
                    style={{
                      display: 'block', padding: '20px 24px',
                      fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em',
                      color: 'var(--sol-ink-dim)', textDecoration: 'none',
                      borderBottom: '0.5px solid var(--sol-line)',
                      transition: 'color 0.3s var(--sol-ease)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                  >
                    Admin
                  </Link>
                )}

                {/* Session */}
                {!loading && user && (
                  <div style={{ padding: '16px 24px', borderBottom: '0.5px solid var(--sol-line)' }}>
                    {accountLabel && (
                      <p className="font-jakarta" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--sol-muted)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {accountLabel}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="font-jakarta"
                      style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.3s var(--sol-ease)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-muted)'; }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </nav>

              {/* ── Contact footer ── */}
              <div style={{ padding: '24px', borderTop: '0.5px solid var(--sol-line)', flexShrink: 0 }}>
                <div className="font-jakarta" style={{ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: 16 }}>
                  Contacto
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Instagram */}
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
                    className="font-jakarta"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--sol-ink-dim)', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.3s var(--sol-ease)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                  >
                    <svg style={{ width: 16, height: 16, fill: 'var(--sol-green)', flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </a>

                  {/* WhatsApp */}
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer"
                    className="font-jakarta"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--sol-ink-dim)', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.3s var(--sol-ease)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                  >
                    <svg style={{ width: 16, height: 16, fill: 'var(--sol-green)', flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.172.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>

                  {/* Email */}
                  <a href={`mailto:${CONTACT_EMAIL}`}
                    className="font-jakarta"
                    style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--sol-ink-dim)', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.3s var(--sol-ease)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                  >
                    <svg style={{ width: 16, height: 16, stroke: 'var(--sol-green)', fill: 'none', flexShrink: 0 }} viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CartDrawer />
    </>
  );
}

