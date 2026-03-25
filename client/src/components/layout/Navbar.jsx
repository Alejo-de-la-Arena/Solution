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
    onScroll(); // init
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
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

  const closeAllMenus = () => {
    setMenuOpen(false);
    setAccountOpen(false);
  };

  const mobileNavLinkBase =
    'group relative flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-4 text-left transition-all duration-300 hover:border-white/15 hover:bg-white/[0.05]';

  const mobileNavLinkLabel =
    'uppercase tracking-[0.22em] text-[0.92rem] text-white/90 group-hover:text-white transition-colors';

  const mobileNavLinkArrow =
    'text-white/30 transition-transform duration-300 group-hover:text-white/55 group-hover:translate-x-1';

  const desktopAccountLabel = profile?.email ?? user?.email ?? 'Cuenta';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-[80] overflow-x-clip transition-[background-color,border-color] duration-300 ${navTransparent
        ? 'bg-transparent'
        : 'bg-black/50 backdrop-blur-md border-b border-white/10'
        }`}
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-16 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="relative z-[95] shrink-0 text-white font-heading text-[1.7rem] md:text-2xl font-semibold tracking-[0.04em] uppercase transition-colors"
            onClick={closeAllMenus}
          >
            SOLUTION
          </Link>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                to="/"
                className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors"
              >
                INICIO
              </Link>

              <Link
                to="/tienda"
                className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors"
              >
                TIENDA
              </Link>

              {!loading && (
                <>
                  {user ? (
                    <>
                      <Link
                        to={isWholesaleApproved ? '/mayorista' : '/programa-mayorista'}
                        className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors"
                      >
                        MAYORISTA
                      </Link>

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors"
                        >
                          ADMIN
                        </Link>
                      )}

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
                            <div
                              className="fixed inset-0 z-0"
                              aria-hidden
                              onClick={() => setAccountOpen(false)}
                            />
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
                    </>
                  ) : (
                    <Link
                      to="/programa-mayorista"
                      className="nav-link-underline text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/90 transition-colors"
                    >
                      MAYORISTA
                    </Link>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              onClick={toggleCart}
              className={`relative z-[95] text-white hover:text-[rgb(0,255,255)] transition-colors ${isCheckoutPage ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isCheckoutPage}
              aria-label="Carrito"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
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
              className={`relative z-[95] md:hidden h-11 w-11 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md flex items-center justify-center text-white transition-all duration-300 hover:bg-white/[0.08] hover:border-white/30 ${menuOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
            >
              <div className="relative h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-[1.5px] w-5 bg-white rounded-full transition-all duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''
                    }`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-[1.5px] w-5 bg-white rounded-full transition-all duration-300 ${menuOpen ? 'opacity-0' : 'opacity-100'
                    }`}
                />
                <span
                  className={`absolute left-0 top-[14px] h-[1.5px] w-5 bg-white rounded-full transition-all duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''
                    }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden fixed inset-0 z-[999] overflow-hidden overflow-x-hidden"
          >
            <div
              className="absolute inset-0 bg-black/88 backdrop-blur-xl"
              onClick={closeAllMenus}
              aria-hidden
            />

            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 h-[100dvh] w-[80vw] max-w-[520px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 right-[-20%] h-[320px] w-[320px] rounded-full bg-[rgba(0,255,255,0.08)] blur-[95px]" />
                <div className="absolute top-[34%] left-[-20%] h-[260px] w-[260px] rounded-full bg-[rgba(255,0,122,0.14)] blur-[105px]" />
                <div className="absolute bottom-[-10%] right-[8%] h-[220px] w-[220px] rounded-full bg-white/[0.04] blur-[80px]" />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full w-full overflow-hidden rounded-[30px] border border-white/10 bg-[#020202] shadow-[0_30px_90px_rgba(0,0,0,0.55)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[30px] before:border before:border-white/[0.04] before:content-[''] flex flex-col"
              >
                <header className="shrink-0 border-b border-white/10 px-5 pb-4 pt-[calc(env(safe-area-inset-top)+1.2rem)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="pt-1">
                      <p className="text-[0.68rem] uppercase tracking-[0.34em] text-white/42 mb-2">
                        Navegación
                      </p>
                      <p className="text-white text-[1.15rem] uppercase tracking-[0.22em]">
                        Menú
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeAllMenus}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-md text-white transition-all duration-300 hover:bg-white/[0.08] hover:border-white/30"
                      aria-label="Cerrar menú"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M6 6l12 12" />
                        <path d="M18 6L6 18" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-4 h-px w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden px-5 pt-5 pb-4">
                  <nav className="flex flex-col gap-3">
                    <Link to="/" onClick={closeAllMenus} className={mobileNavLinkBase}>
                      <span className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full border border-white/20 bg-white/[0.04] shadow-[0_0_22px_rgba(0,255,255,0.12)]" />
                        <span className={`${mobileNavLinkLabel} text-[1.05rem] tracking-[0.21em] font-semibold text-white/95`}>
                          Inicio
                        </span>
                      </span>
                      <span className={mobileNavLinkArrow}>→</span>
                    </Link>

                    <Link to="/tienda" onClick={closeAllMenus} className={mobileNavLinkBase}>
                      <span className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full border border-white/15 bg-white/[0.03]" />
                        <span className={mobileNavLinkLabel}>Tienda</span>
                      </span>
                      <span className={mobileNavLinkArrow}>→</span>
                    </Link>

                    <div className="h-px w-full bg-gradient-to-r from-white/15 via-white/10 to-transparent" />

                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        toggleCart();
                      }}
                      className="relative overflow-hidden rounded-[24px] border border-[rgba(0,255,255,0.28)] bg-[radial-gradient(circle_at_right_top,rgba(0,255,255,0.14),transparent_45%)] px-4 py-5 text-left shadow-[0_0_46px_rgba(0,255,255,0.08)] transition-all duration-300 hover:border-[rgba(0,255,255,0.42)] hover:bg-[radial-gradient(circle_at_right_top,rgba(0,255,255,0.18),transparent_45%)]"
                    >
                      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05),transparent)]" />
                      <span className="relative block text-[0.68rem] uppercase tracking-[0.28em] text-white/55 mb-2">
                        Carrito
                      </span>
                      <span className="relative flex items-center justify-between gap-3">
                        <span className="text-white text-[1.02rem] uppercase tracking-[0.18em] font-semibold">
                          Ver carrito
                        </span>
                        <span className="inline-flex min-w-[36px] h-[36px] items-center justify-center rounded-full border border-[rgba(0,255,255,0.35)] bg-black/40 px-2 text-[0.86rem] font-medium text-white">
                          {totalItems}
                        </span>
                      </span>
                    </button>

                    <div className="h-px w-full bg-gradient-to-r from-white/15 via-white/10 to-transparent" />

                    {!loading && (
                      <>
                        <Link
                          to={user ? (isWholesaleApproved ? '/mayorista' : '/programa-mayorista') : '/programa-mayorista'}
                          onClick={closeAllMenus}
                          className={mobileNavLinkBase}
                        >
                          <span className="flex items-center gap-3">
                            <span className="h-2.5 w-2.5 rounded-full border border-white/15 bg-white/[0.03]" />
                            <span className={mobileNavLinkLabel}>Mayorista</span>
                          </span>
                          <span className={mobileNavLinkArrow}>→</span>
                        </Link>

                        <div className="-mt-1 pl-[1px]">
                          <Link
                            to="/acceso-mayorista"
                            onClick={closeAllMenus}
                            className="inline-flex group text-[0.78rem] uppercase tracking-[0.22em] text-white/46 hover:text-[rgb(0,255,255)] transition-colors"
                          >
                            ¿Ya sos mayorista? Ingresá
                            <span className="ml-2 text-white/25 transition-colors group-hover:text-white/55">→</span>
                          </Link>
                        </div>

                        {user && isAdmin && (
                          <>
                            <div className="h-px w-full bg-gradient-to-r from-white/15 via-white/10 to-transparent" />
                            <Link to="/admin" onClick={closeAllMenus} className={mobileNavLinkBase}>
                              <span className="flex items-center gap-3">
                                <span className="h-2.5 w-2.5 rounded-full border border-white/15 bg-white/[0.03]" />
                                <span className={mobileNavLinkLabel}>Admin</span>
                              </span>
                              <span className={mobileNavLinkArrow}>→</span>
                            </Link>
                          </>
                        )}
                      </>
                    )}
                  </nav>
                </main>

                {!loading && user && (
                  <footer className="shrink-0 border-t border-white/10 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.025] p-4">
                      <p className="mb-2 text-[0.64rem] uppercase tracking-[0.28em] text-white/42">
                        Sesión activa
                      </p>

                      <p className="text-sm leading-relaxed text-white/80 break-words">
                        {desktopAccountLabel}
                      </p>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/14 bg-black/40 px-5 py-3 text-[0.72rem] uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/[0.08] hover:border-white/28"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </footer>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer />
    </motion.nav>
  );
}
