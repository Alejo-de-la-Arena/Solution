import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrderTracking } from '../services/checkout';
import {
  getLatestTrackedOrder,
  getTrackedOrders,
  updateTrackedOrderStatus,
} from '../services/orderTracking';

const FINAL_STATES = new Set(['paid', 'payment_failed', 'cancelled', 'refunded', 'chargeback']);

function statusMeta(status) {
  const s = (status || '').toLowerCase();
  if (s === 'paid') return { label: 'Pago aprobado', tone: 'success', icon: '✓' };
  if (s === 'payment_failed') return { label: 'Pago rechazado', tone: 'danger', icon: '✗' };
  if (s === 'cancelled') return { label: 'Pago cancelado', tone: 'danger', icon: '✗' };
  if (s === 'refunded') return { label: 'Pago reembolsado', tone: 'warning', icon: '↺' };
  if (s === 'chargeback') return { label: 'Contracargo', tone: 'warning', icon: '↺' };
  return { label: 'Verificando pago', tone: 'pending', icon: '…' };
}

function toneClasses(tone) {
  switch (tone) {
    case 'success': return { border: 'border-[rgb(0,255,255)]', text: 'text-[rgb(0,255,255)]' };
    case 'danger': return { border: 'border-red-500', text: 'text-red-500' };
    case 'warning': return { border: 'border-amber-400', text: 'text-amber-400' };
    default: return { border: 'border-yellow-500', text: 'text-yellow-500' };
  }
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatARS(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return `$${v.toLocaleString('es-AR')}`;
}

function prettyPaymentMethod(m) {
  if (m === 'mercadopago') return 'Mercado Pago';
  if (m === 'nave') return 'Nave / Naranja X';
  return m || '—';
}

export default function MiPedido() {
  const { orderId: orderIdParam } = useParams();
  const latestLocal = orderIdParam ? null : getLatestTrackedOrder();
  const orderId = orderIdParam || latestLocal?.orderId || null;
  const allTracked = getTrackedOrders();

  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState('');
  const [data, setData] = useState(null); // { order, items }
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await getOrderTracking(orderId);
      setData(res);
      setError('');
      if (res?.order?.status) updateTrackedOrderStatus(orderId, res.order.status);
    } catch (err) {
      setError(err.message || 'No se pudo consultar el pedido');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) { setLoading(false); return undefined; }
    fetchStatus();
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [orderId, fetchStatus]);

  useEffect(() => {
    const status = (data?.order?.status || '').toLowerCase();
    if (!status || FINAL_STATES.has(status)) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return undefined;
    }
    if (pollRef.current) return undefined;
    pollRef.current = setInterval(fetchStatus, 5000);
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [data?.order?.status, fetchStatus]);

  if (!orderId) {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-heading tracking-widest">MI PEDIDO</h1>
            <p className="text-white/60">Todavía no tenés ningún pedido para seguir desde este dispositivo.</p>
            <Link
              to="/tienda"
              className="inline-block bg-white text-black py-3 px-8 text-sm tracking-[0.2em] uppercase font-bold hover:bg-[rgb(0,255,255)] transition-colors duration-300 rounded-sm"
            >
              Ir a la tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin" />
          <span className="text-white/50 tracking-widest text-sm uppercase">Cargando tu pedido...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-heading tracking-widest">PEDIDO NO ENCONTRADO</h1>
            <p className="text-white/60">{error}</p>
            <p className="text-xs text-white/40 tracking-wide">ID consultado: {orderId}</p>
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

  const order = data?.order || {};
  const items = data?.items || [];
  const meta = statusMeta(order.status);
  const tone = toneClasses(meta.tone);

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* Estado */}
          <div className="text-center space-y-6">
            <div className={`w-20 h-20 mx-auto rounded-full border-2 ${tone.border} flex items-center justify-center`}>
              {meta.tone === 'pending' ? (
                <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className={`text-3xl ${tone.text}`}>{meta.icon}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-heading tracking-widest">{meta.label.toUpperCase()}</h1>
              <p className="text-white/60 mt-3">
                Pedido <span className="text-[rgb(0,255,255)] font-medium break-all">{order.id || orderId}</span>
              </p>
              {order.created_at && (
                <p className="text-xs text-white/40 mt-1 tracking-wide">{formatDate(order.created_at)}</p>
              )}
              {meta.tone === 'pending' && (
                <p className="text-sm text-white/50 mt-4 max-w-md mx-auto">
                  Estamos esperando la confirmación de la pasarela. Esta pantalla se actualiza sola cada 5 segundos.
                </p>
              )}
            </div>
          </div>

          {/* Resumen de pago */}
          <section className="rounded-lg border border-white/10 bg-zinc-900/50 p-6 space-y-4">
            <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-3">RESUMEN</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="text-white/50">Método de pago</div>
              <div className="text-white text-right">{prettyPaymentMethod(order.payment_method)}</div>

              {order.mp_card_brand && (
                <>
                  <div className="text-white/50">Tarjeta</div>
                  <div className="text-white text-right uppercase">
                    {order.mp_card_brand} {order.mp_card_last4 ? `•••• ${order.mp_card_last4}` : ''}
                  </div>
                </>
              )}
              {order.nave_card_brand && (
                <>
                  <div className="text-white/50">Tarjeta</div>
                  <div className="text-white text-right uppercase">
                    {order.nave_card_brand} {order.nave_card_last4 ? `•••• ${order.nave_card_last4}` : ''}
                  </div>
                </>
              )}
              {(order.mp_installments || order.nave_installments) && (
                <>
                  <div className="text-white/50">Cuotas</div>
                  <div className="text-white text-right">
                    {order.mp_installments || order.nave_installments}
                  </div>
                </>
              )}

              <div className="text-white/50">Envío</div>
              <div className="text-white text-right">
                {order.shipping_is_free ? (
                  <span className="text-[rgb(0,255,255)]">Gratis</span>
                ) : (
                  formatARS(order.shipping_cost)
                )}
              </div>

              <div className="text-white/50 pt-3 border-t border-white/10 font-heading tracking-widest">TOTAL</div>
              <div className="text-white text-right pt-3 border-t border-white/10 text-2xl font-light tracking-tight">
                {formatARS(order.total)}
              </div>
            </div>
          </section>

          {/* Items */}
          {items.length > 0 && (
            <section className="rounded-lg border border-white/10 bg-zinc-900/50 p-6 space-y-4">
              <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-3">PRODUCTOS</h2>
              <ul className="space-y-4">
                {items.map((item, idx) => (
                  <li key={`${item.product_id}-${idx}`} className="flex items-center gap-4">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name || 'Producto'} className="w-16 h-20 object-cover rounded-sm bg-zinc-900 flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-20 bg-zinc-900 rounded-sm flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{item.product_name || 'Producto'}</p>
                      <p className="text-xs text-white/50 mt-1">Cantidad: {item.quantity}</p>
                    </div>
                    <div className="text-sm text-white/80 whitespace-nowrap">
                      {formatARS(Number(item.unit_price) * Number(item.quantity))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Envío */}
          {(order.shipping_address_line1 || order.shipping_city) && (
            <section className="rounded-lg border border-white/10 bg-zinc-900/50 p-6 space-y-3">
              <h2 className="text-lg font-heading tracking-widest border-b border-white/10 pb-3">ENVÍO</h2>
              <div className="text-sm text-white/80 space-y-1">
                {order.customer_name && <p>{order.customer_name}</p>}
                {order.shipping_address_line1 && (
                  <p>
                    {order.shipping_address_line1}
                    {order.shipping_address_line2 ? `, ${order.shipping_address_line2}` : ''}
                  </p>
                )}
                {(order.shipping_city || order.shipping_state) && (
                  <p>
                    {[order.shipping_city, order.shipping_state, order.shipping_postal_code].filter(Boolean).join(', ')}
                  </p>
                )}
                {order.shipping_country && <p className="text-white/40 text-xs uppercase tracking-wide mt-2">{order.shipping_country}</p>}
                {order.shipping_agency_name && (
                  <p className="text-white/50 text-xs mt-2">Sucursal: {order.shipping_agency_name}</p>
                )}
              </div>
            </section>
          )}

          {/* Otros pedidos guardados */}
          {allTracked.length > 1 && (
            <section className="rounded-lg border border-white/10 bg-zinc-900/30 p-6 space-y-3">
              <h2 className="text-sm font-heading tracking-widest text-white/60">OTROS PEDIDOS RECIENTES</h2>
              <ul className="space-y-1">
                {allTracked.filter((o) => o.orderId !== orderId).map((o) => (
                  <li key={o.orderId}>
                    <Link
                      to={`/mi-pedido/${o.orderId}`}
                      className="flex items-center justify-between py-2 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      <span className="truncate mr-4 font-mono text-xs">{o.orderId}</span>
                      <span className="text-white/40 text-xs">{statusMeta(o.status).label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="text-center">
            <Link to="/tienda" className="inline-block text-sm text-white/50 hover:text-white transition-colors tracking-widest border-b border-white/20 pb-0.5">
              Volver a la tienda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
