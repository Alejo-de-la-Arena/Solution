import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { useTrackedOrders } from '../../hooks/useTrackedOrders';
import CartDrawer from '../cart/CartDrawer';
import { CONTACT_EMAIL, WHATSAPP_NUMBER, INSTAGRAM_URL } from '../../lib/contact';

// ─── Tracked order status dot ────────────────────────────────────────────────
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
      title="Seguir mi pedido"
      style={{ position: 'relative', color: 'var(--sol-ink-dim)', display: 'flex', alignItems: 'center', transition: 'color 0.3s var(--sol-ease)' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-green)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
    >
      <svg style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M20 7L12 3 4 7m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <span
        aria-hidden
        style={{
          position: 'absolute', top: -2, right: -3,
          width: 7, height: 7, borderRadius: '50%',
          background: trackedOrderDotColor(latest.status),
          border: '1.5px solid var(--sol-bg)',
        }}
      />
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
      <svg style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {totalItems > 0 && (
        <span
          aria-label={`${totalItems} items`}
          style={{
            position: 'absolute', top: -4, right: -5,
            background: 'var(--sol-green)', color: 'var(--sol-bg)',
            fontSize: 9, fontWeight: 600,
            minWidth: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
          }}
        >
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

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navTransparent = isHome && !scrolled;
  const navTop         = isHome ? 'var(--sol-ticker-h)' : '0';

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  const close = () => setMenuOpen(false);

  const wholesaleTo  = user
    ? (isWholesaleApproved ? '/mayorista' : '/programa-mayorista')
    : '/programa-mayorista';

  const accountLabel = profile?.email ?? user?.email ?? null;

  // ── Side menu nav items ──────────────────────────────────────────────────
  const NAV_ITEMS = [
    { num: '01', label: 'Inicio',      to: '/' },
    { num: '02', label: 'La Tienda',   to: '/tienda' },
    { num: '03', label: 'Fragancias',  to: '/tienda' },
    { num: '04', label: 'Mayorista',   to: wholesaleTo },
    { num: '05', label: 'Manifiesto',  to: '/' },
    { num: '06', label: 'Contacto',    to: `mailto:${CONTACT_EMAIL}`, external: true },
  ];

  if (!loading && user && isAdmin) {
    NAV_ITEMS.push({ num: '→', label: 'Admin', to: '/admin' });
  }

  return (
    <>
      {/* ── Fixed navbar bar ── */}
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          position: 'fixed',
          top: navTop,
          left: 0, right: 0,
          zIndex: 80,
          height: 'var(--sol-nav-h)',
          background: navTransparent ? 'transparent' : 'rgba(6,6,6,0.88)',
          backdropFilter: navTransparent ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: navTransparent ? 'none' : 'blur(20px)',
          borderBottom: `0.5px solid ${navTransparent ? 'transparent' : 'var(--sol-line)'}`,
          transition: 'background 0.4s var(--sol-ease), border-color 0.4s var(--sol-ease), top 0s',
        }}
      >
        <div
          className="sol-container"
          style={{
            height: '100%',
            padding: '0 22px',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
          }}
        >
          {/* Left — Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}
            >
              {[
                menuOpen ? 'translateY(5.5px) rotate(45deg)' : 'none',
                null,
                menuOpen ? 'translateY(-5.5px) rotate(-45deg)' : 'none',
              ].map((transform, i) => (
                <span
                  key={i}
                  style={{
                    display: 'block', width: 20, height: '0.5px',
                    background: 'var(--sol-ink)',
                    transform: transform ?? undefined,
                    opacity: i === 1 && menuOpen ? 0 : 1,
                    transition: 'transform 0.35s var(--sol-ease), opacity 0.3s var(--sol-ease)',
                    transformOrigin: 'center',
                  }}
                />
              ))}
            </button>
          </div>

          {/* Center — Logo */}
          <Link
            to="/"
            onClick={close}
            className="font-jmono"
            style={{
              fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'var(--sol-ink)', textDecoration: 'none',
              transition: 'opacity 0.3s var(--sol-ease)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            SOLUTION<span style={{ color: 'var(--sol-green)' }}>.</span>
          </Link>

          {/* Right — Tracked order + Cart */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 18 }}>
            <TrackedOrderIcon latest={latestTrackedOrder} onClick={close} />
            <CartBtn totalItems={totalItems} toggleCart={toggleCart} isCheckoutPage={isCheckoutPage} />
          </div>
        </div>
      </motion.nav>

      {/* ── Side panel + backdrop ── */}
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
              style={{ position: 'fixed', inset: 0, zIndex: 199, background: 'rgba(0,0,0,0.6)' }}
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
              <div
                style={{
                  height: 'calc(var(--sol-ticker-h) + var(--sol-nav-h))',
                  padding: '0 24px',
                  borderBottom: '0.5px solid var(--sol-line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  flexShrink: 0,
                }}
              >
                <span className="font-jmono" style={{ fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--sol-ink)' }}>
                  SOLUTION<span style={{ color: 'var(--sol-green)' }}>.</span>
                </span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar menú"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--sol-muted)', padding: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'color 0.3s var(--sol-ease)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-muted)'; }}
                >
                  <svg style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Nav items */}
              <nav style={{ flex: 1, padding: '8px 0' }}>
                {NAV_ITEMS.map((item) => {
                  const inner = (
                    <>
                      <span
                        className="font-jmono"
                        style={{
                          fontSize: 10, letterSpacing: '0.22em', color: 'var(--sol-muted)',
                          flexShrink: 0, width: 28, paddingTop: 4,
                          transition: 'color 0.3s var(--sol-ease)',
                        }}
                      >
                        {item.num}
                      </span>
                      <span
                        className="font-jost"
                        style={{
                          fontSize: 'clamp(24px, 6vw, 32px)',
                          fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1,
                        }}
                      >
                        {item.label}
                      </span>
                    </>
                  );

                  const sharedStyle = {
                    display: 'flex', alignItems: 'baseline', gap: 16,
                    padding: '18px 24px', textDecoration: 'none',
                    color: 'var(--sol-ink-dim)',
                    borderBottom: '0.5px solid var(--sol-line)',
                    transition: 'color 0.3s var(--sol-ease)',
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: '0.5px solid var(--sol-line)',
                  };

                  const hoverIn  = (e) => { e.currentTarget.style.color = 'var(--sol-ink)'; };
                  const hoverOut = (e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; };

                  if (item.external) {
                    return (
                      <a
                        key={item.num}
                        href={item.to}
                        style={sharedStyle}
                        onMouseEnter={hoverIn}
                        onMouseLeave={hoverOut}
                      >
                        {inner}
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={item.num}
                      to={item.to}
                      onClick={close}
                      style={sharedStyle}
                      onMouseEnter={hoverIn}
                      onMouseLeave={hoverOut}
                    >
                      {inner}
                    </Link>
                  );
                })}

                {/* Session row */}
                {!loading && user && (
                  <div style={{ padding: '18px 24px', borderBottom: '0.5px solid var(--sol-line)' }}>
                    {accountLabel && (
                      <p className="font-jmono" style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--sol-muted)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {accountLabel}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="font-jmono"
                      style={{
                        fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: 'var(--sol-muted)', background: 'none', border: 'none',
                        cursor: 'pointer', padding: 0, transition: 'color 0.3s var(--sol-ease)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-muted)'; }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </nav>

              {/* Contact footer */}
              <div style={{ padding: '24px', borderTop: '0.5px solid var(--sol-line)', flexShrink: 0 }}>
                <div className="font-jmono" style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--sol-muted)', marginBottom: 14 }}>
                  Contacto
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL },
                    { href: `https://wa.me/${WHATSAPP_NUMBER}`, label: 'WhatsApp' },
                    { href: INSTAGRAM_URL, label: 'Instagram' },
                  ].map(({ href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith('mailto') ? undefined : '_blank'}
                      rel="noopener noreferrer"
                      className="font-jmono"
                      style={{
                        fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
                        color: 'var(--sol-ink-dim)', textDecoration: 'none',
                        transition: 'color 0.3s var(--sol-ease)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-green)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                    >
                      {label}
                    </a>
                  ))}
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
