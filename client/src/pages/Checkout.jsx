import { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '../contexts/CartContext';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createNavePayment,
  getPaymentStatus,
  getMPOrderStatus,
  getCheckoutPaymentProvider,
  setCheckoutPaymentProvider,
} from '../services/checkout';
import { quoteShipping } from '../services/shipping';
import NaveEmbed from '../components/checkout/NaveEmbed';
import MercadoPagoBrick from '../components/checkout/MercadoPagoBrick';

const inputClass =
  'w-full bg-zinc-900 border-white/10 border rounded-sm p-3 focus:ring-1 focus:ring-[rgb(0,255,255)] focus:border-[rgb(0,255,255)] transition-colors';

const NAVE_ORDER_KEY = 'nave_pending_order';
function clearNavePendingStorage() {
  try { localStorage.removeItem(NAVE_ORDER_KEY); } catch { /* ignore */ }
}

function isCheckoutPaid(data) {
  const orderStatus = (data?.order_status || '').toLowerCase();
  if (['payment_failed', 'cancelled', 'chargeback', 'refunded', 'refund_pending'].includes(orderStatus)) return false;
  if (orderStatus === 'paid') return true;
  const mpS = (data?.mp_status || '').toLowerCase();
  const mpD = (data?.mp_status_detail || '').toLowerCase();
  if (mpS === 'processed' && mpD === 'accredited') return true;
  return (data?.nave_status || '').toUpperCase() === 'APPROVED';
}

async function fetchOrderPaymentStatus(orderId) {
  const provider = getCheckoutPaymentProvider();
  if (provider === 'mercadopago') return getMPOrderStatus(orderId);
  return getPaymentStatus(orderId);
}

// ── Shipping option card ──────────────────────────────────────────────────
function ShippingOptionCard({ option, selected, onSelect }) {
  const isSelected = selected?.id === option.id;
  const icon = option.mode === 'branch' ? '🏪' : '📦';
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className={`w-full flex items-center justify-between p-4 bg-zinc-900 rounded-sm border transition-colors text-left ${isSelected ? 'border-[rgb(0,255,255)] bg-cyan-900/10' : 'border-white/10 hover:border-white/30'
        }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${isSelected ? 'border-[rgb(0,255,255)] bg-[rgb(0,255,255)]' : 'border-white/30'
          }`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{icon} {option.label}</p>
          {option.eta && <p className="text-xs text-white/50 mt-0.5 truncate">{option.eta}</p>}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        {option.price === 0
          ? <span className="text-[rgb(0,255,255)] text-sm font-medium">Gratis</span>
          : <span className="text-white text-sm font-medium">${option.price.toLocaleString('es-AR')}</span>
        }
      </div>
    </button>
  );
}

function PaymentMethodCard({ id, title, subtitle, selected, onSelect }) {
  const isSelected = selected === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full flex items-center justify-between p-4 bg-zinc-900 rounded-sm border transition-colors text-left ${isSelected ? 'border-[rgb(0,255,255)] bg-cyan-900/10' : 'border-white/10 hover:border-white/30'
        }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${isSelected ? 'border-[rgb(0,255,255)] bg-[rgb(0,255,255)]' : 'border-white/30'
          }`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">{title}</p>
          {subtitle && <p className="text-xs text-white/50 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </button>
  );
}

// ── Loading overlay (full screen) ─────────────────────────────────────────
function LoadingOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-12 h-12 border-2 border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-white/60 text-sm tracking-widest uppercase">Procesando...</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function Checkout() {
  const { cart, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();
  const [searchParams] = useSearchParams();

  // Payment state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [resultOrderId, setResultOrderId] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showNaveModal, setShowNaveModal] = useState(false);
  const [paymentRequestId, setPaymentRequestId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');

  // Shipping quote state
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [selectedShipping, setSelectedShipping] = useState(null);

  const [form, setForm] = useState({
    email: '', name: '', phone: '',
    address: '', address2: '',
    city: '', state: '', zip: '',
    notes: '',
  });

  const orderIdFromUrl = searchParams.get('order_id');

  // ── Auto-select first home option when quote loads ────────────────────
  useEffect(() => {
    if (!shippingQuote) { setSelectedShipping(null); return; }
    if (shippingQuote.options?.length > 0) {
      const homeFirst = shippingQuote.options.find((o) => o.mode === 'home');
      setSelectedShipping(homeFirst || shippingQuote.options[0]);
    }
  }, [shippingQuote]);

  // ── Shipping quote debounced trigger ──────────────────────────────────
  const itemsWithProductId = cart.filter((item) => item.productId);

  useEffect(() => {
    const zip = form.zip.trim();
    const state = form.state.trim();

    if (zip.length < 4 || state.length < 3 || itemsWithProductId.length === 0) {
      setShippingQuote(null);
      setShippingError('');
      return;
    }

    setShippingLoading(true);
    setShippingError('');

    const timer = setTimeout(async () => {
      try {
        const result = await quoteShipping({
          items: itemsWithProductId.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.price,
          })),
          address: { postalCode: zip, province: state, city: form.city.trim() },
        });
        setShippingQuote(result);
      } catch (err) {
        setShippingError(err.message);
        setShippingQuote(null);
      } finally {
        setShippingLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.zip, form.state, form.city, totalPrice]);

  // ── Payment status check on return from Nave (callback_url) ──────────
  useEffect(() => {
    const pendingOrderId = orderIdFromUrl?.trim();
    if (!pendingOrderId) return;

    clearNavePendingStorage();
    setChecking(true);
    setResultOrderId(pendingOrderId);

    fetchOrderPaymentStatus(pendingOrderId)
      .then((data) => {
        if (isCheckoutPaid(data)) { setPaymentResult('success'); clearCart(); }
        else if (data.order_status === 'payment_failed') setPaymentResult('rejected');
        else setPaymentResult('pending');
      })
      .catch(() => setPaymentResult('pending'))
      .finally(() => setChecking(false));
  }, [orderIdFromUrl, clearCart]);

  useEffect(() => {
    if (paymentResult === 'success') clearCart();
  }, [paymentResult, clearCart]);

  // ── Auto-poll when status is pending (webhook may arrive any second) ──
  const pollCountRef = useRef(0);
  useEffect(() => {
    if (paymentResult !== 'pending' || !resultOrderId) return;

    pollCountRef.current = 0;
    const MAX_POLLS = 24; // ~2 minutes at 5s intervals

    const interval = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > MAX_POLLS) {
        clearInterval(interval);
        return;
      }
      try {
        const data = await fetchOrderPaymentStatus(resultOrderId);
        if (isCheckoutPaid(data)) {
          clearInterval(interval);
          setPaymentResult('success');
          clearCart();
        } else if (data.order_status === 'payment_failed') {
          clearInterval(interval);
          setPaymentResult('rejected');
        }
      } catch {
        // ignore poll errors, keep trying
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentResult, resultOrderId, clearCart]);

  useEffect(() => {
    if (paymentMethod === 'mercadopago') {
      clearNavePendingStorage();
      setShowNaveModal(false);
      setPaymentRequestId(null);
    }
  }, [paymentMethod]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((p) => ({ ...p, [id]: value }));
    setError('');
  };

  const canSubmit = itemsWithProductId.length > 0 && itemsWithProductId.length === cart.length;
  const closeNaveModal = () => {
    clearNavePendingStorage();
    setShowNaveModal(false);
    setPaymentRequestId(null);
  };

  const shippingCost = selectedShipping?.price ?? 0;
  const grandTotal = totalPrice + shippingCost;
  const hasShippingInputs = form.zip.trim().length >= 4 && form.state.trim().length >= 3;
  const waitingForShippingQuote = hasShippingInputs && (shippingLoading || (!shippingError && !shippingQuote));
  const hasShippingSelection = Boolean(shippingQuote?.provider) && Boolean(selectedShipping?.mode);
  const isSubmitDisabled =
    loading
    || cart.length === 0
    || !canSubmit
    || !hasShippingInputs
    || waitingForShippingQuote
    || !hasShippingSelection;

  const getCheckoutPayload = useCallback(() => {
    const lineItems = cart.filter((item) => item.productId);
    const name = (form.name || '').trim();
    const email = (form.email || '').trim();
    return {
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
      shipping_cost: shippingCost,
      items: lineItems.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price,
        name: item.name || 'Producto',
      })),
      shipping_provider: shippingQuote?.provider || undefined,
      shipping_mode: selectedShipping?.mode || undefined,
      shipping_service_type: selectedShipping?.serviceType || undefined,
      shipping_is_free: shippingQuote?.freeShipping || shippingCost === 0,
      shipping_agency_code: selectedShipping?.agencyCode || undefined,
      shipping_agency_name: selectedShipping?.agencyName || undefined,
      shipping_customer_id: shippingQuote?.customerId || undefined,
      shipping_quote_payload: shippingQuote
        ? { parcel: shippingQuote.parcel, selectedOption: selectedShipping }
        : undefined,
      shipping_quote_response: shippingQuote || undefined,
    };
  }, [cart, form, shippingCost, shippingQuote, selectedShipping]);

  const handleMPBrickSuccess = (data) => {
    setError('');
    setResultOrderId(data.order_id);
    const st = (data.order_status || '').toLowerCase();
    if (st === 'paid') {
      setPaymentResult('success');
      clearCart();
    } else if (st === 'payment_failed') {
      setPaymentResult('rejected');
    } else {
      setPaymentResult('pending');
    }
  };

  const handleMPBrickError = (msg) => {
    setError(typeof msg === 'string' ? msg : 'Error al procesar el pago.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (paymentMethod === 'mercadopago') return;

    const name = (form.name || '').trim();
    const email = (form.email || '').trim();
    if (!name || !email) { setError('Completá nombre y email.'); return; }
    if (!canSubmit) { setError('Algunos productos no están disponibles. Volvé a la tienda y agregalos de nuevo.'); return; }
    if (!hasShippingInputs) { setError('Completá provincia y código postal para calcular el envío.'); return; }
    if (waitingForShippingQuote) { setError('Esperá a que carguen las opciones de envío antes de pagar.'); return; }
    if (!hasShippingSelection) { setError('Seleccioná una opción de envío para continuar con el pago.'); return; }

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
        shipping_cost: shippingCost,
        callback_url: `${window.location.origin}/checkout?order_id=PLACEHOLDER`,
        items: itemsWithProductId.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.price,
          name: item.name || 'Producto',
        })),
        // Datos del proveedor cotizado
        shipping_provider: shippingQuote?.provider || undefined,
        shipping_mode: selectedShipping?.mode || undefined,
        shipping_service_type: selectedShipping?.serviceType || undefined,
        shipping_is_free: shippingQuote?.freeShipping || shippingCost === 0,
        shipping_agency_code: selectedShipping?.agencyCode || undefined,
        shipping_agency_name: selectedShipping?.agencyName || undefined,
        shipping_customer_id: shippingQuote?.customerId || undefined,
        shipping_quote_payload: shippingQuote
          ? { parcel: shippingQuote.parcel, selectedOption: selectedShipping }
          : undefined,
        shipping_quote_response: shippingQuote || undefined,
      };

      setCheckoutPaymentProvider('nave');
      const data = await createNavePayment(payload);
      setResultOrderId(data.order_id);
      const hasSdkConfig = Boolean((import.meta.env.VITE_NAVE_PUBLIC_KEY || '').toString().trim());
      const canUseEmbed = Boolean(data.payment_request_id) && hasSdkConfig;

      if (canUseEmbed) {
        setPaymentRequestId(data.payment_request_id);
        setShowNaveModal(true);
        setLoading(false);
        return;
      }
      // Fallback robusto: si falta SDK config o payment_request_id, redirigimos al hosted checkout.
      if (data.checkout_url) {
        window.location.assign(data.checkout_url);
        return;
      }
      setError('No se recibió la URL de pago. Intentá de nuevo.');
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Error al procesar el pago.');
      setLoading(false);
    }
  };

  // ── Loading / result screens ──────────────────────────────────────────
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

  if (paymentResult === 'success') {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-full border-2 border-[rgb(0,255,255)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[rgb(0,255,255)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">PAGO APROBADO</h1>
            <p className="text-white/70">Tu orden <span className="text-[rgb(0,255,255)] font-medium">{resultOrderId}</span> fue procesada correctamente.</p>
            <p className="text-sm text-white/50">Te enviamos un email con los detalles de tu compra. Te avisaremos cuando despachemos tu pedido.</p>
            <Link to="/tienda" className="inline-block bg-white text-black py-3 px-8 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm">
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
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">PAGO RECHAZADO</h1>
            <p className="text-white/70">El pago no pudo ser procesado. Verificá los datos de tu tarjeta o intentá con otro medio.</p>
            <Link to="/checkout" className="inline-block bg-white text-black py-3 px-8 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm">
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
              <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">VERIFICANDO PAGO</h1>
            <p className="text-white/70">
              Tu orden <span className="text-[rgb(0,255,255)] font-medium">{resultOrderId}</span> está siendo procesada.
            </p>
            <p className="text-sm text-white/50">
              Estamos esperando la confirmación. Esta pantalla se actualiza automáticamente — no hace falta que hagas nada.
            </p>
            <p className="text-xs text-white/30">Si el pago fue rechazado o expiró, podés volver a intentar.</p>
            <Link to="/tienda" className="inline-block text-sm text-white/40 hover:text-white transition-colors tracking-widest border-b border-white/20 pb-0.5">
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main checkout form ────────────────────────────────────────────────
  const showShippingSection = form.zip.trim().length >= 4 && form.state.trim().length >= 3;
  const correoOptions = shippingQuote?.provider === 'correo_argentino' ? (shippingQuote.options || []) : [];

  return (
    <div className="bg-black text-white min-h-screen">

      {/* Global loading overlay while calling Nave API */}
      <LoadingOverlay visible={loading} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">FINALIZAR COMPRA</h1>
          <Link to="/tienda" className="text-sm text-white/50 hover:text-white transition-colors tracking-widest mt-4 inline-block">
            &larr; o volver a la tienda
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-16">

          {/* Left: Form */}
          <div className="space-y-8 lg:order-2">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* INFORMACIÓN DE ENVÍO */}
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

              {/* MÉTODO DE ENVÍO */}
              {showShippingSection && (
                <div>
                  <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4 mb-6">MÉTODO DE ENVÍO</h2>

                  {shippingLoading && (
                    <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-sm border border-white/10">
                      <div className="w-4 h-4 border border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span className="text-sm text-white/60">Calculando opciones de envío...</span>
                    </div>
                  )}

                  {!shippingLoading && shippingError && (
                    <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-sm text-sm text-amber-200">
                      No se pudo calcular el costo de envío. Se coordinará con el pedido.
                    </div>
                  )}

                  {!shippingLoading && !shippingError && correoOptions.length > 0 && (
                    <div className="space-y-2">
                      {shippingQuote.freeShipping && (
                        <p className="text-xs text-[rgb(0,255,255)] mb-3">
                          🎉 ¡Envío gratis en Correo Argentino Clásico por comprar 2 o más perfumes!
                        </p>
                      )}
                      {correoOptions.map((option) => (
                        <ShippingOptionCard
                          key={option.id}
                          option={option}
                          selected={selectedShipping}
                          onSelect={setSelectedShipping}
                        />
                      ))}
                    </div>
                  )}

                  {!shippingLoading && !shippingError && shippingQuote?.provider === 'correo_argentino' && correoOptions.length === 0 && (
                    <div className="p-4 bg-zinc-900 border border-white/10 rounded-sm text-sm text-white/60">
                      No encontramos opciones de envío para esa dirección. Se coordinará con el pedido.
                    </div>
                  )}
                </div>
              )}

              {/* MÉTODO DE PAGO */}
              <div>
                <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4 mb-6">MÉTODO DE PAGO</h2>
                <div className="space-y-2 mb-6">
                  <PaymentMethodCard
                    id="mercadopago"
                    title="Mercado Pago"
                    subtitle="Tarjeta, cuotas y medios disponibles (Brick seguro)"
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                  />
                  <PaymentMethodCard
                    id="nave"
                    title="Nave / Naranja X"
                    subtitle="Checkout embebido o redirección"
                    selected={paymentMethod}
                    onSelect={setPaymentMethod}
                  />
                </div>

                {paymentMethod === 'mercadopago' && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/50">
                      Total a pagar:{' '}
                      <span className="text-[rgb(0,255,255)] font-medium">${grandTotal.toLocaleString('es-AR')}</span>
                      . Completá los datos de la tarjeta abajo.
                    </p>
                    <MercadoPagoBrick
                      key={`mp-${grandTotal}-${selectedShipping?.id || 'none'}`}
                      amount={grandTotal}
                      disabled={isSubmitDisabled}
                      getCheckoutPayload={getCheckoutPayload}
                      onSuccess={handleMPBrickSuccess}
                      onError={handleMPBrickError}
                    />
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              {paymentMethod === 'nave' && (
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="w-full bg-white text-black py-4 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Procesando...' : `Pagar $${grandTotal.toLocaleString('es-AR')}`}
                </button>
              )}
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-6 lg:order-1 bg-zinc-900/50 p-8 rounded-lg border border-white/10">
            <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-4">TUS PRODUCTOS</h2>
            {cart.length > 0 ? (
              <div className="space-y-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <div className="w-24 h-32 bg-zinc-900 rounded-sm overflow-hidden flex-shrink-0">
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
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors" aria-label="Restar uno">-</button>
                          <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors" aria-label="Añadir uno">+</button>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.id)} className="text-[10px] text-white/40 hover:text-red-400 tracking-widest transition-colors uppercase border-b border-transparent hover:border-red-400/50">
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
                  {shippingLoading
                    ? <span className="text-white/40 text-xs">Calculando...</span>
                    : selectedShipping
                      ? shippingCost === 0
                        ? <span className="text-[rgb(0,255,255)]">Gratis</span>
                        : <span>${shippingCost.toLocaleString('es-AR')}</span>
                      : <span className="text-[rgb(0,255,255)]">Gratis</span>
                  }
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-white/10 mt-4">
                  <span className="text-white font-heading tracking-widest">TOTAL</span>
                  <span className="text-2xl font-light text-white tracking-tight">
                    ${grandTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {showNaveModal && (
        <div
          className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center p-0 sm:p-6 bg-black/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nave-modal-title"
        >
          <div className="w-full h-[100dvh] max-h-[100dvh] sm:h-[min(96dvh,920px)] sm:max-h-[min(96dvh,920px)] flex flex-col rounded-none sm:rounded-xl border-0 sm:border border-white/[0.12] bg-zinc-950 overflow-hidden max-w-full sm:max-w-[calc(100vw-3rem)]">
            <div className="relative shrink-0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 sm:px-5 sm:pt-4 sm:pb-3 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(255,0,255)] via-[rgb(0,255,255)] to-[rgb(255,0,255)] opacity-90" />
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.28em] text-[rgb(0,255,255)]/90">Checkout seguro</p>
                  <h2 id="nave-modal-title" className="text-base sm:text-lg font-heading tracking-[0.12em] text-white">Pago con Nave</h2>
                  <p className="text-[11px] text-white/50 leading-snug line-clamp-2">Completá el pago abajo. Al terminar, te llevamos al resultado de tu compra.</p>
                </div>
                <button
                  type="button"
                  onClick={closeNaveModal}
                  className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/60 hover:text-white hover:border-[rgb(0,255,255)]/40 hover:bg-[rgb(0,255,255)]/5 transition-colors"
                  aria-label="Cerrar ventana de pago"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <div className="p-2 sm:p-3">
                <div className="rounded-md sm:rounded-lg overflow-hidden border border-black/10 shadow-inner bg-[#F4F4F4]">
                  <NaveEmbed key={paymentRequestId || 'nave'} paymentRequestId={paymentRequestId} />
                </div>
              </div>
            </div>
            <div className="shrink-0 px-3 sm:px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/[0.06] bg-black/30 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="flex-1 min-w-0 text-[10px] sm:text-[11px] text-white/40 leading-tight">
                <span className="text-white/55">Nave / Naranja X</span>
                <span className="text-white/35"> · </span>
                <span className="text-white/40">tarjeta no pasa por nuestro servidor</span>
              </p>
              <button
                type="button"
                onClick={closeNaveModal}
                className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-white/45 hover:text-white/85 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}