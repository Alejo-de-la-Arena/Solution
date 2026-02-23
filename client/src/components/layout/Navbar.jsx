import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../contexts/CartContext';
import CartDrawer from '../cart/CartDrawer';

export default function Navbar() {
  const { user, profile, loading, signOut, isWholesaleApproved, isAdmin } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckoutPage = location.pathname === '/checkout';

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm"
    >
      <div className="container mx-auto px-6 md:px-12 lg:px-16 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-white font-heading text-xl md:text-2xl font-semibold tracking-[0.04em] uppercase transition-colors"
          >
            SOLUTION
          </Link>

          <div className="flex items-center gap-6 md:gap-8">
            <Link
              to="/"
              className="text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/80 transition-colors"
            >
              INICIO
            </Link>
            <Link
              to="/tienda"
              className="text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/80 transition-colors"
            >
              TIENDA
            </Link>

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      to={isWholesaleApproved ? '/mayorista' : '/programa-mayorista'}
                      className="text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/80 transition-colors"
                    >
                      MAYORISTA
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/80 transition-colors"
                      >
                        ADMIN
                      </Link>
                    )}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        className="flex items-center gap-2 text-white/90 hover:text-white text-sm uppercase tracking-wide"
                        aria-expanded={menuOpen}
                        aria-haspopup="true"
                      >
                        {profile?.email ?? user?.email ?? 'Cuenta'}
                        <span className="text-white/60">▼</span>
                      </button>
                      {menuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-0"
                            aria-hidden
                            onClick={() => setMenuOpen(false)}
                          />
                          <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-black border border-white/20 rounded z-10">
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="block w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
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
                    className="text-white font-body text-sm md:text-base uppercase tracking-[0.06em] hover:text-white/80 transition-colors"
                  >
                    MAYORISTA
                  </Link>
                )}
              </>
            )}

            <button
              type="button"
              onClick={toggleCart}
              className={`text-white hover:text-[rgb(0,255,255)] transition-colors relative ${isCheckoutPage ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isCheckoutPage}
              aria-label="Carrito"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[rgb(0,255,255)] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      <CartDrawer />
    </motion.nav>
  );
}
