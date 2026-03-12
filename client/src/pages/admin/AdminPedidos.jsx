import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminOrders } from '../../services/admin';

const CHANNEL_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Mayorista' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'draft', label: 'Borrador' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'shipped', label: 'Enviado' },
];

const selectClass =
  'bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30 appearance-none cursor-pointer min-w-[120px]';

const inputClass =
  'bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30';

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

const today = new Date();
const toYMD = (d) => d.toISOString().slice(0, 10);
const defaultDateTo = toYMD(today);
const defaultDateFrom = toYMD(new Date(today.getFullYear(), today.getMonth(), 1));

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

  return (
    <div className="mx-auto max-w-5xl">
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
        Todas las órdenes (retail y mayorista). Expandí una fila para ver ítems y envío.
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
            <label className="text-[10px] uppercase tracking-widest text-white/50">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputClass}
              max={dateTo || defaultDateTo}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputClass}
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
      ) : (
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
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
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
                    <span className="text-white font-medium truncate max-w-[180px]">
                      {order.customer_name || order.customer_email || '—'}
                    </span>
                    <span className="text-white/50 text-sm truncate max-w-[200px]">
                      {order.customer_email || '—'}
                    </span>
                    <span className="ml-auto text-lg font-light text-white tabular-nums">
                      {formatMoney(order.total, order.currency)}
                    </span>
                    <span
                      className={`text-xs uppercase ${
                        order.status === 'pending'
                          ? 'text-amber-400'
                          : order.status === 'paid'
                            ? 'text-emerald-400'
                            : order.status === 'cancelled'
                              ? 'text-red-400'
                              : 'text-white/60'
                      }`}
                    >
                      {order.status}
                    </span>
                    <span className="text-white/40">
                      {expandedId === order.id ? '▼' : '▶'}
                    </span>
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
                        <div className="px-5 py-4 bg-black/30 space-y-5">
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
                              <h3 className="text-xs font-heading tracking-widest text-white/60 mb-2">
                                Envío
                              </h3>
                              <div className="text-sm text-white/80 space-y-1">
                                {(order.shipping_address_line1 || order.shipping_city) && (
                                  <p>
                                    {[order.shipping_address_line1, order.shipping_address_line2]
                                      .filter(Boolean)
                                      .join(', ')}
                                    {order.shipping_city && ` — ${order.shipping_city}`}
                                    {order.shipping_state && `, ${order.shipping_state}`}
                                    {order.shipping_postal_code && ` (${order.shipping_postal_code})`}
                                  </p>
                                )}
                                {order.customer_phone && (
                                  <p className="text-white/60">Tel: {order.customer_phone}</p>
                                )}
                                {order.shipping_notes && (
                                  <p className="text-white/50 italic">Notas: {order.shipping_notes}</p>
                                )}
                                {!order.shipping_address_line1 && !order.shipping_city && !order.customer_phone && (
                                  <p className="text-white/50">Sin datos de envío.</p>
                                )}
                              </div>
                            </div>
                          )}

                          {order.channel === 'wholesale' && order.wholesale_plan && (
                            <p className="text-xs text-white/50 uppercase tracking-widest">
                              Plan: {order.wholesale_plan}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
}
