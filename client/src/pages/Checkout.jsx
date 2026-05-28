import { useState, useEffect, useRef, useCallback } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createNavePayment,
  createMPPreference,
  getPaymentStatus,
  getMPOrderStatus,
  getCheckoutPaymentProvider,
  setCheckoutPaymentProvider,
} from '../services/checkout';
import { quoteShipping, fetchNearbyCorreoAgencies } from '../services/shipping';
import NaveEmbed from '../components/checkout/NaveEmbed';
import { trackInitiateCheckout, captureAttributionData, getAttributionForServer, getUTMsForServer } from '../lib/metaPixel';
import { getTrackedOrder, saveTrackedOrder, updateTrackedOrderStatus } from '../services/orderTracking';
import { firePurchaseEvent } from '../lib/firePurchaseEvent';
import { getCrossedPrice } from '../lib/crossedPrices';

// Precio por item cuando un admin compra en modo prueba (matchea el override
// del server en `server/lib/testMode.js`). El server SIEMPRE valida con el
// bearer token de Supabase, así que esta constante es solo para que la UI
// muestre el mismo monto que efectivamente se va a cobrar.
const ADMIN_TEST_UNIT_PRICE = 150;

const PROVINCIAS = [
  'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

const PROVIDER_LABELS = {
  correo_argentino: 'Correo Argentino',
  gestionar: 'Gestionar',
};

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

async function fetchOrderPaymentStatus(orderId, paymentId) {
  const provider = getCheckoutPaymentProvider();
  if (provider === 'mercadopago') return getMPOrderStatus(orderId, paymentId);
  return getPaymentStatus(orderId);
}

// ── Shipping option card ──────────────────────────────────────────────────
function ShippingOptionCard({ option, selected, onSelect }) {
  const isSelected = selected?.id === option.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(option)}
      className={`ship-opt ${isSelected ? 'on' : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`dot ${isSelected ? 'on' : ''}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm">{option.label}</span>
            {option.mode === 'branch' && (
              <span className="text-[9px] uppercase tracking-widest bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                Retiro
              </span>
            )}
          </div>
          {option.eta && <div className="text-[11px] text-white/45 mt-0.5">{option.eta}</div>}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        {option.price === 0
          ? <span className="text-[rgb(0,255,255)] text-sm font-medium">Gratis</span>
          : <span className="text-white text-sm tabular-nums">${option.price.toLocaleString('es-AR')}</span>}
      </div>
    </button>
  );
}

// ── Branch picker (Correo "Retiro en sucursal") ───────────────────────────
function BranchPicker({ branches, loading, error, selected, onSelect }) {
  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-3 p-3 bg-zinc-900/40 rounded-md border border-white/10">
        <div className="w-4 h-4 border border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span className="text-sm text-white/60">Buscando sucursales cercanas...</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-3 p-3 bg-amber-900/20 border border-amber-500/30 rounded-md text-sm text-amber-200">
        No se pudieron cargar las sucursales cercanas. Probá con otro código postal.
      </div>
    );
  }
  if (!branches || branches.length === 0) {
    return (
      <div className="mt-3 p-3 bg-zinc-900/40 border border-white/10 rounded-md text-sm text-white/60">
        No encontramos sucursales cercanas para ese código postal.
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] uppercase tracking-widest text-white/45">Elegí la sucursal de retiro</p>
      {branches.map((b) => {
        const isOn = selected?.code === b.code;
        return (
          <button
            key={b.code}
            type="button"
            onClick={() => onSelect(b)}
            className={`ship-opt ${isOn ? 'on' : ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className={`dot ${isOn ? 'on' : ''}`} />
              <div className="min-w-0 text-left">
                <div className="text-white text-sm truncate">{b.name}</div>
                <div className="text-[11px] text-white/45 mt-0.5 truncate">
                  {[b.address, b.locality, b.postalCode].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PaymentMethodCard({ id, title, subtitle, logoGradient, logoLabel, selected, onSelect }) {
  const isSelected = selected === id;
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`pm-tab ${isSelected ? 'on' : ''}`}
    >
      <div className="flex w-full items-center justify-between">
        <span className={`dot ${isSelected ? 'on' : ''}`} />
        <div className="flex items-center gap-2">
          <div className="h-4 w-7 rounded-sm" style={{ background: logoGradient }} />
          <span className="text-[11px] uppercase tracking-widest text-white/50">{logoLabel}</span>
        </div>
      </div>
      <div className="mt-3 text-sm text-white">{title}</div>
      {subtitle && <div className="text-[11px] text-white/45 leading-snug">{subtitle}</div>}
    </button>
  );
}

// ── Section header (01/02/...) ────────────────────────────────────────────
function SectionHeader({ n, title, status, right }) {
  return (
    <div className="card-h">
      <div className="flex items-center gap-3">
        <span className={`step-num ${status === 'done' ? 'done' : ''}`}>{n}</span>
        <h2 className="font-heading text-[13px] uppercase tracking-[0.18em]">{title}</h2>
      </div>
      <div className="flex items-center gap-2 min-w-0">{right}</div>
    </div>
  );
}

// ── Field wrapper: label monoespaciado uppercase + asterisco cyan ─────────
function Field({ id, label, required, hint, span = 1, labelStyle, children }) {
  return (
    <div style={{ gridColumn: `span ${span} / span ${span}` }}>
      <label className="label" htmlFor={id} style={labelStyle}>
        {label}{required && <span className="req">*</span>}
        {hint && (
          <span className="ml-auto text-[10px] text-white/30 normal-case tracking-normal">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// ── Trust badges 2x2 (decorativos) ────────────────────────────────────────
function TrustBadges() {
  const badges = [
    {
      t: 'Pago 100% seguro', s: 'SSL · PCI-DSS',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" /><path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4" /></svg>
      ),
    },
    {
      t: 'Envío a todo el país', s: 'Correo Argentino',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><rect x="2" y="7" width="13" height="10" rx="1" /><path d="M15 10h4l3 3v4h-7" /><circle cx="6.5" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></svg>
      ),
    },
    {
      t: 'Cambios y devoluciones', s: 'Hasta 30 días',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
      ),
    },
    {
      t: 'Atención humana', s: 'Lun a Vie · 10-18hs',
      icon: (
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 0-3 6.7L21 21l-1.5-4" /><circle cx="9" cy="12" r="1" /><circle cx="13" cy="12" r="1" /><circle cx="17" cy="12" r="1" /></svg>
      ),
    },
  ];
  return (
    <div className="badge-row">
      {badges.map((b, i) => (
        <div key={i} className="badge-trust">
          <span className="text-[rgb(0,255,255)] mt-0.5">{b.icon}</span>
          <div>
            <div className="text-[12px] text-white leading-tight">{b.t}</div>
            <div className="text-[10px] text-white/40 mt-0.5 uppercase tracking-widest">{b.s}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Order summary card (sticky a la derecha en desktop, colapsable en mobile) ─
function OrderSummaryCard({
  cart, totalPrice, shippingCost, total, providerLabel, shippingLoading,
  updateQuantity, removeFromCart, adminTest,
}) {
  return (
    <div className="card-section overflow-hidden">
      <div className="card-h">
        <div className="flex items-center gap-3">
          <span className="step-num">↦</span>
          <h2 className="font-heading text-[13px] uppercase tracking-[0.18em]">Tu pedido</h2>
        </div>
        <span className="text-[10px] text-white/40 uppercase tracking-widest">
          {cart.length} {cart.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {cart.length === 0 && (
          <p className="text-white/40 text-sm py-6 text-center">Tu carrito está vacío.</p>
        )}
        {cart.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="relative ticks w-[88px] h-[112px] rounded-md overflow-hidden flex-shrink-0 bg-zinc-900">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-heading text-[13px] tracking-[0.12em] text-white pr-2 leading-snug">
                    {item.name}
                  </h3>
                  <div className="text-right flex-shrink-0">
                    {!adminTest && (() => {
                      const cp = getCrossedPrice(item.slug);
                      if (!cp) return null;
                      const crossedN = parseInt(cp.replace(/\D/g, ''), 10);
                      return (
                        <p className="text-[11px] text-white/40 line-through tabular-nums">
                          ${(crossedN * item.quantity).toLocaleString('es-AR')}
                        </p>
                      );
                    })()}
                    {adminTest && (
                      <p className="text-[11px] text-white/40 line-through tabular-nums">
                        ${(item.price * item.quantity).toLocaleString('es-AR')}
                      </p>
                    )}
                    <p className="text-sm text-white whitespace-nowrap tabular-nums">
                      ${((adminTest ? ADMIN_TEST_UNIT_PRICE : item.price) * item.quantity).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-white/45 mt-0.5">60ml · Eau de Parfum</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="qty">
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Restar uno">−</button>
                  <span className="v">{item.quantity}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Sumar uno">+</button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  className="text-[10px] text-white/35 hover:text-[rgb(255,0,255)] uppercase tracking-[0.18em] transition-colors"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.06] px-5 py-4 space-y-1.5 bg-white/[0.012]">
        <div className="flex justify-between text-[13px] text-white/55">
          <span>Subtotal</span>
          <span className="tabular-nums">${totalPrice.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between text-[13px] text-white/55">
          <span>
            Envío
            {providerLabel && (
              <span className="text-white/35 ml-1">· {providerLabel}</span>
            )}
          </span>
          {shippingLoading
            ? <span className="text-white/40 text-[11px]">Calculando...</span>
            : shippingCost === 0
              ? <span className="text-[rgb(0,255,255)]">Gratis</span>
              : <span className="tabular-nums">${shippingCost.toLocaleString('es-AR')}</span>}
        </div>
        <div className="pt-3 mt-2 border-t border-white/[0.07] flex justify-between items-end">
          <span className="font-heading text-[12px] uppercase text-white/70 tracking-[0.18em]">Total</span>
          <div className="text-right">
            <div className="text-[9px] text-white/35 uppercase tracking-[0.22em]">ARS</div>
            <div className="text-2xl text-white font-light tabular-nums leading-none">
              ${total.toLocaleString('es-AR')}
            </div>
          </div>
        </div>
      </div>
    </div>
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
  const { isAdmin, session } = useAuth();
  const accessToken = session?.access_token || null;
  const [searchParams] = useSearchParams();

  // ── Admin test mode (compra de prueba) ────────────────────────────────
  // Si está logueado un admin, mostramos y cobramos $150 por item y envío $0.
  // El server valida el token y aplica el mismo override → si alguien intenta
  // mandar isAdmin desde el frontend sin token válido, el server lo ignora.
  const adminItemCount = cart.reduce((n, i) => n + i.quantity, 0);
  const effectiveUnitPrice = (item) => (isAdmin ? ADMIN_TEST_UNIT_PRICE : item.price);
  const effectiveSubtotal = isAdmin ? adminItemCount * ADMIN_TEST_UNIT_PRICE : totalPrice;

  // Payment state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [resultOrderId, setResultOrderId] = useState(null);
  const [checking, setChecking] = useState(false);
  const [showNaveModal, setShowNaveModal] = useState(false);
  const [paymentRequestId, setPaymentRequestId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mercadopago');
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Shipping quote state
  const [shippingQuote, setShippingQuote] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [selectedShipping, setSelectedShipping] = useState(null);

  // ── Correo branch (Retiro en sucursal) selection state ────────────────
  const [branchList, setBranchList] = useState([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchError, setBranchError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [form, setForm] = useState({
    email: '', name: '', phone: '',
    address: '', address2: '',
    city: '', state: '', zip: '',
    notes: '',
  });

  const orderIdFromUrl = searchParams.get('order_id');
  const walletPaymentIdFromUrl = searchParams.get('payment_id') || searchParams.get('collection_id');

  // ── Auto-select first home option when quote loads ────────────────────
  useEffect(() => {
    if (!shippingQuote) { setSelectedShipping(null); return; }
    if (shippingQuote.options?.length > 0) {
      const homeFirst = shippingQuote.options.find((o) => o.mode === 'home');
      setSelectedShipping(homeFirst || shippingQuote.options[0]);
    }
  }, [shippingQuote]);

  // ── Fetch nearby Correo branches when "Retiro en sucursal" is selected ─
  useEffect(() => {
    if (selectedShipping?.mode !== 'branch') {
      setBranchList([]);
      setSelectedBranch(null);
      setBranchError('');
      return;
    }
    const province = form.state.trim();
    const postalCode = form.zip.trim();
    if (!province || postalCode.length < 4) return;

    let cancelled = false;
    setBranchLoading(true);
    setBranchError('');
    setSelectedBranch(null);
    fetchNearbyCorreoAgencies({ province, postalCode })
      .then((list) => { if (!cancelled) setBranchList(list); })
      .catch((err) => { if (!cancelled) { setBranchError(err.message); setBranchList([]); } })
      .finally(() => { if (!cancelled) setBranchLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShipping?.id, selectedShipping?.mode, form.state, form.zip]);

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

    if (walletPaymentIdFromUrl) setCheckoutPaymentProvider('mercadopago');

    fetchOrderPaymentStatus(pendingOrderId, walletPaymentIdFromUrl || undefined)
      .then((data) => {
        if (!getTrackedOrder(pendingOrderId)) {
          saveTrackedOrder({
            orderId: pendingOrderId,
            paymentMethod: walletPaymentIdFromUrl ? 'mercadopago' : (getCheckoutPaymentProvider() || null),
            status: data.order_status || 'payment_initiated',
          });
        }
        if (isCheckoutPaid(data)) {
          firePurchaseEvent(pendingOrderId);
          setPaymentResult('success');
          updateTrackedOrderStatus(pendingOrderId, 'paid');
          setTimeout(() => clearCart(), 500);
        } else if (data.order_status === 'payment_failed') {
          setPaymentResult('rejected');
          updateTrackedOrderStatus(pendingOrderId, 'payment_failed');
        } else {
          setPaymentResult('pending');
          updateTrackedOrderStatus(pendingOrderId, data.order_status || 'pending_payment');
        }
      })
      .catch(() => setPaymentResult('pending'))
      .finally(() => setChecking(false));
  }, [orderIdFromUrl, walletPaymentIdFromUrl, clearCart]);

  const initiateCheckoutFired = useRef(false);
  const checkoutSnapshot = useRef(null);
  useEffect(() => {
    if (initiateCheckoutFired.current || cart.length === 0 || orderIdFromUrl) return;
    initiateCheckoutFired.current = true;
    const items = cart.map((i) => ({ id: i.productId || i.id, quantity: i.quantity }));
    checkoutSnapshot.current = { items, totalValue: totalPrice };
    trackInitiateCheckout({ items, totalValue: totalPrice });
  }, [cart, totalPrice, orderIdFromUrl]);

  const purchaseFired = useRef(false);
  useEffect(() => {
    if (paymentResult !== 'success') return;
    if (purchaseFired.current) return;
    purchaseFired.current = true;
    setTimeout(() => clearCart(), 600);
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
          firePurchaseEvent(resultOrderId);
          setPaymentResult('success');
          updateTrackedOrderStatus(resultOrderId, 'paid');
          setTimeout(() => clearCart(), 500);
        } else if (data.order_status === 'payment_failed') {
          clearInterval(interval);
          setPaymentResult('rejected');
          updateTrackedOrderStatus(resultOrderId, 'payment_failed');
        }
      } catch {
        // ignore poll errors, keep trying
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentResult, resultOrderId, clearCart]);

  // ── Polling para Nave embed ──────────────────────────────────────────────
  // El modal de Nave embebido no hace redirect de vuelta, así que no hay
  // orderIdFromUrl que dispare la verificación. Necesitamos polear activamente
  // mientras el modal esté abierto para detectar APPROVED / REJECTED.
  useEffect(() => {
    if (!showNaveModal || !resultOrderId) return;

    let stopped = false;
    let count = 0;
    const MAX_POLLS = 72; // 6 minutos a 5s

    const interval = setInterval(async () => {
      count += 1;
      if (count > MAX_POLLS) { clearInterval(interval); return; }
      try {
        const data = await fetchOrderPaymentStatus(resultOrderId);
        if (stopped) return;
        if (isCheckoutPaid(data)) {
          clearInterval(interval);
          firePurchaseEvent(resultOrderId);
          setShowNaveModal(false);
          setPaymentResult('success');
          updateTrackedOrderStatus(resultOrderId, 'paid');
          setTimeout(() => clearCart(), 500);
        } else if (data.order_status === 'payment_failed' || data.order_status === 'cancelled') {
          clearInterval(interval);
          setShowNaveModal(false);
          setPaymentResult('rejected');
          updateTrackedOrderStatus(resultOrderId, 'payment_failed');
        }
      } catch { /* ignorar errores transitorios, seguir poeleando */ }
    }, 5000);

    return () => { stopped = true; clearInterval(interval); };
  }, [showNaveModal, resultOrderId, clearCart]);

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

  const rawShippingCost = selectedShipping?.price ?? 0;
  // En modo admin-test el envío se cobra $0 (override server-side validado).
  const shippingCost = isAdmin ? 0 : rawShippingCost;
  const grandTotal = effectiveSubtotal + shippingCost;
  const hasShippingInputs = form.zip.trim().length >= 4 && form.state.trim().length >= 3;
  const waitingForShippingQuote = hasShippingInputs && (shippingLoading || (!shippingError && !shippingQuote));
  const needsBranchSelection = selectedShipping?.mode === 'branch';
  const hasShippingSelection =
    Boolean(shippingQuote?.provider)
    && Boolean(selectedShipping?.mode)
    && (!needsBranchSelection || Boolean(selectedBranch));
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
      shipping_provider: selectedShipping?.provider || shippingQuote?.provider || undefined,
      shipping_mode: selectedShipping?.mode || undefined,
      shipping_service_type: selectedShipping?.serviceType || undefined,
      shipping_is_free: shippingQuote?.freeShipping || shippingCost === 0,
      shipping_agency_code: selectedBranch?.code || selectedShipping?.agencyCode || undefined,
      shipping_agency_name: selectedBranch?.name || selectedShipping?.agencyName || undefined,
      shipping_agency_address: selectedBranch?.address || undefined,
      shipping_customer_id: shippingQuote?.customerId || undefined,
      shipping_quote_payload: shippingQuote
        ? { parcel: shippingQuote.parcel, selectedOption: selectedShipping }
        : undefined,
      shipping_quote_response: shippingQuote || undefined,
    };
  }, [cart, form, shippingCost, shippingQuote, selectedShipping, selectedBranch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const name = (form.name || '').trim();
    const email = (form.email || '').trim();
    if (!name || !email) { setError('Completá nombre y email.'); return; }
    if (!canSubmit) { setError('Algunos productos no están disponibles. Volvé a la tienda y agregalos de nuevo.'); return; }
    if (!hasShippingInputs) { setError('Completá provincia y código postal para calcular el envío.'); return; }
    if (waitingForShippingQuote) { setError('Esperá a que carguen las opciones de envío antes de pagar.'); return; }
    if (needsBranchSelection && !selectedBranch) { setError('Seleccioná la sucursal de Correo donde vas a retirar tu pedido.'); return; }
    if (!hasShippingSelection) { setError('Seleccioná una opción de envío para continuar con el pago.'); return; }

    setLoading(true);
    try {
      const basePayload = {
        ...getAttributionForServer(),
        ...getUTMsForServer(),
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
        // En modo admin-test mandamos shipping=0 y unit_price=150 para que MP
        // muestre el monto correcto en el Checkout Pro; el server re-valida con
        // el bearer token y rechaza el override si no es admin.
        shipping_cost: shippingCost,
        items: itemsWithProductId.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: effectiveUnitPrice(item),
          name: item.name || 'Producto',
        })),
        shipping_provider: selectedShipping?.provider || shippingQuote?.provider || undefined,
        shipping_mode: selectedShipping?.mode || undefined,
        shipping_service_type: selectedShipping?.serviceType || undefined,
        shipping_is_free: shippingQuote?.freeShipping || shippingCost === 0,
        shipping_agency_code: selectedBranch?.code || selectedShipping?.agencyCode || undefined,
        shipping_agency_name: selectedBranch?.name || selectedShipping?.agencyName || undefined,
        shipping_agency_address: selectedBranch?.address || undefined,
        shipping_customer_id: shippingQuote?.customerId || undefined,
        shipping_quote_payload: shippingQuote
          ? { parcel: shippingQuote.parcel, selectedOption: selectedShipping }
          : undefined,
        shipping_quote_response: shippingQuote || undefined,
      };

      // Snapshot del carrito para trackPurchase post-redirect
      try {
        localStorage.setItem('purchase_snapshot', JSON.stringify({
          items: itemsWithProductId.map((i) => ({ id: i.productId || i.id, quantity: i.quantity })),
          totalValue: grandTotal,
        }));
      } catch { /* ignore */ }

      // ── Branch: Mercado Pago → Checkout Pro (redirect) ─────────────────
      if (paymentMethod === 'mercadopago') {
        setCheckoutPaymentProvider('mercadopago');
        const mpData = await createMPPreference(
          {
            ...basePayload,
            callback_url: `${window.location.origin}/checkout`,
          },
          { accessToken },
        );
        if (!mpData?.init_point) {
          setError('No se pudo preparar el pago con Mercado Pago. Intentá de nuevo.');
          setLoading(false);
          return;
        }
        if (mpData.order_id) {
          saveTrackedOrder({
            orderId: mpData.order_id,
            paymentMethod: 'mercadopago',
            total: grandTotal,
            customerEmail: email,
            status: 'payment_initiated',
          });
        }
        // Backup adicional para que el callback recupere el carrito si el snapshot global se pisa
        try {
          const snap = JSON.stringify({
            items: itemsWithProductId.map((i) => ({ id: i.productId || i.id, quantity: i.quantity })),
            totalValue: grandTotal,
          });
          localStorage.setItem('mp_purchase_backup', snap);
          sessionStorage.setItem('mp_purchase_backup', snap);
        } catch { /* ignore */ }
        // Guardar fbclid/_fbc/_fbp ANTES de salir del sitio: si iOS ITP las elimina durante
        // la sesión en MP, las restauramos cuando el usuario vuelve (ver firePurchaseEvent.js).
        captureAttributionData();
        window.location.assign(mpData.init_point);
        return;
      }

      // ── Branch: Nave / Naranja X ─────────────────────────────────────
      const payload = { ...basePayload, callback_url: `${window.location.origin}/checkout?order_id=PLACEHOLDER` };
      setCheckoutPaymentProvider('nave');
      const data = await createNavePayment(payload, { accessToken });
      setResultOrderId(data.order_id);
      if (data.order_id) {
        saveTrackedOrder({
          orderId: data.order_id,
          paymentMethod: 'nave',
          total: grandTotal,
          customerEmail: email,
          status: 'payment_initiated',
        });
      }
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
        captureAttributionData();
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
  const contactDone = !!form.email.trim() && !!form.name.trim();
  const addressDone = !!form.city.trim() && !!form.state.trim() && form.zip.trim().length >= 4;
  const shippingDone = showShippingSection && !!selectedShipping?.mode;
  // El provider efectivo viene de la opción elegida (cuando hay AMBA, Gestionar y Correo
  // conviven en la misma lista de opciones, cada una con su provider).
  const activeProvider = selectedShipping?.provider || shippingQuote?.provider || null;
  const providerLabel = activeProvider ? PROVIDER_LABELS[activeProvider] : null;
  const shippingOptions = shippingQuote?.options || [];
  const freeShippingProviderLabel = activeProvider === 'gestionar'
    ? 'Gestionar'
    : 'Correo Argentino Clásico';

  return (
    <div className="bg-black text-white min-h-screen checkout-bg-grid">

      {/* Global loading overlay while calling Nave API */}
      <LoadingOverlay visible={loading} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-24">
        {isAdmin && (
          <div className="mb-6 px-4 py-3 rounded-md border border-yellow-500/40 bg-yellow-500/10 flex items-start gap-3">
            <span className="text-yellow-300 text-lg leading-none mt-0.5">⚠</span>
            <div className="text-[12px] text-yellow-100 leading-relaxed">
              <span className="font-semibold uppercase tracking-widest text-yellow-300">Modo admin de prueba</span>
              <span className="text-yellow-100/80"> — cada perfume se cobra <span className="font-medium text-white">${ADMIN_TEST_UNIT_PRICE}</span> y el envío <span className="font-medium text-white">$0</span>. Los precios del resumen ya reflejan este override. No se enviará la notificación de "nueva venta" al admin.</span>
            </div>
          </div>
        )}
        {/* Title block */}
        <div className="mb-8 sm:mb-10 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-heading text-3xl sm:text-[40px] tracking-[0.08em] leading-none">
              FINALIZAR <span className="text-white/40">COMPRA</span>
            </h1>
            <p className="text-white/45 text-sm mt-3 max-w-md">
              Completá tus datos, elegí el envío y pagá. Demora menos de dos minutos.
            </p>
          </div>
          <Link
            to="/tienda"
            className="text-[11px] text-white/45 hover:text-[rgb(0,255,255)] uppercase tracking-[0.2em] border-b border-white/15 pb-0.5 transition-colors"
          >
            ← Volver a la tienda
          </Link>
        </div>

        {/* Pulse "Conexión segura" */}
        <div className="hidden md:flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-[0.2em] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[rgb(0,255,255)] pulse-dot" />
          Conexión segura
        </div>

        {/* Mobile summary toggle */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setShowMobileSummary((v) => !v)}
            className="w-full flex items-center justify-between p-4 card-section"
          >
            <div className="flex items-center gap-3">
              <span className="step-num">↦</span>
              <div className="text-left">
                <div className="font-heading text-[12px] uppercase tracking-[0.18em]">Resumen del pedido</div>
                <div className="text-[10px] text-white/45 mt-0.5">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} · Total ${grandTotal.toLocaleString('es-AR')}
                </div>
              </div>
            </div>
            <span className="text-[rgb(0,255,255)] text-xs">
              {showMobileSummary ? '− CERRAR' : '+ VER'}
            </span>
          </button>
          {showMobileSummary && (
            <div className="mt-4">
              <OrderSummaryCard
                cart={cart}
                totalPrice={effectiveSubtotal}
                shippingCost={shippingCost}
                total={grandTotal}
                providerLabel={providerLabel}
                shippingLoading={shippingLoading}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                adminTest={isAdmin}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: 4 cards numeradas */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 01 — CONTACTO */}
              <section className="card-section">
                <SectionHeader n="01" title="Contacto" status={contactDone ? 'done' : ''} />
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="email" label="Email" required span={2}>
                    <input id="email" type="email" className="field" placeholder="tu@email.com"
                      value={form.email} onChange={handleChange} required />
                  </Field>
                  <Field id="name" label="Nombre y apellido" required span={2}>
                    <input id="name" className="field" placeholder="Nombre Apellido"
                      value={form.name} onChange={handleChange} required />
                  </Field>
                  <Field id="phone" label="Teléfono" hint="Para coordinar envío" span={2}>
                    <input id="phone" type="tel" className="field" placeholder="11 1234-5678"
                      value={form.phone} onChange={handleChange} />
                  </Field>
                </div>
              </section>

              {/* 02 — DIRECCIÓN */}
              <section className="card-section">
                <SectionHeader
                  n="02"
                  title="Dirección de envío"
                  status={addressDone ? 'done' : ''}
                  right={<span className="text-[10px] text-[rgb(0,255,255)] uppercase tracking-widest">🇦🇷 ARG</span>}
                />
                <div className="p-5 grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <Field id="address" label="Calle y número" span={5}>
                    <input id="address" className="field" placeholder="Av. Siempre Viva 742"
                      value={form.address} onChange={handleChange} />
                  </Field>
                  <Field id="address2" label="Piso / Depto" hint="Opcional" span={5}>
                    <input id="address2" className="field" placeholder="Piso 2, Depto B"
                      value={form.address2} onChange={handleChange} />
                  </Field>
                  <Field id="zip" label="Código postal" required span={1} labelStyle={{ fontSize: '9px' }}>
                    <input id="zip" className="field" placeholder="1414"
                      value={form.zip} onChange={handleChange} />
                  </Field>
                  <Field id="city" label="Ciudad" required span={4}>
                    <input id="city" className="field" placeholder="Mar del Plata"
                      value={form.city} onChange={handleChange} />
                  </Field>
                  <Field id="state" label="Provincia" required span={5}>
                    <select id="state" className="field appearance-none cursor-pointer"
                      value={form.state} onChange={handleChange}>
                      <option value="">Seleccioná una provincia</option>
                      {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field id="notes" label="Comentarios para la entrega" hint="Opcional" span={5}>
                    <input id="notes" className="field" placeholder="Horario preferido, referencias..."
                      value={form.notes} onChange={handleChange} />
                  </Field>
                </div>
              </section>

              {/* 03 — MÉTODO DE ENVÍO */}
              <section className="card-section">
                <SectionHeader
                  n="03"
                  title="Método de envío"
                  status={shippingDone ? 'done' : ''}
                  right={showShippingSection
                    ? <span className="text-[10px] text-white/40 uppercase tracking-widest truncate">{form.state} · {form.zip}</span>
                    : <span className="text-[10px] text-white/30 uppercase tracking-widest">Completá tu dirección</span>}
                />
                <div className="p-5">
                  {!showShippingSection && (
                    <div className="flex items-center gap-3 text-[13px] text-white/40 py-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                      Ingresá provincia y código postal para ver opciones disponibles.
                    </div>
                  )}

                  {showShippingSection && shippingLoading && (
                    <div className="flex items-center gap-3 p-4 bg-zinc-900/40 rounded-md border border-white/10">
                      <div className="w-4 h-4 border border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      <span className="text-sm text-white/60">Calculando opciones de envío...</span>
                    </div>
                  )}

                  {showShippingSection && !shippingLoading && shippingError && (
                    <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-md text-sm text-amber-200">
                      No se pudo calcular el costo de envío. Se coordinará con el pedido.
                    </div>
                  )}

                  {showShippingSection && !shippingLoading && !shippingError && shippingOptions.length > 0 && (
                    <>
                      {shippingQuote?.coverage && (
                        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-md bg-[rgb(0,255,255)]/5 border border-[rgb(0,255,255)]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[rgb(0,255,255)]" />
                          <span className="text-[12px] text-white/75">
                            CP <span className="text-white">{form.zip.replace(/\D/g, '').slice(0, 4)}</span>
                            {' → '}
                            <span className="text-white">{shippingQuote.coverage.partido}</span>
                            {' · '}
                            <span className="text-[rgb(0,255,255)]">{shippingQuote.coverage.zoneName}</span>
                          </span>
                        </div>
                      )}
                      {shippingQuote.freeShipping && (
                        <div className="flex items-center gap-2 mb-4 text-[11px] uppercase tracking-widest text-[rgb(0,255,255)]/90">
                          <span className="w-1 h-1 rounded-full bg-[rgb(0,255,255)]" />
                          Envío gratis en {freeShippingProviderLabel} por comprar 2+ perfumes
                        </div>
                      )}
                      <div className="space-y-2">
                        {shippingOptions.map((option) => (
                          <ShippingOptionCard
                            key={option.id}
                            option={option}
                            selected={selectedShipping}
                            onSelect={setSelectedShipping}
                          />
                        ))}
                      </div>
                      {selectedShipping?.mode === 'branch' && (
                        <BranchPicker
                          branches={branchList}
                          loading={branchLoading}
                          error={branchError}
                          selected={selectedBranch}
                          onSelect={setSelectedBranch}
                        />
                      )}
                    </>
                  )}

                  {showShippingSection && !shippingLoading && !shippingError && shippingOptions.length === 0 && shippingQuote && (
                    <div className="p-4 bg-zinc-900/40 border border-white/10 rounded-md text-sm text-white/60">
                      No encontramos opciones de envío para esa dirección. Se coordinará con el pedido.
                    </div>
                  )}
                </div>
              </section>

              {/* 04 — MÉTODO DE PAGO */}
              <section className="card-section">
                <SectionHeader
                  n="04"
                  title="Pago"
                  right={<span className="text-[10px] text-white/35 uppercase tracking-widest hidden sm:inline">Encriptado · No almacenamos tarjeta</span>}
                />
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <PaymentMethodCard
                      id="mercadopago"
                      title="Mercado Pago"
                      subtitle="Tarjeta, débito, cuotas o dinero en cuenta"
                      logoGradient="linear-gradient(135deg,#00b1ea,#009ee3)"
                      logoLabel="MP"
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />
                    <PaymentMethodCard
                      id="nave"
                      title="Nave · Naranja X"
                      subtitle="Pagá con tu cuenta o tarjeta Naranja X"
                      logoGradient="linear-gradient(135deg,#ff7a00,#ff3d3d)"
                      logoLabel="NX"
                      selected={paymentMethod}
                      onSelect={setPaymentMethod}
                    />
                  </div>

                  {paymentMethod === 'mercadopago' && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-12 rounded-md flex-shrink-0" style={{ background: 'linear-gradient(135deg,#00b1ea,#009ee3)' }} />
                        <div>
                          <div className="text-sm text-white">Vas a continuar en Mercado Pago</div>
                          <div className="text-[12px] text-white/45 mt-1 leading-relaxed">
                            Al hacer click en <span className="text-white/70">"Pagar"</span> te abrimos el checkout seguro de Mercado Pago. Volvés a esta página al finalizar.
                          </div>
                        </div>
                      </div>

                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-white/70">
                        <li className="flex items-center gap-2">
                          <span className="text-[rgb(0,255,255)]">✓</span> Tarjeta de crédito y débito
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[rgb(0,255,255)]">✓</span> Cuotas con o sin interés
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[rgb(0,255,255)]">✓</span> Dinero en cuenta de Mercado Pago
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-[rgb(0,255,255)]">✓</span> Rapipago, Pago Fácil y otros
                        </li>
                      </ul>
                    </div>
                  )}

                  {paymentMethod === 'nave' && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5 flex items-start gap-3">
                      <div className="h-9 w-12 rounded-md flex-shrink-0" style={{ background: 'linear-gradient(135deg,#ff7a00,#ff3d3d)' }} />
                      <div>
                        <div className="text-sm text-white">Vas a continuar en Nave · Naranja X</div>
                        <div className="text-[12px] text-white/45 mt-1 leading-relaxed">
                          Al hacer click en <span className="text-white/70">"Pagar"</span>, se abre el checkout embebido. Si tu cuenta no soporta el SDK, te redirigimos al checkout seguro de Nave. Volvés a esta página al finalizar.
                        </div>
                      </div>
                    </div>
                  )}

                  {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
                </div>
              </section>

              {(paymentMethod === 'nave' || paymentMethod === 'mercadopago') && (
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className="btn-primary-checkout"
                >
                  {loading ? 'Procesando...' : `Pagar $${grandTotal.toLocaleString('es-AR')}`}
                </button>
              )}
            </form>
          </div>

          {/* Right: sticky summary */}
          <aside className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <div className="sticky top-6 space-y-5">
              <OrderSummaryCard
                cart={cart}
                totalPrice={effectiveSubtotal}
                shippingCost={shippingCost}
                total={grandTotal}
                providerLabel={providerLabel}
                shippingLoading={shippingLoading}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                adminTest={isAdmin}
              />
              <TrustBadges />
              <p className="text-[10px] text-white/30 leading-relaxed text-center px-2">
                Al continuar aceptás los Términos y la Política de Privacidad.
              </p>
            </div>
          </aside>
        </div>

        {/* Mobile: trust badges al final */}
        <div className="lg:hidden mt-8 space-y-4">
          <TrustBadges />
          <p className="text-[10px] text-white/30 leading-relaxed text-center">
            Al continuar aceptás los Términos y la Política de Privacidad.
          </p>
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