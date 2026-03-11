import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';
import { createCheckoutOrder } from '../services/checkout';

const inputClass =
  'w-full bg-zinc-900 border-white/10 border rounded-sm p-3 focus:ring-1 focus:ring-[rgb(0,255,255)] focus:border-[rgb(0,255,255)] transition-colors';

export default function Checkout() {
  const { cart, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);

  const [form, setForm] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
    setError('');
  };

  const itemsWithProductId = cart.filter((item) => item.productId);
  const canSubmit = itemsWithProductId.length > 0 && itemsWithProductId.length === cart.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const name = (form.name || '').trim();
    const email = (form.email || '').trim();
    if (!name || !email) {
      setError('Completá nombre y email.');
      return;
    }
    if (!canSubmit) {
      setError('Algunos productos no están disponibles. Volvé a la tienda y agregalos de nuevo.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_name: name,
        customer_email: email,
        customer_phone: (form.phone || '').trim() || undefined,
        shipping_address_line1: (form.address || '').trim() || undefined,
        shipping_address_line2: (form.address2 || '').trim() || undefined,
        shipping_city: (form.city || '').trim() || undefined,
        shipping_state: (form.state || '').trim() || undefined,
        shipping_postal_code: (form.zip || '').trim() || undefined,
        shipping_country: 'AR',
        shipping_notes: (form.notes || '').trim() || undefined,
        shipping_method: 'standard',
        shipping_cost: 0,
        items: itemsWithProductId.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      };
      const { order } = await createCheckoutOrder(payload);
      setOrderId(order.id);
      clearCart();
    } catch (err) {
      setError(err.message || 'Error al procesar la compra.');
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">COMPRA RECIBIDA</h1>
            <p className="text-white/70">
              Tu orden <span className="text-[rgb(0,255,255)] font-medium">{orderId}</span> fue registrada correctamente.
            </p>
            <p className="text-sm text-white/50">
              Te contactaremos por email para coordinar el pago y el envío.
            </p>
            <Link
              to="/tienda"
              className="inline-block bg-white text-black py-3 px-8 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm"
            >
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          {/* Left Column: Form + Payment */}
          <div className="space-y-8 lg:order-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4 mb-6">INFORMACIÓN DE ENVÍO</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm text-white/60 mb-2">Email de contacto</label>
                    <input type="email" id="email" className={inputClass} placeholder="tu@email.com" value={form.email} onChange={handleChange} required />
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm text-white/60 mb-2">Nombre y apellido</label>
                    <input type="text" id="name" className={inputClass} placeholder="Nombre Apellido" value={form.name} onChange={handleChange} required />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm text-white/60 mb-2">Teléfono</label>
                    <input type="tel" id="phone" className={inputClass} placeholder="11 1234-5678" value={form.phone} onChange={handleChange} />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm text-white/60 mb-2">Dirección de envío (calle y número)</label>
                    <input type="text" id="address" className={inputClass} placeholder="Av. Siempre Viva 742" value={form.address} onChange={handleChange} />
                  </div>
                  <div>
                    <label htmlFor="address2" className="block text-sm text-white/60 mb-2">Piso / Depto (opcional)</label>
                    <input type="text" id="address2" className={inputClass} placeholder="Piso 2, Depto B" value={form.address2} onChange={handleChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm text-white/60 mb-2">Ciudad</label>
                      <input type="text" id="city" className={inputClass} value={form.city} onChange={handleChange} />
                    </div>
                    <div>
                      <label htmlFor="zip" className="block text-sm text-white/60 mb-2">Código Postal</label>
                      <input type="text" id="zip" className={inputClass} value={form.zip} onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm text-white/60 mb-2">Provincia</label>
                    <input type="text" id="state" className={inputClass} placeholder="Buenos Aires" value={form.state} onChange={handleChange} />
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm text-white/60 mb-2">Comentarios para la entrega (opcional)</label>
                    <input type="text" id="notes" className={inputClass} placeholder="Horario preferido, referencias..." value={form.notes} onChange={handleChange} />
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4 mb-6">MÉTODO DE PAGO</h2>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-zinc-900 rounded-sm border border-white/20 has-[:checked]:border-[rgb(0,255,255)] has-[:checked]:bg-cyan-900/10">
                    <input id="mercado-pago" name="payment-method" type="radio" className="h-4 w-4 text-[rgb(0,255,255)] bg-zinc-800 border-white/30 focus:ring-offset-0 focus:ring-1 focus:ring-[rgb(0,255,255)]" defaultChecked />
                    <label htmlFor="mercado-pago" className="ml-3 block text-sm font-medium text-white">Mercado Pago</label>
                  </div>
                  <div className="flex items-center p-4 bg-zinc-900 rounded-sm border border-white/20 has-[:checked]:border-[rgb(0,255,255)] has-[:checked]:bg-cyan-900/10">
                    <input id="credit-card" name="payment-method" type="radio" className="h-4 w-4 text-[rgb(0,255,255)] bg-zinc-800 border-white/30 focus:ring-offset-0 focus:ring-1 focus:ring-[rgb(0,255,255)]" />
                    <label htmlFor="credit-card" className="ml-3 block text-sm font-medium text-white">Tarjeta de Crédito o Débito</label>
                  </div>
                </div>
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full bg-white text-black py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Procesando...' : `Pagar $${totalPrice.toLocaleString('es-AR')}`}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6 lg:order-1 bg-zinc-900/50 p-8 rounded-lg border border-white/10">
            <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4">TUS PRODUCTOS</h2>
            {cart.length > 0 ? (
              <div className="space-y-6">
                {cart.map((item) => (
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
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Restar uno"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Añadir uno"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
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
