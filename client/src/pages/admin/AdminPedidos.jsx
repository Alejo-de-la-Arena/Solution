import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminOrders, refundNaveOrder, updateAdminOrderStatus } from '../../services/admin';
import { dispatchWithCorreo, fetchCorreoAgencies } from '../../services/shipping';
import { AdminDatePicker, toYMDLocal } from '../../components/admin/AdminDatePicker';

// ── Constants ──────────────────────────────────────────────────────────────
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

const STATUS_EDIT_OPTIONS = STATUS_OPTIONS.filter((o) => o.value);

const BA_PROVINCES = new Set([
  'buenos aires', 'caba', 'ciudad autonoma de buenos aires',
  'ciudad autónoma de buenos aires', 'capital federal',
]);

// ── Styles ────────────────────────────────────────────────────────────────
const selectClass =
  'bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30 appearance-none cursor-pointer min-w-[120px]';
const inputClass =
  'bg-[#0b0b0b] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30';
const VIEW_STORAGE_KEY = 'admin_pedidos_view';

// ── Helpers ───────────────────────────────────────────────────────────────
function formatPaymentMethod(m) {
  if (!m) return '—';
  const s = String(m).toLowerCase();
  if (s === 'nave') return 'Nave';
  if (s === 'manual') return 'Manual';
  return m;
}
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatMoney(amount, currency = 'ARS') {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency,
    maximumFractionDigits: 0, minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}
function shortId(id) {
  if (!id) return '—';
  return String(id).slice(0, 8);
}
function statusTextClass(s) {
  if (s === 'pending' || s === 'pending_payment') return 'text-amber-400';
  if (s === 'paid') return 'text-emerald-400';
  if (s === 'cancelled' || s === 'payment_failed') return 'text-red-400';
  if (s === 'refunded' || s === 'refund_pending') return 'text-orange-300';
  if (s === 'chargeback') return 'text-rose-400';
  return 'text-white/60';
}

function canDispatchCorreo(order) {
  if (order.status !== 'paid' || order.channel !== 'retail') return false;
  if (order.shipping_status === 'imported' || order.shipping_tracking_number) return false;
  const province = (order.shipping_state || '').trim().toLowerCase();
  const isBA = BA_PROVINCES.has(province);
  if (order.shipping_provider === 'correo_argentino') return true;
  if (!order.shipping_provider && province && !isBA) return true;
  return false;
}

function formatHours(hours) {
  if (!hours) return null;
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNames = { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb' };
  const segments = [];
  let rangeStart = null;
  let rangeEnd = null;
  let prevSlot = null;

  for (const day of days) {
    const slot = hours[day];
    const slotStr = slot ? `${slot.start}-${slot.end}` : null;
    if (slotStr && slotStr === prevSlot) {
      rangeEnd = dayNames[day];
    } else {
      if (prevSlot && rangeStart) {
        segments.push(rangeEnd && rangeEnd !== rangeStart
          ? `${rangeStart}–${rangeEnd} ${prevSlot.replace('-', ' a ')}`
          : `${rangeStart} ${prevSlot.replace('-', ' a ')}`);
      }
      rangeStart = slot ? dayNames[day] : null;
      rangeEnd = rangeStart;
      prevSlot = slotStr;
    }
  }
  if (prevSlot && rangeStart) {
    segments.push(rangeEnd && rangeEnd !== rangeStart
      ? `${rangeStart}–${rangeEnd} ${prevSlot.replace('-', ' a ')}`
      : `${rangeStart} ${prevSlot.replace('-', ' a ')}`);
  }
  return segments.join(' / ') || null;
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

// ── Agency Selector ───────────────────────────────────────────────────────
function AgencySelector({ province, onSelect, selectedCode }) {
  const [agencies, setAgencies] = useState([]);
  const [loadingA, setLoadingA] = useState(false);
  const [errorA, setErrorA] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!province) return;
    setLoadingA(true);
    setErrorA('');
    fetchCorreoAgencies(province)
      .then((list) => setAgencies(list))
      .catch((err) => setErrorA(err.message || 'No se pudieron cargar las sucursales'))
      .finally(() => setLoadingA(false));
  }, [province]);

  const filtered = useMemo(() => {
    if (!search.trim()) return agencies;
    const q = search.toLowerCase();
    return agencies.filter(
      (a) =>
        (a.name || '').toLowerCase().includes(q) ||
        (a.locality || '').toLowerCase().includes(q) ||
        (a.address || '').toLowerCase().includes(q) ||
        (a.postalCode || '').toLowerCase().includes(q)
    );
  }, [agencies, search]);

  if (!province) {
    return (
      <p className="text-xs text-white/40 italic">
        Esta orden no tiene provincia registrada. Ingresá el código manualmente abajo.
      </p>
    );
  }

  if (loadingA) {
    return (
      <div className="flex items-center gap-2 text-xs text-white/50">
        <span className="w-3 h-3 border border-[rgb(0,255,255)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
        Cargando sucursales de {province}...
      </div>
    );
  }

  if (errorA) {
    return (
      <p className="text-xs text-red-300">
        {errorA} — podés ingresar el código manualmente abajo.
      </p>
    );
  }

  if (agencies.length === 0) {
    return (
      <p className="text-xs text-white/40 italic">
        No se encontraron sucursales para {province}. Ingresá el código manualmente abajo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, localidad o CP..."
        className={inputClass + ' w-full text-xs'}
      />
      <div className="max-h-52 overflow-y-auto rounded border border-white/10 divide-y divide-white/5">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-xs text-white/40">Sin resultados para "{search}"</p>
        ) : (
          filtered.map((agency) => {
            const isSelected = selectedCode === agency.code;
            const hours = formatHours(agency.hours);
            return (
              <button
                key={agency.code}
                type="button"
                onClick={() => onSelect(agency)}
                className={`w-full text-left px-3 py-2.5 transition-colors ${isSelected
                    ? 'bg-[rgb(0,255,255)]/15 border-l-2 border-[rgb(0,255,255)]'
                    : 'hover:bg-white/[0.04]'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-[rgb(0,255,255)]' : 'text-white'}`}>
                      {agency.name}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {[agency.address, agency.locality, agency.postalCode].filter(Boolean).join(' · ')}
                    </p>
                    {hours && (
                      <p className="text-[10px] text-white/30 mt-0.5 truncate">{hours}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-white/30 flex-shrink-0 mt-0.5">
                    {agency.code}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
      <p className="text-[10px] text-white/30">
        {filtered.length} de {agencies.length} sucursales en {province}
      </p>
    </div>
  );
}

// ── Dispatch Panel ────────────────────────────────────────────────────────
function DispatchPanel({ order, onSuccess, onClose }) {
  const defaultType = order.shipping_mode === 'branch' ? 'S' : 'D';
  const [deliveryType, setDeliveryType] = useState(defaultType);
  const [agencyCode, setAgencyCode] = useState(order.shipping_agency_code || '');
  const [agencyName, setAgencyName] = useState(order.shipping_agency_name || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const isBranch = deliveryType === 'S';
  const province = order.shipping_state || '';

  function handleAgencySelect(agency) {
    setAgencyCode(agency.code || '');
    setAgencyName(agency.name || '');
  }

  async function handleDispatch() {
    if (isBranch && !agencyCode.trim()) {
      setResult({ ok: false, error: 'Seleccioná o ingresá una sucursal.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await dispatchWithCorreo({
        orderId: order.id,
        deliveryType,
        agencyCode: agencyCode.trim() || undefined,
        agencyName: agencyName.trim() || undefined,
        serviceType: order.shipping_service_type || undefined,
      });
      const tracking =
        res?.shipment?.raw?.trackingNumber ||
        res?.order?.shipping_tracking_number ||
        null;
      setResult({ ok: true, tracking });
      onSuccess(order.id, tracking);
    } catch (err) {
      setResult({ ok: false, error: err.message || 'Error al despachar' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 p-4 rounded-lg border border-[rgb(0,255,255)]/30 bg-[rgb(0,255,255)]/[0.04] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-heading tracking-widest text-[rgb(0,255,255)]">
          DESPACHAR CON CORREO ARGENTINO
        </h4>
        <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest">
          Cancelar
        </button>
      </div>

      {/* Delivery type */}
      <div>
        <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Tipo de entrega</p>
        <div className="flex gap-3">
          {[
            { value: 'D', label: '📦 A domicilio' },
            { value: 'S', label: '🏪 Retiro en sucursal' },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setDeliveryType(value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded border text-sm transition-colors ${deliveryType === value
                  ? 'border-[rgb(0,255,255)] bg-cyan-900/20 text-white'
                  : 'border-white/20 text-white/60 hover:border-white/40'
                }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${deliveryType === value ? 'border-[rgb(0,255,255)] bg-[rgb(0,255,255)]' : 'border-white/30'
                }`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Branch selector */}
      {isBranch && (
        <div className="space-y-3">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest mb-2">
              Sucursales en {province || 'la provincia del cliente'}
            </p>
            <AgencySelector
              province={province}
              onSelect={handleAgencySelect}
              selectedCode={agencyCode}
            />
          </div>

          {/* Manual fallback */}
          <details className="group">
            <summary className="text-xs text-white/40 hover:text-white/70 cursor-pointer transition-colors select-none list-none flex items-center gap-1">
              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
              Ingresar código manualmente
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">
                  Código <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={agencyCode}
                  onChange={(e) => setAgencyCode(e.target.value)}
                  placeholder="Ej: B4650"
                  className={inputClass + ' w-full'}
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-widest mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="V Ballester Receptoría"
                  className={inputClass + ' w-full'}
                />
              </div>
            </div>
          </details>

          {/* Selected summary */}
          {agencyCode && (
            <div className="p-2.5 bg-[rgb(0,255,255)]/5 border border-[rgb(0,255,255)]/20 rounded text-xs">
              <span className="text-white/50">Sucursal seleccionada: </span>
              <span className="text-[rgb(0,255,255)] font-medium">{agencyName || agencyCode}</span>
              <span className="text-white/30 ml-1">({agencyCode})</span>
            </div>
          )}
        </div>
      )}

      {/* Destination summary */}
      <div className="text-xs text-white/50 space-y-1 bg-black/20 rounded p-3">
        <p><span className="text-white/30">Destinatario:</span> {order.customer_name || '—'}</p>
        <p>
          <span className="text-white/30">Dirección:</span>{' '}
          {[order.shipping_address_line1, order.shipping_city, order.shipping_state, order.shipping_postal_code]
            .filter(Boolean).join(', ') || '—'}
        </p>
      </div>

      {/* Result feedback */}
      {result && (
        <div className={`p-3 rounded border text-sm ${result.ok
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
            : 'border-red-500/40 bg-red-500/10 text-red-200'
          }`}>
          {result.ok ? (
            <>
              ✅ Envío creado correctamente en Correo Argentino.
              {result.tracking && (
                <span className="block mt-1 font-mono">
                  Tracking: <span className="text-[rgb(0,255,255)]">{result.tracking}</span>
                </span>
              )}
            </>
          ) : (
            <>❌ {result.error}</>
          )}
        </div>
      )}

      {/* Confirm button */}
      {!result?.ok && (
        <button
          type="button"
          onClick={handleDispatch}
          disabled={loading}
          className="w-full bg-[rgb(0,255,255)] text-black py-3 text-sm font-bold tracking-[0.15em] uppercase rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Creando envío...
            </span>
          ) : (
            'Confirmar despacho'
          )}
        </button>
      )}
    </div>
  );
}

// ── Order Detail Section ──────────────────────────────────────────────────
function OrderDetailSection({
  order,
  statusEditDraft, setStatusEditDraft,
  statusUpdatingId, handleUpdateOrderStatus,
  refundingId, handleRefundNave,
  openDispatchPanels, toggleDispatchPanel,
  handleDispatchSuccess, dispatchedTracking,
}) {
  const showDispatch = canDispatchCorreo(order);
  const dispatchOpen = openDispatchPanels.has(order.id);
  const savedTracking = dispatchedTracking[order.id] || order.shipping_tracking_number;
  const alreadyImported = order.shipping_status === 'imported' || !!savedTracking;

  return (
    <div className="px-5 py-4 bg-black/30 space-y-5">

      {/* Status edit */}
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
              <option key={o.value} value={o.value} className="bg-[#0b0b0b]">{o.label}</option>
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
          Cambiá el estado manualmente. Los pagos Nave siguen reflejándose por webhook.
        </p>
      </div>

      {/* Items */}
      <div>
        <h3 className="text-xs font-heading tracking-widest text-white/60 mb-2">Ítems</h3>
        <ul className="space-y-2">
          {(order.items || []).map((it) => (
            <li key={it.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
              <span className="text-white/90">{it.quantity} × {it.product_name || it.product_id}</span>
              <span className="text-[rgb(0,255,255)] tabular-nums">{formatMoney(it.quantity * it.unit_price, order.currency)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Shipping */}
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

            {(order.shipping_provider || order.shipping_mode) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-white/50">
                {order.shipping_provider && (
                  <span>Proveedor: <span className="text-white/70">
                    {order.shipping_provider === 'correo_argentino' ? 'Correo Argentino' : 'Gestionar'}
                  </span></span>
                )}
                {order.shipping_mode && (
                  <span>Modalidad: <span className="text-white/70">
                    {order.shipping_mode === 'home' ? 'A domicilio' : 'Retiro en sucursal'}
                  </span></span>
                )}
                {order.shipping_cost > 0 && (
                  <span>Costo: <span className="text-white/70">{formatMoney(order.shipping_cost, order.currency)}</span></span>
                )}
                {order.shipping_is_free && <span className="text-[rgb(0,255,255)]">Envío gratis</span>}
              </div>
            )}

            {savedTracking && (
              <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs">
                <span className="text-emerald-300">✅ Tracking: </span>
                <span className="font-mono text-white">{savedTracking}</span>
              </div>
            )}

            {!order.shipping_address_line1 && !order.shipping_city && !order.customer_phone && (
              <p className="text-white/50">Sin datos de envío.</p>
            )}
          </div>

          {/* Correo dispatch */}
          {showDispatch && !alreadyImported && (
            <div className="mt-3">
              {!dispatchOpen ? (
                <button
                  type="button"
                  onClick={() => toggleDispatchPanel(order.id)}
                  className="flex items-center gap-2 text-xs uppercase tracking-widest text-[rgb(0,255,255)] border border-[rgb(0,255,255)]/40 px-4 py-2 rounded hover:bg-[rgb(0,255,255)]/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Despachar con Correo Argentino
                </button>
              ) : (
                <DispatchPanel
                  order={order}
                  onSuccess={handleDispatchSuccess}
                  onClose={() => toggleDispatchPanel(order.id)}
                />
              )}
            </div>
          )}
          {alreadyImported && order.shipping_provider === 'correo_argentino' && (
            <p className="mt-2 text-xs text-emerald-400">✅ Despachado con Correo Argentino</p>
          )}
        </div>
      )}

      {order.channel === 'wholesale' && order.wholesale_plan && (
        <p className="text-xs text-white/50 uppercase tracking-widest">Plan: {order.wholesale_plan}</p>
      )}

      {/* Nave payment info */}
      {(order.nave_payment_id || order.nave_payment_code || order.nave_card_last4 || order.nave_status_reason) && (
        <div>
          <h3 className="text-xs font-heading tracking-widest text-white/60 mb-2">Pago Nave</h3>
          <div className="text-xs text-white/80 space-y-1 font-mono">
            {order.nave_payment_id && <p><span className="text-white/50">payment_id:</span> {order.nave_payment_id}</p>}
            {order.nave_payment_code && <p><span className="text-white/50">Código operación:</span> <span className="text-[rgb(0,255,255)]">{order.nave_payment_code}</span></p>}
            {(order.nave_card_brand || order.nave_card_last4) && (
              <p><span className="text-white/50">Tarjeta:</span> {[order.nave_card_brand, order.nave_card_type].filter(Boolean).join(' ')} {order.nave_card_last4 ? `···${order.nave_card_last4}` : ''}</p>
            )}
            {order.nave_card_issuer && <p><span className="text-white/50">Emisor:</span> {order.nave_card_issuer}</p>}
            {order.nave_installments != null && (
              <p><span className="text-white/50">Cuotas:</span> {order.nave_installments}{order.nave_installments_name ? ` — ${order.nave_installments_name}` : ''}</p>
            )}
            {order.nave_paid_at && <p><span className="text-white/50">Pagado (Nave):</span> {formatDate(order.nave_paid_at)}</p>}
            {order.nave_status_reason && <p className="text-amber-200/90"><span className="text-white/50">Motivo / código:</span> {order.nave_status_reason}</p>}
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

// ── Main component ────────────────────────────────────────────────────────
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
    try { return localStorage.getItem(VIEW_STORAGE_KEY) === 'grid' ? 'grid' : 'list'; } catch { return 'list'; }
  });
  const [openDispatchPanels, setOpenDispatchPanels] = useState(new Set());
  const [dispatchedTracking, setDispatchedTracking] = useState({});

  useEffect(() => {
    try { localStorage.setItem(VIEW_STORAGE_KEY, ordersView); } catch { /* ignore */ }
  }, [ordersView]);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(searchQ.trim()), 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const hasActiveFilters = channelFilter || statusFilter || dateFrom || dateTo || searchDebounced;

  const filters = useMemo(() => ({
    channel: channelFilter || undefined,
    status: statusFilter || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    q: searchDebounced || undefined,
  }), [channelFilter, statusFilter, dateFrom, dateTo, searchDebounced]);

  const fetchOrders = useCallback(async () => {
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
  }, [filters]);

  const clearFilters = () => {
    setChannelFilter(''); setStatusFilter('');
    setDateFrom(''); setDateTo(''); setSearchQ('');
  };

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!expandedId) { setStatusEditDraft(''); return; }
    const o = orders.find((x) => x.id === expandedId);
    if (o) setStatusEditDraft(o.status || '');
  }, [expandedId, orders]);

  const handleUpdateOrderStatus = async (orderId) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o || statusEditDraft === o.status) return;
    setStatusUpdatingId(orderId);
    setError('');
    try { await updateAdminOrderStatus(orderId, statusEditDraft); await fetchOrders(); }
    catch (e) { setError(e.message || 'Error al actualizar el estado'); }
    finally { setStatusUpdatingId(null); }
  };

  const handleRefundNave = async (orderId) => {
    if (!window.confirm('¿Solicitar reembolso en Nave? El cliente recibirá un email y el estado pasará a reembolso en curso hasta confirmación de Nave.')) return;
    setRefundingId(orderId);
    setError('');
    try { await refundNaveOrder(orderId); await fetchOrders(); setExpandedId(orderId); }
    catch (e) { setError(e.message || 'Error al solicitar reembolso'); }
    finally { setRefundingId(null); }
  };

  const toggleExpand = (order) => {
    if (expandedId === order.id) { setExpandedId(null); }
    else { setExpandedId(order.id); setStatusEditDraft(order.status || ''); }
  };

  const toggleDispatchPanel = useCallback((orderId) => {
    setOpenDispatchPanels((prev) => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  }, []);

  const handleDispatchSuccess = useCallback((orderId, tracking) => {
    setDispatchedTracking((prev) => ({ ...prev, [orderId]: tracking }));
    setTimeout(() => {
      setOpenDispatchPanels((prev) => { const next = new Set(prev); next.delete(orderId); return next; });
      fetchOrders();
    }, 3000);
  }, [fetchOrders]);

  const detailProps = {
    statusEditDraft, setStatusEditDraft,
    statusUpdatingId, handleUpdateOrderStatus,
    refundingId, handleRefundNave,
    openDispatchPanels, toggleDispatchPanel,
    handleDispatchSuccess, dispatchedTracking,
  };

  return (
    <div className={`mx-auto ${ordersView === 'grid' ? 'max-w-7xl' : 'max-w-5xl'}`}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-16 h-0.5 bg-[rgb(255,0,255)] mb-6" />
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="text-3xl sm:text-4xl font-heading tracking-wider mb-4">
        Pedidos
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="text-white/70 mb-8">
        {ordersView === 'grid'
          ? 'Tocá una tarjeta para ver detalle, ítems y acciones.'
          : 'Todas las órdenes. Expandí una fila para ver ítems, envío y despacho.'}
      </motion.p>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <div className="flex flex-wrap items-end gap-3 sm:gap-4 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Canal</label>
            <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className={selectClass} style={{ colorScheme: 'dark' }}>
              {CHANNEL_OPTIONS.map((o) => <option key={o.value || 'all'} value={o.value} className="bg-[#0b0b0b] text-white">{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Estado</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass} style={{ colorScheme: 'dark' }}>
              {STATUS_OPTIONS.map((o) => <option key={o.value || 'all'} value={o.value} className="bg-[#0b0b0b] text-white">{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label id="from-label" htmlFor="admin-pedidos-date-from" className="text-[10px] uppercase tracking-widest text-white/50">Desde</label>
            <AdminDatePicker id="admin-pedidos-date-from" aria-labelledby="from-label" value={dateFrom} onChange={setDateFrom} max={dateTo || defaultDateTo} />
          </div>
          <div className="flex flex-col gap-1">
            <label id="to-label" htmlFor="admin-pedidos-date-to" className="text-[10px] uppercase tracking-widest text-white/50">Hasta</label>
            <AdminDatePicker id="admin-pedidos-date-to" aria-labelledby="to-label" value={dateTo} onChange={setDateTo} min={dateFrom || undefined} max={defaultDateTo} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Cliente / email</label>
            <input type="search" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Buscar..." className={inputClass} autoComplete="off" />
          </div>
          <div className="flex flex-col gap-1" title="Cómo mostrar los pedidos">
            <label className="text-[10px] uppercase tracking-widest text-white/50">Vista</label>
            <div className="flex rounded border border-white/20 p-0.5 bg-[#0b0b0b]">
              <button type="button" onClick={() => setOrdersView('list')} className={`p-2 rounded transition-colors ${ordersView === 'list' ? 'bg-white/15 text-[rgb(0,255,255)]' : 'text-white/45 hover:text-white/80'}`} aria-label="Vista en filas" aria-pressed={ordersView === 'list'}><IconList /></button>
              <button type="button" onClick={() => setOrdersView('grid')} className={`p-2 rounded transition-colors ${ordersView === 'grid' ? 'bg-white/15 text-[rgb(0,255,255)]' : 'text-white/45 hover:text-white/80'}`} aria-label="Vista en tarjetas" aria-pressed={ordersView === 'grid'}><IconGrid /></button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchOrders} className="border border-[rgb(0,255,255)]/50 text-[rgb(0,255,255)] px-4 py-2 text-xs uppercase tracking-widest hover:bg-[rgb(0,255,255)]/10 transition-colors rounded">Actualizar</button>
            {hasActiveFilters && <button type="button" onClick={clearFilters} className="text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors">Limpiar</button>}
          </div>
        </div>
        {hasActiveFilters && !loading && (
          <p className="mt-2 text-xs text-white/50">{orders.length} resultado{orders.length !== 1 ? 's' : ''}</p>
        )}
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded border border-red-500/50 bg-red-500/10 text-red-200 text-sm">
          {error}
        </motion.div>
      )}

      {loading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-[rgb(255,0,255)]/30 border-t-[rgb(255,0,255)] rounded-full animate-spin" />
        </motion.div>
      ) : ordersView === 'list' ? (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/50 text-center py-12">No hay pedidos con este filtro.</motion.p>
          ) : (
            <AnimatePresence mode="popLayout">
              {orders.map((order, index) => (
                <motion.div key={order.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: index * 0.04, layout: { duration: 0.25 } }}
                  className="border border-white/20 rounded-lg overflow-hidden bg-white/[0.02]">
                  <button type="button" onClick={() => toggleExpand(order)} className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-4 hover:bg-white/[0.04] transition-colors">
                    <span className="font-mono text-sm text-[rgb(0,255,255)]">#{shortId(order.id)}</span>
                    <span className="text-white/60 text-sm">{formatDate(order.created_at)}</span>
                    <span className={`text-xs uppercase tracking-widest px-2 py-1 rounded ${order.channel === 'retail'
                        ? 'bg-[rgb(0,255,255)]/15 text-[rgb(0,255,255)] border border-[rgb(0,255,255)]/30'
                        : 'bg-[rgb(255,0,255)]/15 text-[rgb(255,0,255)] border border-[rgb(255,0,255)]/30'
                      }`}>{order.channel === 'retail' ? 'Retail' : 'Mayorista'}</span>
                    {order.payment_method && (
                      <span className="text-xs uppercase tracking-widest px-2 py-1 rounded border border-white/20 text-white/70 bg-white/5">
                        {formatPaymentMethod(order.payment_method)}
                      </span>
                    )}
                    {order.shipping_provider === 'correo_argentino' && (
                      <span className="text-xs px-2 py-1 rounded border border-amber-500/40 text-amber-300 bg-amber-500/10">Correo AR</span>
                    )}
                    {(order.shipping_status === 'imported' || order.shipping_tracking_number) && (
                      <span className="text-xs px-2 py-1 rounded border border-emerald-500/40 text-emerald-300 bg-emerald-500/10">Despachado</span>
                    )}
                    <span className="text-white font-medium truncate max-w-[180px]">{order.customer_name || order.customer_email || '—'}</span>
                    <span className="text-white/50 text-sm truncate max-w-[200px]">{order.customer_email || '—'}</span>
                    <span className="ml-auto text-lg font-light text-white tabular-nums">{formatMoney(order.total, order.currency)}</span>
                    <span className={`text-xs uppercase ${statusTextClass(order.status)}`}>{order.status}</span>
                    <span className="text-white/40">{expandedId === order.id ? '▼' : '▶'}</span>
                  </button>
                  <AnimatePresence>
                    {expandedId === order.id && (
                      <motion.div layout initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }} className="border-t border-white/10 overflow-hidden">
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
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/50 text-center py-12">No hay pedidos con este filtro.</motion.p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              <AnimatePresence mode="popLayout">
                {orders.map((order, index) => (
                  <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, delay: index * 0.02 }}
                    className={`flex flex-col rounded-xl border bg-white/[0.03] overflow-hidden min-w-0 transition-shadow ${expandedId === order.id
                        ? 'border-[rgb(0,255,255)]/40 shadow-[0_0_0_1px_rgba(0,255,255,0.12)]'
                        : 'border-white/15 hover:border-white/25'
                      }`}>
                    <button type="button" onClick={() => toggleExpand(order)} className="flex flex-col items-stretch text-left p-4 aspect-square max-h-[260px] min-h-[200px] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-mono text-sm text-[rgb(0,255,255)]">#{shortId(order.id)}</span>
                        <span className="text-white/35 text-lg leading-none">{expandedId === order.id ? '▼' : '▶'}</span>
                      </div>
                      <span className="text-[10px] text-white/45 mb-3 line-clamp-2">{formatDate(order.created_at)}</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${order.channel === 'retail'
                            ? 'bg-[rgb(0,255,255)]/15 text-[rgb(0,255,255)] border border-[rgb(0,255,255)]/25'
                            : 'bg-[rgb(255,0,255)]/15 text-[rgb(255,0,255)] border border-[rgb(255,0,255)]/25'
                          }`}>{order.channel === 'retail' ? 'Retail' : 'Mayorista'}</span>
                        {order.payment_method && (
                          <span className="text-[10px] uppercase px-2 py-0.5 rounded border border-white/15 text-white/55">
                            {formatPaymentMethod(order.payment_method)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/90 font-medium line-clamp-2 mb-1 flex-1">{order.customer_name || order.customer_email || '—'}</p>
                      {order.customer_email && order.customer_name && (
                        <p className="text-[11px] text-white/40 line-clamp-1 mb-3">{order.customer_email}</p>
                      )}
                      <div className="mt-auto pt-2 border-t border-white/10 flex items-end justify-between gap-2">
                        <span className={`text-[10px] uppercase font-medium ${statusTextClass(order.status)}`}>{order.status}</span>
                        <span className="text-lg font-light text-white tabular-nums shrink-0">{formatMoney(order.total, order.currency)}</span>
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedId === order.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="border-t border-white/10 overflow-hidden max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
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