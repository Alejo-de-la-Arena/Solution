import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen, removeFromCart, updateQuantity, totalPrice } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#09090b] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-heading tracking-widest text-white">TU CARRITO ({cart.length})</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Items List */}
            <div className={`bg-black p-6 space-y-6 custom-scrollbar ${cart.length > 3 ? 'flex-1 overflow-y-auto min-h-[30rem]' : (cart.length === 0 ? 'flex-1' : '')}`}>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/60 mb-2">Tu carrito está vacío</p>
                    <Link 
                      to="/tienda"
                      onClick={() => setIsOpen(false)} 
                      className="text-[rgb(0,255,255)] hover:text-white transition-colors text-sm tracking-widest border-b border-transparent hover:border-white inline-block"
                    >
                      EXPLORAR TIENDA
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="flex gap-4 group"
                    >
                      {/* Product Image */}
                      <div className="w-24 h-32 bg-white/5 rounded-sm overflow-hidden flex-shrink-0 relative">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <span className="text-xs">No img</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-heading text-white tracking-wide text-sm">{item.name}</h3>
                            <p className="text-white/90 font-light text-sm whitespace-nowrap">
                              ${(item.price * item.quantity).toLocaleString('es-AR')}
                            </p>
                          </div>
                          <p className="text-xs text-white/40 mt-1">100ml • Eau de Parfum</p>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-white/20 rounded-sm">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[10px] text-white/40 hover:text-red-400 tracking-widest transition-colors uppercase border-b border-transparent hover:border-red-400/50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-[#09090b]">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-white/60 text-sm">
                    <span>Subtotal</span>
                    <span>${totalPrice.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60 text-sm">
                    <span>Envío</span>
                    <span className="text-[rgb(0,255,255)]">Gratis</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-white/10">
                    <span className="text-white font-heading tracking-widest">TOTAL</span>
                    <span className="text-2xl font-light text-white tracking-tight">
                      ${totalPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
                
                <Link
                  to="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="w-full block bg-white text-black py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 relative overflow-hidden group text-center"
                >
                  <span className="relative z-10">Iniciar Compra</span>
                </Link>
                
                <p className="text-center text-[10px] text-white/30 mt-4 uppercase tracking-widest">
                  Pagos seguros • Envíos a todo el país
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
