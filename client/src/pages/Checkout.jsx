import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { Link, useSearchParams } from 'react-router-dom';
import { createNavePayment, getPaymentStatus } from '../services/checkout';
import NaveEmbed from '../components/checkout/NaveEmbed';

const inputClass =
  'w-full bg-zinc-900 border-white/10 border rounded-sm p-3 focus:ring-1 focus:ring-[rgb(0,255,255)] focus:border-[rgb(0,255,255)] transition-colors';

const NAVE_ORDER_KEY = 'nave_pending_order';

/** Orden pagada en DB o aprobada en Nave aunque el webhook aún no actualice `orders.status`. */
function isCheckoutPaid(data) {
  const orderStatus = (data?.order_status || '').toLowerCase();
  if (orderStatus === 'payment_failed' || orderStatus === 'cancelled' || orderStatus === 'chargeback') {
    return false;
  }
  if (orderStatus === 'paid') return true;
  const nave = (data?.nave_status || '').toUpperCase();
  return nave === 'APPROVED';
}

export default function Checkout() {
  const { cart, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [resultOrderId, setResultOrderId] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showNaveModal, setShowNaveModal] = useState(false);
  const [paymentRequestId, setPaymentRequestId] = useState(null);

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

  const orderIdFromUrl = searchParams.get('order_id');

  // On mount / return from Nave: consultar estado y vaciar carrito si la compra quedó paga
  useEffect(() => {
    const savedOrder = localStorage.getItem(NAVE_ORDER_KEY);
    const pendingOrderId = orderIdFromUrl || savedOrder;
    if (!pendingOrderId) return;

    localStorage.removeItem(NAVE_ORDER_KEY);
    setChecking(true);
    setResultOrderId(pendingOrderId);

    getPaymentStatus(pendingOrderId)
      .then((data) => {
        const status = data.order_status || '';
        if (isCheckoutPaid(data)) {
          setPaymentResult('success');
          clearCart();
        } else if (status === 'payment_failed') {
          setPaymentResult('rejected');
        } else if (status === 'pending_payment') {
          setPaymentResult('pending');
        } else {
          setPaymentResult('pending');
        }
      })
      .catch(() => {
        setPaymentResult('pending');
      })
      .finally(() => setChecking(false));
  }, [orderIdFromUrl, clearCart]);

  // Por si el estado de éxito se fija por otra vía: el carrito debe quedar vacío
  useEffect(() => {
    if (paymentResult === 'success') {
      clearCart();
    }
  }, [paymentResult, clearCart]);

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
        callback_url: `${window.location.origin}/checkout?order_id=PLACEHOLDER`,
        items: itemsWithProductId.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          name: item.name || 'Producto',
        })),
      };

      const data = await createNavePayment(payload);

      localStorage.setItem(NAVE_ORDER_KEY, data.order_id);
      setResultOrderId(data.order_id);
      setPaymentRequestId(data.payment_request_id);
      setShowNaveModal(true);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Error al procesar el pago.');
      setLoading(false);
    }
  };

  // ── Loading state while checking order on return ──
  if (checking) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin" />
          <span className="text-white/50 tracking-widest text-sm uppercase">Verificando tu pago...</span>
        </div>
      </div>
    );
  }

  // ── Payment result screens ──

  if (paymentResult === 'success') {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-[rgb(0,255,255)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[rgb(0,255,255)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">PAGO APROBADO</h1>
            <p className="text-white/70">
              Tu orden <span className="text-[rgb(0,255,255)] font-medium">{resultOrderId}</span> fue procesada correctamente.
            </p>
            <p className="text-sm text-white/50">
              Te enviaremos un email con los detalles de tu compra y la info de envío.
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

  if (paymentResult === 'rejected') {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-red-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">PAGO RECHAZADO</h1>
            <p className="text-white/70">
              El pago no pudo ser procesado. Verificá los datos de tu tarjeta o intentá con otro medio.
            </p>
            <Link
              to="/checkout"
              className="inline-block bg-white text-black py-3 px-8 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm"
            >
              Reintentar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (paymentResult === 'pending') {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-yellow-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">PAGO PENDIENTE</h1>
            <p className="text-white/70">
              Tu orden <span className="text-[rgb(0,255,255)] font-medium">{resultOrderId}</span> está siendo procesada.
            </p>
            <p className="text-sm text-white/50">
              Cuando se confirme el pago, te enviaremos un email de confirmación.
              Si el pago fue rechazado o expiró, podés volver a intentar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/tienda"
                className="inline-block bg-white text-black py-3 px-8 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm"
              >
                Volver a la tienda
              </Link>
            </div>
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
                <div className="flex items-center p-4 bg-zinc-900 rounded-sm border border-[rgb(0,255,255)] bg-cyan-900/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
                      <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Nave</p>
                      <p className="text-xs text-white/50">Tarjeta de crédito o débito</p>
                    </div>
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
                {loading ? 'Abriendo Nave...' : `Pagar $${totalPrice.toLocaleString('es-AR')}`}
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

      {showNaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center p-0 sm:p-6 bg-black/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nave-modal-title"
        >
          <div className="w-full h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[min(92vh,100dvh)] flex flex-col rounded-none sm:rounded-xl border-0 sm:border border-white/[0.12] bg-zinc-950 shadow-none sm:shadow-[0_0_0_1px_rgba(0,255,255,0.08),0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden max-w-full sm:max-w-[min(90rem,calc(100vw-3rem))]">
            <div className="relative shrink-0 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-8 sm:pt-6 sm:pb-5 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(255,0,255)] via-[rgb(0,255,255)] to-[rgb(255,0,255)] opacity-90" />
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-1 min-w-0 sm:space-y-1.5">
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.35em] text-[rgb(0,255,255)]/90">
                    Checkout seguro
                  </p>
                  <h2 id="nave-modal-title" className="text-base sm:text-xl font-heading tracking-[0.15em] sm:tracking-[0.2em] text-white">
                    Pago con Nave
                  </h2>
                  <p className="text-[11px] sm:text-sm text-white/55 sm:max-w-md leading-snug sm:leading-relaxed">
                    Completá el pago abajo. Al terminar, te llevamos al resultado de tu compra.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNaveModal(false)}
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-[rgb(0,255,255)]/40 hover:bg-[rgb(0,255,255)]/5 transition-colors"
                  aria-label="Cerrar ventana de pago"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overscroll-contain">
              <div className="p-3 sm:p-6 flex flex-col min-h-0 flex-1">
                <div className="rounded-md sm:rounded-lg overflow-hidden border border-black/10 shadow-inner flex flex-col flex-1 min-h-[min(52dvh,380px)] sm:min-h-[min(70dvh,560px)] bg-[#F4F4F4]">
                  <NaveEmbed key={paymentRequestId || 'nave'} paymentRequestId={paymentRequestId} />
                </div>
              </div>
            </div>

            <div className="shrink-0 px-4 sm:px-8 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:py-4 border-t border-white/[0.08] bg-black/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-3 text-white/45 text-xs">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-[rgb(0,255,255)]/80">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </span>
                <span className="leading-snug">
                  Procesado por <span className="text-white/70">Nave / Naranja X</span>. No compartimos los datos de tu tarjeta con nuestro servidor.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowNaveModal(false)}
                className="text-[11px] uppercase tracking-[0.2em] text-white/40 hover:text-white/80 transition-colors self-start sm:self-auto"
              >
                Volver al checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
