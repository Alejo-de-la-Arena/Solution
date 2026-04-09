import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import CartDrawer from '../cart/CartDrawer';

const SCROLL_THRESHOLD = 60;

export default function Navbar() {
  const { user, profile, loading, signOut, isWholesaleApproved, isAdmin } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCheckoutPage = location.pathname === '/checkout';
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
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

  const wholesaleTo = user
    ? (isWholesaleApproved ? '/mayorista' : '/programa-mayorista')
    : '/programa-mayorista';

  const desktopAccountLabel = profile?.email ?? user?.email ?? 'Cuenta';

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-[80] transition-[background-color,border-color] duration-300 ${navTransparent
            ? 'bg-transparent'
            : 'bg-black/50 backdrop-blur-md border-b border-white/10'
          }`}
      >
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-4">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <Link
              to="/"
              onClick={close}
              className="relative z-[95] shrink-0 text-white font-heading text-[1.7rem] md:text-2xl font-semibold tracking-[0.04em] uppercase transition-colors"
            >
              SOLUTION
            </Link>

            {/* Desktop: links + cart together on the right */}
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link to="/" className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors">
                INICIO
              </Link>
              <Link to="/tienda" className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors">
                TIENDA
              </Link>

              {!loading && (
                <>
                  <Link to={wholesaleTo} className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors">
                    MAYORISTA
                  </Link>

                  {user && isAdmin && (
                    <Link to="/admin" className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors">
                      ADMIN
                    </Link>
                  )}

                  {user && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setAccountOpen((o) => !o)}
                        className="flex items-center gap-2 text-white/90 hover:text-white text-sm uppercase tracking-wide"
                        aria-expanded={accountOpen}
                        aria-haspopup="true"
                      >
                        <span className="max-w-[180px] truncate">{desktopAccountLabel}</span>
                        <span className="text-white/60 text-[10px]">▼</span>
                      </button>

                      {accountOpen && (
                        <>
                          <div className="fixed inset-0 z-0" aria-hidden onClick={() => setAccountOpen(false)} />
                          <div className="absolute right-0 top-full mt-2 py-2 w-56 bg-black/95 backdrop-blur-xl border border-white/15 rounded-2xl z-10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="block w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
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

              {/* Cart — desktop, inline with links */}
              <button
                type="button"
                onClick={toggleCart}
                disabled={isCheckoutPage}
                className={`relative text-white hover:text-[rgb(0,255,255)] transition-colors ${isCheckoutPage ? 'opacity-40 cursor-not-allowed' : ''}`}
                aria-label="Carrito"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[rgb(0,255,255)] text-black text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile: cart icon + hamburger */}
            <div className="flex md:hidden items-center gap-3">
              <button
                type="button"
                onClick={toggleCart}
                disabled={isCheckoutPage}
                className={`relative z-[95] text-white hover:text-[rgb(0,255,255)] transition-colors ${isCheckoutPage ? 'opacity-40 cursor-not-allowed' : ''}`}
                aria-label="Carrito"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[rgb(0,255,255)] text-black text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex flex-col justify-center items-center w-9 h-9 gap-[5px]"
                aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={menuOpen}
              >
                <span className={`block h-[1.5px] w-5 bg-white rounded-full transition-all duration-300 origin-center ${menuOpen ? 'translate-y-[6.5px] rotate-45' : ''}`} />
                <span className={`block h-[1.5px] w-5 bg-white rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0 scale-x-0' : ''}`} />
                <span className={`block h-[1.5px] w-5 bg-white rounded-full transition-all duration-300 origin-center ${menuOpen ? '-translate-y-[6.5px] -rotate-45' : ''}`} />
              </button>
            </div>

          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="md:hidden bg-black/95 border-t border-white/10"
            >
              <nav className="container mx-auto px-4 py-6 flex flex-col gap-1">
                <MobileLink to="/" onClick={close}>Inicio</MobileLink>
                <MobileLink to="/tienda" onClick={close}>Tienda</MobileLink>

                <div className="h-px bg-white/10 my-2" />

                <MobileLink to={wholesaleTo} onClick={close}>Mayorista</MobileLink>

                {!loading && !user && (
                  <MobileLink to="/acceso-mayorista" onClick={close} subtle>
                    ¿Ya sos mayorista? Ingresá
                  </MobileLink>
                )}

                {!loading && user && isAdmin && (
                  <MobileLink to="/admin" onClick={close}>Admin</MobileLink>
                )}

                <div className="h-px bg-white/10 my-2" />

                <button
                  type="button"
                  onClick={() => { close(); toggleCart(); }}
                  className="flex items-center justify-between w-full px-2 py-3 text-left text-white/80 hover:text-white transition-colors text-sm uppercase tracking-widest"
                >
                  <span className="flex items-center gap-2">
                    Ver carrito
                    <span className="text-[rgb(0,255,255)]">→</span>
                  </span>
                  {totalItems > 0 && (
                    <span className="bg-[rgb(0,255,255)] text-black text-[10px] font-bold min-w-5 h-5 px-1.5 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>

                {!loading && user && (
                  <>
                    <div className="h-px bg-white/10 my-2" />
                    <div className="px-2 py-2">
                      <p className="text-xs text-white/40 mb-2 truncate">{desktopAccountLabel}</p>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-sm text-white/60 hover:text-white uppercase tracking-widest transition-colors"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Backdrop for mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-[79] bg-black/40"
            onClick={close}
          />
        )}
      </AnimatePresence>

      <CartDrawer />
    </>
  );
}

function MobileLink({ to, onClick, children, subtle = false }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-2 py-3 text-sm uppercase tracking-widest transition-colors ${subtle ? 'text-white/40 hover:text-white/70' : 'text-white/80 hover:text-white'
        }`}
    >
      {children}
    </Link>
  );
}