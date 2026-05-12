import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import { useTrackedOrders } from '../../hooks/useTrackedOrders';
import CartDrawer from '../cart/CartDrawer';

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

function NavLink({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="font-jmono"
      style={{
        fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'var(--sol-muted)', textDecoration: 'none',
        transition: 'color 0.3s var(--sol-ease)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-muted)'; }}
    >
      {children}
    </Link>
  );
}

function MobileNavItem({ to, onClick, children, dim = false }) {
  const base = dim ? 'var(--sol-muted)' : 'var(--sol-ink-dim)';
  return (
    <Link
      to={to}
      onClick={onClick}
      className="font-jmono"
      style={{
        display: 'block', padding: '14px 0',
        fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: base, textDecoration: 'none',
        borderBottom: '0.5px solid var(--sol-line)',
        transition: 'color 0.3s var(--sol-ease)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = base; }}
    >
      {children}
    </Link>
  );
}

const SCROLL_THRESHOLD = 40;

export default function Navbar() {
  const { user, profile, loading, signOut, isWholesaleApproved, isAdmin } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const { latest: latestTrackedOrder } = useTrackedOrders();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
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
    setAccountOpen(false);
  }, [location.pathname]);

  const navTransparent = isHome && !scrolled;

  const handleLogout = async () => {
    await signOut();
    setAccountOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const close = () => { setMenuOpen(false); setAccountOpen(false); };

  const wholesaleTo    = user
    ? (isWholesaleApproved ? '/mayorista' : '/programa-mayorista')
    : '/programa-mayorista';
  const accountLabel   = profile?.email ?? user?.email ?? 'Cuenta';

  return (
    <>
      <motion.nav
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 80,
          background: navTransparent ? 'transparent' : 'rgba(6,6,6,0.88)',
          backdropFilter: navTransparent ? 'none' : 'blur(20px)',
          WebkitBackdropFilter: navTransparent ? 'none' : 'blur(20px)',
          borderBottom: `0.5px solid ${navTransparent ? 'transparent' : 'var(--sol-line)'}`,
          transition: 'background 0.4s var(--sol-ease), border-color 0.4s var(--sol-ease)',
        }}
      >
        {/* ── Inner ── */}
        <div
          className="sol-container"
          style={{ padding: '0 22px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/* Logo */}
          <Link
            to="/"
            onClick={close}
            className="font-jmono"
            style={{
              fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase',
              color: 'var(--sol-ink)', textDecoration: 'none', flexShrink: 0,
              transition: 'opacity 0.3s var(--sol-ease)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            SOLUTION
          </Link>

          {/* ── Desktop nav ── */}
          <div className="sol-nav-desktop" style={{ alignItems: 'center', gap: 32 }}>
            <NavLink to="/" onClick={close}>Inicio</NavLink>
            <NavLink to="/tienda" onClick={close}>Tienda</NavLink>

            {!loading && (
              <>
                <NavLink to={wholesaleTo} onClick={close}>Mayorista</NavLink>

                {user && isAdmin && (
                  <NavLink to="/admin" onClick={close}>Admin</NavLink>
                )}

                {user && (
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setAccountOpen((o) => !o)}
                      className="font-jmono"
                      aria-expanded={accountOpen}
                      aria-haspopup="true"
                      style={{
                        fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: 'var(--sol-muted)', background: 'none', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'color 0.3s var(--sol-ease)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-muted)'; }}
                    >
                      <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {accountLabel}
                      </span>
                      <span style={{ fontSize: 7, opacity: 0.6 }}>▼</span>
                    </button>

                    {accountOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }} onClick={() => setAccountOpen(false)} />
                        <div
                          style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: 8,
                            width: 220, zIndex: 10,
                            background: 'var(--sol-bg-card)',
                            border: '0.5px solid var(--sol-line-mid)',
                            padding: '4px 0',
                          }}
                        >
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="font-jmono"
                            style={{
                              display: 'block', width: '100%', textAlign: 'left',
                              padding: '13px 18px', fontSize: 10,
                              letterSpacing: '0.22em', textTransform: 'uppercase',
                              color: 'var(--sol-ink-dim)', background: 'none', border: 'none',
                              cursor: 'pointer', transition: 'color 0.3s var(--sol-ease)',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                          >
                            Cerrar sesión
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <TrackedOrderIcon latest={latestTrackedOrder} onClick={close} />
              <CartBtn totalItems={totalItems} toggleCart={toggleCart} isCheckoutPage={isCheckoutPage} />
            </div>
          </div>

          {/* ── Mobile icons ── */}
          <div className="sol-nav-mob-icons" style={{ alignItems: 'center', gap: 18 }}>
            <TrackedOrderIcon latest={latestTrackedOrder} onClick={close} />
            <CartBtn totalItems={totalItems} toggleCart={toggleCart} isCheckoutPage={isCheckoutPage} />

            {/* Hamburger */}
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
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
              style={{
                background: 'var(--sol-bg)',
                borderTop: '0.5px solid var(--sol-line)',
              }}
            >
              <div style={{ maxWidth: 1280, margin: '0 auto', padding: '4px 22px 28px' }}>
                <MobileNavItem to="/" onClick={close}>Inicio</MobileNavItem>
                <MobileNavItem to="/tienda" onClick={close}>Tienda</MobileNavItem>
                <MobileNavItem to={wholesaleTo} onClick={close}>Mayorista</MobileNavItem>

                {!loading && !user && (
                  <MobileNavItem to="/acceso-mayorista" onClick={close} dim>
                    ¿Ya sos mayorista? Ingresá
                  </MobileNavItem>
                )}
                {!loading && user && isAdmin && (
                  <MobileNavItem to="/admin" onClick={close}>Admin</MobileNavItem>
                )}

                {/* Cart */}
                <button
                  type="button"
                  onClick={() => { close(); toggleCart(); }}
                  className="font-jmono"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '14px 0',
                    fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: 'var(--sol-ink-dim)', background: 'none', border: 'none',
                    borderBottom: '0.5px solid var(--sol-line)',
                    cursor: 'pointer', transition: 'color 0.3s var(--sol-ease)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-ink-dim)'; }}
                >
                  <span>Ver carrito</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {totalItems > 0 && (
                      <span style={{
                        background: 'var(--sol-green)', color: 'var(--sol-bg)',
                        fontSize: 9, fontWeight: 600,
                        minWidth: 18, height: 18, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                      }}>
                        {totalItems}
                      </span>
                    )}
                    <span style={{ color: 'var(--sol-green)' }}>→</span>
                  </span>
                </button>

                {!loading && user && (
                  <div style={{ paddingTop: 16 }}>
                    <p className="font-jmono" style={{
                      fontSize: 9, letterSpacing: '0.18em', color: 'var(--sol-muted)',
                      marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {accountLabel}
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="font-jmono"
                      style={{
                        fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: 'var(--sol-muted)', background: 'none', border: 'none',
                        cursor: 'pointer', transition: 'color 0.3s var(--sol-ease)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--sol-ink)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--sol-muted)'; }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Backdrop */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ position: 'fixed', inset: 0, zIndex: 79, background: 'rgba(0,0,0,0.55)' }}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <CartDrawer />
    </>
  );
}
