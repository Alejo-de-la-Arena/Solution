import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

export default function Checkout() {
  const { cart, totalPrice, updateQuantity, removeFromCart } = useCart();

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">FINALIZAR COMPRA</h1>
          <Link to="/tienda" className="text-sm text-white/50 hover:text-white transition-colors tracking-widest mt-4 inline-block">
              &larr; o volver a la tienda
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16">
          
          {/* Left Column: Payment Details */}
          <div className="space-y-8 lg:order-2">
            <div>
              <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4 mb-6">INFORMACIÓN DE ENVÍO</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm text-white/60 mb-2">Email de contacto</label>
                  <input type="email" id="email" className="w-full bg-zinc-900 border-white/10 border rounded-sm p-3 focus:ring-1 focus:ring-[rgb(0,255,255)] focus:border-[rgb(0,255,255)] transition-colors" placeholder="tu@email.com" />
                </div>
                 <div>
                  <label htmlFor="name" className="block text-sm text-white/60 mb-2">Nombre y apellido</label>
                  <input type="text" id="name" className="w-full bg-zinc-900 border-white/10 border rounded-sm p-3 focus:ring-1 focus:ring-[rgb(0,255,255)] focus:border-[rgb(0,255,255)] transition-colors" placeholder="Nombre Apellido" />
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm text-white/60 mb-2">Dirección de envío (calle y número)</label>
                  <input type="text" id="address" className="w-full bg-zinc-900 border-white/10 border rounded-sm p-3 focus:ring-1 focus:ring-[rgb(0,255,255)] focus:border-[rgb(0,255,255)] transition-colors" placeholder="Av. Siempre Viva 742" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="city" className="block text-sm text-white/60 mb-2">Ciudad</label>
                        <input type="text" id="city" className="w-full bg-zinc-900 border-white/10 border rounded-sm p-3 focus:ring-1 focus:ring-[rgb(0,255,255)] focus:border-[rgb(0,255,255)] transition-colors" />
                    </div>
                    <div>
                        <label htmlFor="zip" className="block text-sm text-white/60 mb-2">Código Postal</label>
                        <input type="text" id="zip" className="w-full bg-zinc-900 border-white/10 border rounded-sm p-3 focus:ring-1 focus:ring-[rgb(0,255,255)] focus:border-[rgb(0,255,255)] transition-colors" />
                    </div>
                </div>
              </form>
            </div>
            <div>
              <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4 mb-6">MÉTODO DE PAGO</h2>
               <div className="space-y-4">
                <div className="flex items-center p-4 bg-zinc-900 rounded-sm border border-white/20 has-[:checked]:border-[rgb(0,255,255)] has-[:checked]:bg-cyan-900/10">
                    <input id="mercado-pago" name="payment-method" type="radio" className="h-4 w-4 text-[rgb(0,255,255)] bg-zinc-800 border-white/30 focus:ring-offset-0 focus:ring-1 focus:ring-[rgb(0,255,255)]" defaultChecked />
                    <label htmlFor="mercado-pago" className="ml-3 block text-sm font-medium text-white">
                        Mercado Pago
                    </label>
                </div>
                 <div className="flex items-center p-4 bg-zinc-900 rounded-sm border border-white/20 has-[:checked]:border-[rgb(0,255,255)] has-[:checked]:bg-cyan-900/10">
                    <input id="credit-card" name="payment-method" type="radio" className="h-4 w-4 text-[rgb(0,255,255)] bg-zinc-800 border-white/30 focus:ring-offset-0 focus:ring-1 focus:ring-[rgb(0,255,255)]" />
                    <label htmlFor="credit-card" className="ml-3 block text-sm font-medium text-white">
                        Tarjeta de Crédito o Débito
                    </label>
                </div>
              </div>
            </div>
             <button className="w-full bg-white text-black py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm">
                Pagar ${totalPrice.toLocaleString('es-AR')}
              </button>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6 lg:order-1 bg-zinc-900/50 p-8 rounded-lg border border-white/10">
            <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4">TUS PRODUCTOS</h2>
            {cart.length > 0 ? (
              <div className="space-y-6">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="w-24 h-32 bg-zinc-900 rounded-sm overflow-hidden flex-shrink-0 relative">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between h-32 py-1">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="font-heading text-white tracking-wide text-sm pr-4">{item.name}</h3>
                                <p className="text-white/90 font-light text-sm whitespace-nowrap">
                                    ${(item.price * item.quantity).toLocaleString('es-AR')}
                                </p>
                            </div>
                            <p className="text-xs text-white/50 mt-1">100ml • Eau de Parfum</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center border border-white/20 rounded-sm">
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="Restar uno"
                                >
                                    -
                                </button>
                                <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                    aria-label="Añadir uno"
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
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60 py-8 text-center">No hay productos en tu carrito.</p>
            )}
             <div className="pt-6 border-t border-white/10">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-white/60 text-sm">
                    <span>Subtotal</span>
                    <span>${totalPrice.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/60 text-sm">
                    <span>Envío</span>
                    <span className="text-[rgb(0,255,255)]">Gratis</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-white/10 mt-4">
                    <span className="text-white font-heading tracking-widest">TOTAL</span>
                    <span className="text-2xl font-light text-white tracking-tight">
                      ${totalPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}
