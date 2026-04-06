import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminOrders, refundNaveOrder, updateAdminOrderStatus } from '../../services/admin';
import { AdminDatePicker, toYMDLocal } from '../../components/admin/AdminDatePicker';

const CHANNEL_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Mayorista' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'pending_payment', label: 'Pago pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'payment_failed', label: 'Pago fallido' },
  { value: 'refund_pending', label: 'Reembolso en curso' },
  { value: 'refunded', label: 'Reembolsado' },
  { value: 'chargeback', label: 'Contracargo' },
  { value: 'draft', label: 'Borrador' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'shipped', label: 'Enviado' },
];

/** Valores para el selector de edición (sin "Todos"). */
const STATUS_EDIT_OPTIONS = STATUS_OPTIONS.filter((o) => o.value);

const selectClass =
  'bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30 appearance-none cursor-pointer min-w-[120px]';

const inputClass =
  'bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30';

const VIEW_STORAGE_KEY = 'admin_pedidos_view';

function formatPaymentMethod(method) {
  if (!method) return '—';
  const m = String(method).toLowerCase();
  if (m === 'nave') return 'Nave';
  if (m === 'manual') return 'Manual';
  return method;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMoney(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function shortId(id) {
  if (!id) return '—';
  return String(id).slice(0, 8);
}

function statusTextClass(status) {
  if (status === 'pending' || status === 'pending_payment') return 'text-amber-400';
  if (status === 'paid') return 'text-emerald-400';
  if (status === 'cancelled' || status === 'payment_failed') return 'text-red-400';
  if (status === 'refunded' || status === 'refund_pending') return 'text-orange-300';
  if (status === 'chargeback') return 'text-rose-400';
  return 'text-white/60';
}

function IconList({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconGrid({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75A2.25 2.25 0 0115.75 13.5H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25zM13.5 6A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
    </svg>
  );
}

/** Detalle expandible (ítems, envío, Nave, estado) — compartido lista y grilla. */
function OrderDetailSection({
  order,
  statusEditDraft,
  setStatusEditDraft,
  statusUpdatingId,
  handleUpdateOrderStatus,
  refundingId,
  handleRefundNave,
}) {
  return (
    <div className="px-5 py-4 bg-black/30 space-y-5">
      <div className="pb-4 border-b border-white/10">
        <h3 className="text-xs font-heading tracking-widest text-white/60 mb-2">Estado del pedido</h3>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusEditDraft}
            onChange={(e) => setStatusEditDraft(e.target.value)}
            className={selectClass}
            style={{ colorScheme: 'dark' }}
            disabled={statusUpdatingId === order.id}
          >
            {!STATUS_EDIT_OPTIONS.some((o) => o.value === order.status) && order.status && (
              <option value={order.status}>{order.status} (actual)</option>
            )}
            {STATUS_EDIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0b0b0b]">
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={statusUpdatingId === order.id || statusEditDraft === order.status}
            onClick={() => handleUpdateOrderStatus(order.id)}
            className="text-xs uppercase tracking-widest px-4 py-2 rounded border border-[rgb(0,255,255)]/50 text-[rgb(0,255,255)] hover:bg-[rgb(0,255,255)]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {statusUpdatingId === order.id ? 'Guardando…' : 'Guardar estado'}
          </button>
        </div>
        <p className="text-[10px] text-white/40 mt-2">
          Cambiá el estado manualmente (ej. marcar como enviado). Los pagos Nave siguen reflejándose por
          webhook.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-heading tracking-widest text-white/60 mb-2">Ítems</h3>
        <ul className="space-y-2">
          {(order.items || []).map((it) => (
            <li
              key={it.id}
              className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0"
            >
              <span className="text-white/90">
                {it.quantity} × {it.product_name || it.product_id}
              </span>
              <span className="text-[rgb(0,255,255)] tabular-nums">
                {formatMoney(it.quantity * it.unit_price, order.currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {order.channel === 'retail' && (
        <div>
          <h3 className="text-xs font-heading tracking-widest text-white/60 mb-2">Envío</h3>
          <div className="text-sm text-white/80 space-y-1">
            {(order.shipping_address_line1 || order.shipping_city) && (
              <p>
                {[order.shipping_address_line1, order.shipping_address_line2].filter(Boolean).join(', ')}
                {order.shipping_city && ` — ${order.shipping_city}`}
                {order.shipping_state && `, ${order.shipping_state}`}
                {order.shipping_postal_code && ` (${order.shipping_postal_code})`}
              </p>
            )}
            {order.customer_phone && <p className="text-white/60">Tel: {order.customer_phone}</p>}
            {order.shipping_notes && <p className="text-white/50 italic">Notas: {order.shipping_notes}</p>}
            {!order.shipping_address_line1 && !order.shipping_city && !order.customer_phone && (
              <p className="text-white/50">Sin datos de envío.</p>
            )}
          </div>
        </div>
      )}

      {order.channel === 'wholesale' && order.wholesale_plan && (
        <p className="text-xs text-white/50 uppercase tracking-widest">Plan: {order.wholesale_plan}</p>
      )}

      {(order.nave_payment_id ||
        order.nave_payment_code ||
        order.nave_card_last4 ||
        order.nave_status_reason) && (
        <div>
          <h3 className="text-xs font-heading tracking-widest text-white/60 mb-2">Pago Nave</h3>
          <div className="text-xs text-white/80 space-y-1 font-mono">
            {order.nave_payment_id && (
              <p>
                <span className="text-white/50">payment_id:</span> {order.nave_payment_id}
              </p>
            )}
            {order.nave_payment_code && (
              <p>
                <span className="text-white/50">Código operación:</span>{' '}
                <span className="text-[rgb(0,255,255)]">{order.nave_payment_code}</span>
              </p>
            )}
            {(order.nave_card_brand || order.nave_card_last4) && (
              <p>
                <span className="text-white/50">Tarjeta:</span>{' '}
                {[order.nave_card_brand, order.nave_card_type].filter(Boolean).join(' ')}{' '}
                {order.nave_card_last4 ? `···${order.nave_card_last4}` : ''}
              </p>
            )}
            {order.nave_card_issuer && (
              <p>
                <span className="text-white/50">Emisor:</span> {order.nave_card_issuer}
              </p>
            )}
            {order.nave_installments != null && (
              <p>
                <span className="text-white/50">Cuotas:</span> {order.nave_installments}
                {order.nave_installments_name ? ` — ${order.nave_installments_name}` : ''}
              </p>
            )}
            {order.nave_paid_at && (
              <p>
                <span className="text-white/50">Pagado (Nave):</span> {formatDate(order.nave_paid_at)}
              </p>
            )}
            {order.nave_status_reason && (
              <p className="text-amber-200/90">
                <span className="text-white/50">Motivo / código:</span> {order.nave_status_reason}
              </p>
            )}
          </div>
        </div>
      )}

      {order.payment_method === 'nave' && order.status === 'paid' && order.nave_payment_id && (
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            disabled={refundingId === order.id}
            onClick={() => handleRefundNave(order.id)}
            className="text-xs uppercase tracking-widest px-4 py-2 rounded border border-orange-400/50 text-orange-300 hover:bg-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refundingId === order.id ? 'Solicitando…' : 'Reembolsar (Nave)'}
          </button>
        </div>
      )}
    </div>
  );
}

const today = new Date();
const defaultDateTo = toYMDLocal(today);

export default function AdminPedidos() {
  const [orders, setOrders] = useState([]);
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [refundingId, setRefundingId] = useState(null);
  const [statusEditDraft, setStatusEditDraft] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [ordersView, setOrdersView] = useState(() => {
    try {
      return localStorage.getItem(VIEW_STORAGE_KEY) === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, ordersView);
    } catch {
      /* ignore */
    }
  }, [ordersView]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQ.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const hasActiveFilters =
    channelFilter || statusFilter || dateFrom || dateTo || searchDebounced;

  const filters = useMemo(
    () => ({
      channel: channelFilter || undefined,
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      q: searchDebounced || undefined,
    }),
    [channelFilter, statusFilter, dateFrom, dateTo, searchDebounced]
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getAdminOrders(filters);
      setOrders(list);
    } catch (e) {
      setError(e.message || 'Error al cargar pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setChannelFilter('');
    setStatusFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchQ('');
  };

  useEffect(() => {
    fetchOrders();
  }, [channelFilter, statusFilter, dateFrom, dateTo, searchDebounced]);

  useEffect(() => {
    if (!expandedId) {
      setStatusEditDraft('');
      return;
    }
    const o = orders.find((x) => x.id === expandedId);
    if (o) setStatusEditDraft(o.status || '');
  }, [expandedId, orders]);

  const handleUpdateOrderStatus = async (orderId) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o || statusEditDraft === o.status) return;
    setStatusUpdatingId(orderId);
    setError('');
    try {
      await updateAdminOrderStatus(orderId, statusEditDraft);
      await fetchOrders();
    } catch (e) {
      setError(e.message || 'Error al actualizar el estado');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleRefundNave = async (orderId) => {
    if (
      !window.confirm(
        '¿Solicitar reembolso en Nave? El cliente recibirá un email y el estado pasará a reembolso en curso hasta confirmación de Nave.'
      )
    ) {
      return;
    }
    setRefundingId(orderId);
    setError('');
    try {
      await refundNaveOrder(orderId);
      await fetchOrders();
      setExpandedId(orderId);
    } catch (e) {
      setError(e.message || 'Error al solicitar reembolso');
    } finally {
      setRefundingId(null);
    }
  };

  const toggleExpand = (order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
    } else {
      setExpandedId(order.id);
      setStatusEditDraft(order.status || '');
    }
  };

  const detailProps = {
    statusEditDraft,
    setStatusEditDraft,
    statusUpdatingId,
    handleUpdateOrderStatus,
    refundingId,
    handleRefundNave,
  };

  return (
    <div className={`mx-auto ${ordersView === 'grid' ? 'max-w-7xl' : 'max-w-5xl'}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-16 h-0.5 bg-[rgb(255,0,255)] mb-6"
      />
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="text-3xl sm:text-4xl font-heading tracking-wider mb-4"
      >
        Pedidos
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="text-white/70 mb-8"
      >
        {ordersView === 'grid'
          ? 'Tocá una tarjeta para ver detalle, ítems y acciones.'
          : 'Todas las órdenes (retail y mayorista). Expandí una fila para ver ítems y envío.'}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex flex-wrap items-end gap-3 sm:gap-4 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Canal</label>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className={selectClass}
              style={{ colorScheme: 'dark' }}
            >
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value} className="bg-[#0b0b0b] text-white">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
              style={{ colorScheme: 'dark' }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value || 'all'} value={o.value} className="bg-[#0b0b0b] text-white">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label
              id="admin-pedidos-date-from-label"
              htmlFor="admin-pedidos-date-from"
              className="text-[10px] uppercase tracking-widest text-white/50"
            >
              Desde
            </label>
            <AdminDatePicker
              id="admin-pedidos-date-from"
              aria-labelledby="admin-pedidos-date-from-label"
              value={dateFrom}
              onChange={setDateFrom}
              max={dateTo || defaultDateTo}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              id="admin-pedidos-date-to-label"
              htmlFor="admin-pedidos-date-to"
              className="text-[10px] uppercase tracking-widest text-white/50"
            >
              Hasta
            </label>
            <AdminDatePicker
              id="admin-pedidos-date-to"
              aria-labelledby="admin-pedidos-date-to-label"
              value={dateTo}
              onChange={setDateTo}
              min={dateFrom || undefined}
              max={defaultDateTo}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Cliente / email</label>
            <input
              type="search"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Buscar..."
              className={inputClass}
              autoComplete="off"
            />
          </div>
          <div
            className="flex flex-col gap-1"
            title="Cómo mostrar los pedidos"
          >
            <label className="text-[10px] uppercase tracking-widest text-white/50">Vista</label>
            <div className="flex rounded border border-white/20 p-0.5 bg-[#0b0b0b]">
              <button
                type="button"
                onClick={() => setOrdersView('list')}
                className={`p-2 rounded transition-colors ${
                  ordersView === 'list'
                    ? 'bg-white/15 text-[rgb(0,255,255)]'
                    : 'text-white/45 hover:text-white/80'
                }`}
                aria-label="Vista en filas"
                aria-pressed={ordersView === 'list'}
              >
                <IconList />
              </button>
              <button
                type="button"
                onClick={() => setOrdersView('grid')}
                className={`p-2 rounded transition-colors ${
                  ordersView === 'grid'
                    ? 'bg-white/15 text-[rgb(0,255,255)]'
                    : 'text-white/45 hover:text-white/80'
                }`}
                aria-label="Vista en tarjetas"
                aria-pressed={ordersView === 'grid'}
              >
                <IconGrid />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchOrders()}
              className="border border-[rgb(0,255,255)]/50 text-[rgb(0,255,255)] px-4 py-2 text-xs uppercase tracking-widest hover:bg-[rgb(0,255,255)]/10 transition-colors rounded"
            >
              Actualizar
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
        {hasActiveFilters && !loading && (
          <p className="mt-2 text-xs text-white/50">
            {orders.length} resultado{orders.length !== 1 ? 's' : ''}
          </p>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 rounded border border-red-500/50 bg-red-500/10 text-red-200 text-sm"
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-16"
        >
          <div className="w-10 h-10 border-2 border-[rgb(255,0,255)]/30 border-t-[rgb(255,0,255)] rounded-full animate-spin" />
        </motion.div>
      ) : ordersView === 'list' ? (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/50 text-center py-12"
            >
              No hay pedidos con este filtro.
            </motion.p>
          ) : (
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.04,
                    layout: { duration: 0.25 },
                  }}
                  className="border border-white/20 rounded-lg overflow-hidden bg-white/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(order)}
                    className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-4 hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="font-mono text-sm text-[rgb(0,255,255)]">#{shortId(order.id)}</span>
                    <span className="text-white/60 text-sm">{formatDate(order.created_at)}</span>
                    <span
                      className={`text-xs uppercase tracking-widest px-2 py-1 rounded ${
                        order.channel === 'retail'
                          ? 'bg-[rgb(0,255,255)]/15 text-[rgb(0,255,255)] border border-[rgb(0,255,255)]/30'
                          : 'bg-[rgb(255,0,255)]/15 text-[rgb(255,0,255)] border border-[rgb(255,0,255)]/30'
                      }`}
                    >
                      {order.channel === 'retail' ? 'Retail' : 'Mayorista'}
                    </span>
                    {order.payment_method && (
                      <span className="text-xs uppercase tracking-widest px-2 py-1 rounded border border-white/20 text-white/70 bg-white/5">
                        {formatPaymentMethod(order.payment_method)}
                      </span>
                    )}
                    <span className="text-white font-medium truncate max-w-[180px]">
                      {order.customer_name || order.customer_email || '—'}
                    </span>
                    <span className="text-white/50 text-sm truncate max-w-[200px]">
                      {order.customer_email || '—'}
                    </span>
                    <span className="ml-auto text-lg font-light text-white tabular-nums">
                      {formatMoney(order.total, order.currency)}
                    </span>
                    <span className={`text-xs uppercase ${statusTextClass(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="text-white/40">{expandedId === order.id ? '▼' : '▶'}</span>
                  </button>

                  <AnimatePresence>
                    {expandedId === order.id && (
                      <motion.div
                        layout
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="border-t border-white/10 overflow-hidden"
                      >
                        <OrderDetailSection order={order} {...detailProps} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      ) : (
        <div>
          {orders.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/50 text-center py-12"
            >
              No hay pedidos con este filtro.
            </motion.p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              <AnimatePresence mode="popLayout">
                {orders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, delay: index * 0.02 }}
                    className={`flex flex-col rounded-xl border bg-white/[0.03] overflow-hidden min-w-0 transition-shadow ${
                      expandedId === order.id
                        ? 'border-[rgb(0,255,255)]/40 shadow-[0_0_0_1px_rgba(0,255,255,0.12)]'
                        : 'border-white/15 hover:border-white/25'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(order)}
                      className="flex flex-col items-stretch text-left p-4 aspect-square max-h-[260px] min-h-[200px] hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-sm text-[rgb(0,255,255)]">#{shortId(order.id)}</span>
                        <span className="text-white/35 text-lg leading-none">
                          {expandedId === order.id ? '▼' : '▶'}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/45 mb-3 line-clamp-2">{formatDate(order.created_at)}</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span
                          className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                            order.channel === 'retail'
                              ? 'bg-[rgb(0,255,255)]/15 text-[rgb(0,255,255)] border border-[rgb(0,255,255)]/25'
                              : 'bg-[rgb(255,0,255)]/15 text-[rgb(255,0,255)] border border-[rgb(255,0,255)]/25'
                          }`}
                        >
                          {order.channel === 'retail' ? 'Retail' : 'Mayorista'}
                        </span>
                        {order.payment_method && (
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-white/15 text-white/55">
                            {formatPaymentMethod(order.payment_method)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/90 font-medium line-clamp-2 mb-1 flex-1">
                        {order.customer_name || order.customer_email || '—'}
                      </p>
                      {order.customer_email && order.customer_name && (
                        <p className="text-[11px] text-white/40 line-clamp-1 mb-3">{order.customer_email}</p>
                      )}
                      <div className="mt-auto pt-2 border-t border-white/10 flex items-end justify-between gap-2">
                        <span className={`text-[10px] uppercase font-medium ${statusTextClass(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="text-lg font-light text-white tabular-nums shrink-0">
                          {formatMoney(order.total, order.currency)}
                        </span>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedId === order.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="border-t border-white/10 overflow-hidden max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain"
                        >
                          <OrderDetailSection order={order} {...detailProps} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
