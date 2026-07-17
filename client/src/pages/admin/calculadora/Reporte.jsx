import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getFinanceReport, setDailyPauta, clearDailyPauta } from '../../../services/finance';
import { toYMDLocal, parseYMD } from '../../../components/admin/AdminDatePicker';
import HeatmapMensual from './HeatmapMensual';

function formatARS(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Hoy en hora Argentina (en-CA emite YYYY-MM-DD), independiente del TZ del browser. */
function todayYmdART() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

function addDays(ymd, n) {
  const d = parseYMD(ymd);
  d.setDate(d.getDate() + n);
  return toYMDLocal(d);
}

/** Rango [from, to] según el modo de vista. Semana = lunes a domingo. */
function rangeFor(mode, anchor) {
  if (mode === 'day') return { from: anchor, to: anchor };
  if (mode === 'week') {
    const dow = parseYMD(anchor).getDay();
    const monday = addDays(anchor, -((dow + 6) % 7));
    return { from: monday, to: addDays(monday, 6) };
  }
  const year = Number(anchor.slice(0, 4));
  const month = Number(anchor.slice(5, 7));
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${anchor.slice(0, 7)}-01`,
    to: `${anchor.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`,
  };
}

function shiftAnchor(mode, anchor, delta) {
  if (mode === 'day') return addDays(anchor, delta);
  if (mode === 'week') return addDays(anchor, delta * 7);
  // Mes: anclar al día 1 evita saltos raros desde el 29/30/31.
  return toYMDLocal(new Date(Number(anchor.slice(0, 4)), Number(anchor.slice(5, 7)) - 1 + delta, 1));
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function labelFor(mode, anchor, from, to) {
  if (mode === 'day') {
    const s = parseYMD(anchor).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  if (mode === 'week') {
    const f = parseYMD(from);
    const t = parseYMD(to);
    const sameMonth = f.getMonth() === t.getMonth() && f.getFullYear() === t.getFullYear();
    const fStr = sameMonth
      ? String(f.getDate())
      : f.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
    const tStr = t.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
    return `Semana del ${fStr} al ${tStr}`;
  }
  return `${MONTHS_ES[Number(anchor.slice(5, 7)) - 1]} ${anchor.slice(0, 4)}`;
}

const MODES = [
  ['day', 'Día'],
  ['week', 'Semana'],
  ['month', 'Mes'],
];

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Arma el CSV del cierre y dispara la descarga. */
function exportReportCsv(report) {
  const r = report.resumen;
  const d = report.detalle;
  const rows = [];
  rows.push(['Calculadora — Cierre', `${report.period.from} a ${report.period.to}`]);
  rows.push([]);
  rows.push(['Concepto', 'Monto (ARS)']);
  rows.push(['Ingresos brutos', r.ingresos_brutos]);
  rows.push(['Comisiones de pasarela', -r.comisiones_pasarela]);
  rows.push(['Impuestos retenidos', -r.impuestos_retenidos]);
  rows.push(['Neto recibido', r.neto_recibido]);
  // Envío cobrado va sin signo: es informativo, ya está dentro de ingresos brutos.
  rows.push(['Envío cobrado al cliente (ya incluido en ingresos)', r.envio_cobrado]);
  rows.push(['Costo real de Correo', -r.costo_envio]);
  rows.push(['  └ Quebranto por envío gratis', r.quebranto_envio_gratis]);
  rows.push(['Costo de productos (COGS)', -r.cogs]);
  rows.push(['Ganancia operativa', r.ganancia_operativa]);
  rows.push(['Gastos fijos', -r.gastos_fijos]);
  rows.push(['Pauta publicitaria', -(r.pauta || 0)]);
  rows.push(['Devoluciones y contracargos', -(r.perdidas_devoluciones || 0)]);
  rows.push(['Ganancia neta', r.ganancia_neta]);
  rows.push(['Margen %', r.margen_pct]);
  rows.push([]);
  rows.push(['Unidades por SKU']);
  rows.push(['SKU', 'Producto', 'Unidades', 'Facturación', 'COGS']);
  for (const s of d.unidades_por_sku) rows.push([s.sku, s.name || '', s.units, s.revenue, s.cogs]);
  if (d.devoluciones && d.devoluciones.length) {
    rows.push([]);
    rows.push(['Devoluciones / contracargos']);
    rows.push(['Orden', 'Estado', 'Comisión', 'Envío', 'COGS', 'Pérdida']);
    for (const v of d.devoluciones) rows.push([v.id, v.status, v.comision, v.envio, v.cogs, v.perdida]);
  }
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `calculadora-${report.period.from}_${report.period.to}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function Line({ label, value, accent = false, negative = false, hint = null, muted = false, nested = false }) {
  return (
    <div className={`flex items-baseline justify-between py-3 ${accent ? 'border-t border-white/20 mt-2 pt-4' : nested ? '' : 'border-t border-white/5'}`}>
      <div className={`text-sm ${accent ? 'uppercase tracking-widest text-white/80' : nested ? 'text-white/40 pl-4 text-xs' : 'text-white/60'}`}>
        {nested && <span className="text-white/20 mr-2">└</span>}
        {label}
        {hint && <span className="text-white/30 text-xs ml-2">({hint})</span>}
      </div>
      <div
        className={`font-mono tabular-nums ${
          accent ? 'text-lg text-white'
            : muted ? 'text-white/40 text-sm'
            : negative ? 'text-red-300'
            : 'text-white/90'
        }`}
      >
        {negative && value > 0 ? '−' : ''}{formatARS(value)}
      </div>
    </div>
  );
}

export default function CalculadoraReporte() {
  const [mode, setMode] = useState('day');
  const [anchor, setAnchor] = useState(() => todayYmdART());
  const [report, setReport] = useState(null);
  const [monthDaily, setMonthDaily] = useState(null); // { month: 'YYYY-MM', por_dia }
  const [loading, setLoading] = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pautaInput, setPautaInput] = useState('');
  const [pautaSaving, setPautaSaving] = useState(false);
  const monthCacheRef = useRef(new Map()); // 'YYYY-MM' → por_dia
  const breakdownRef = useRef(null);
  const requestIdRef = useRef(0); // descarta respuestas fuera de orden al navegar rápido

  const { from, to } = useMemo(() => rangeFor(mode, anchor), [mode, anchor]);
  const heatmapMonth = anchor.slice(0, 7);
  const todayYmd = todayYmdART();

  // En vista Día, ¿el día que se mira ya tiene pauta cargada? (no está en la
  // lista de días sin cargar que devuelve el reporte).
  const dayHasPauta =
    mode === 'day' && report != null && !(report.avisos?.dias_sin_pauta || []).includes(anchor);

  // Prefill del input de pauta al cargar el reporte del día: el valor guardado
  // si está cargado (puede ser 0), vacío si falta.
  useEffect(() => {
    if (mode !== 'day' || !report) return;
    setPautaInput(dayHasPauta ? String(report.resumen.pauta ?? '') : '');
  }, [report, mode, anchor, dayHasPauta]);

  const load = useCallback(async ({ refresh = false } = {}) => {
    const reqId = ++requestIdRef.current;
    const isStale = () => requestIdRef.current !== reqId;
    try {
      setLoading(true);
      setError(null);
      if (refresh) monthCacheRef.current.delete(heatmapMonth);

      if (mode === 'month') {
        // Una sola request: el reporte del mes con serie diaria alimenta
        // desglose + heatmap.
        const data = await getFinanceReport(from, to, { daily: true });
        monthCacheRef.current.set(heatmapMonth, data.por_dia || []);
        if (isStale()) return;
        setReport(data);
        setMonthDaily({ month: heatmapMonth, por_dia: data.por_dia || [] });
      } else {
        const cached = monthCacheRef.current.get(heatmapMonth);
        const monthRange = rangeFor('month', anchor);
        if (!cached) setHeatmapLoading(true);
        const [data, monthData] = await Promise.all([
          getFinanceReport(from, to),
          cached ? Promise.resolve(null) : getFinanceReport(monthRange.from, monthRange.to, { daily: true }),
        ]);
        const porDia = monthData ? (monthData.por_dia || []) : cached;
        if (monthData) monthCacheRef.current.set(heatmapMonth, porDia);
        if (isStale()) return;
        setReport(data);
        setMonthDaily({ month: heatmapMonth, por_dia: porDia });
      }
    } catch (e) {
      if (isStale()) return;
      setError(e.message || 'Error generando reporte');
      setReport(null);
    } finally {
      if (!isStale()) {
        setLoading(false);
        setHeatmapLoading(false);
      }
    }
  }, [mode, anchor, from, to, heatmapMonth]);

  useEffect(() => { load(); }, [load]);

  const onSelectDay = (fecha) => {
    setMode('day');
    setAnchor(fecha);
    requestAnimationFrame(() => breakdownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const savePauta = async () => {
    const amt = Number(pautaInput);
    if (!Number.isFinite(amt) || amt < 0) {
      setError('Pauta inválida (debe ser un número ≥ 0)');
      return;
    }
    try {
      setPautaSaving(true);
      setError(null);
      await setDailyPauta(anchor, amt);
      await load({ refresh: true }); // recalcula reporte + invalida cache del heatmap
    } catch (e) {
      setError(e.message || 'Error guardando pauta');
    } finally {
      setPautaSaving(false);
    }
  };

  const clearPautaDay = async () => {
    try {
      setPautaSaving(true);
      setError(null);
      await clearDailyPauta(anchor);
      await load({ refresh: true });
    } catch (e) {
      setError(e.message || 'Error borrando pauta');
    } finally {
      setPautaSaving(false);
    }
  };

  const r = report?.resumen;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded border border-white/20 overflow-hidden">
            {MODES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={`text-xs uppercase tracking-widest px-4 py-2 transition ${
                  mode === value
                    ? 'text-[rgb(255,0,255)] bg-[rgb(255,0,255)]/10'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAnchor(shiftAnchor(mode, anchor, -1))}
            className="text-white/60 hover:text-white border border-white/20 rounded w-9 h-9 flex items-center justify-center"
            aria-label="Período anterior"
          >
            ‹
          </button>
          <div className="text-lg font-heading tracking-widest">
            {labelFor(mode, anchor, from, to)}
          </div>
          <button
            type="button"
            onClick={() => setAnchor(shiftAnchor(mode, anchor, 1))}
            className="text-white/60 hover:text-white border border-white/20 rounded w-9 h-9 flex items-center justify-center"
            aria-label="Período siguiente"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setAnchor(todayYmdART())}
            className="text-xs uppercase tracking-widest border border-white/20 rounded px-3 py-2 text-white/60 hover:text-white hover:border-white/40 transition"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => report && exportReportCsv(report)}
            disabled={loading || !report}
            className="text-xs uppercase tracking-widest border border-white/20 rounded px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition disabled:opacity-50"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => load({ refresh: true })}
            disabled={loading}
            className="text-xs uppercase tracking-widest border border-white/20 rounded px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Refrescar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-300 text-sm rounded">
          {error}
        </div>
      )}

      {!loading && r && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div ref={breakdownRef} className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded p-6 scroll-mt-6">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
              Cierre {from === to ? from : `${from} → ${to}`}
            </div>
            <Line label="Ingresos brutos" value={r.ingresos_brutos} />
            <Line label="Comisiones de pasarela" value={r.comisiones_pasarela} negative hint="MP / Nave" />
            <Line label="Impuestos retenidos" value={r.impuestos_retenidos} negative hint="IVA / IIBB en cobro" />
            <Line label="Neto recibido" value={r.neto_recibido} accent />
            {/* Envío cobrado es informativo: ya está dentro de ingresos brutos.
                El que resta de la ganancia es el costo real de Correo. */}
            <Line label="Envío cobrado al cliente" value={r.envio_cobrado} muted hint="ya incluido arriba" />
            <Line label="Costo real de Correo" value={r.costo_envio} negative />
            {r.quebranto_envio_gratis > 0 && (
              <Line label="Quebranto por envío gratis" value={r.quebranto_envio_gratis} nested muted />
            )}
            <Line label="Costo de productos (COGS)" value={r.cogs} negative />
            <Line label="Ganancia operativa" value={r.ganancia_operativa} accent />
            <Line label="Gastos fijos del período" value={r.gastos_fijos} negative hint="alquiler, contador, infra…" />
            <Line
              label="Pauta publicitaria"
              value={r.pauta}
              negative
              hint={mode === 'day' ? null : 'suma del período'}
            />
            {/* Carga inline de la pauta del día (solo en vista Día). */}
            {mode === 'day' && (
              <div className="pl-4 pb-3 flex flex-wrap items-center gap-2">
                <span className="text-white/30 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pautaInput}
                  onChange={(e) => setPautaInput(e.target.value)}
                  placeholder="0.00"
                  className="w-32 bg-white/5 border border-white/15 rounded px-2 py-1 text-sm font-mono tabular-nums focus:outline-none focus:border-[rgb(255,0,255)]"
                />
                <button
                  type="button"
                  onClick={savePauta}
                  disabled={pautaSaving}
                  className="text-xs uppercase tracking-widest bg-[rgb(255,0,255)] text-black rounded px-3 py-1.5 hover:opacity-90 transition disabled:opacity-50"
                >
                  {pautaSaving ? '…' : 'Guardar'}
                </button>
                {dayHasPauta ? (
                  <button
                    type="button"
                    onClick={clearPautaDay}
                    disabled={pautaSaving}
                    className="text-xs text-white/40 hover:text-white/70 underline disabled:opacity-50"
                  >
                    borrar
                  </button>
                ) : (
                  <span className="text-yellow-300/80 text-xs">⚠ sin cargar — se asume $0</span>
                )}
              </div>
            )}
            {r.perdidas_devoluciones > 0 && (
              <Line label="Devoluciones y contracargos" value={r.perdidas_devoluciones} negative hint="comisión + envío + costo" />
            )}
            <Line label="Ganancia neta" value={r.ganancia_neta} accent />
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-baseline">
              <span className="uppercase tracking-widest text-xs text-white/60">Margen</span>
              <span className="font-mono text-2xl text-[rgb(255,0,255)]">
                {Number(r.margen_pct).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%
              </span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white/[0.03] border border-white/10 rounded p-5">
              <div className="text-xs uppercase tracking-widest text-white/40 mb-3">Unidades por SKU</div>
              {report.detalle.unidades_por_sku.length === 0 ? (
                <p className="text-white/40 text-sm italic">Sin ventas en el período.</p>
              ) : (
                <ul className="space-y-2">
                  {report.detalle.unidades_por_sku.map((row) => (
                    <li key={row.sku} className="flex justify-between text-sm">
                      <span className="text-white/80">{row.name || row.sku}</span>
                      <span className="font-mono tabular-nums text-white/60">{row.units}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded p-5">
              <div className="text-xs uppercase tracking-widest text-white/40 mb-3">Por canal</div>
              {report.detalle.por_canal.length === 0 ? (
                <p className="text-white/40 text-sm italic">—</p>
              ) : (
                <ul className="space-y-2">
                  {report.detalle.por_canal.map((c) => (
                    <li key={c.channel} className="flex justify-between text-sm">
                      <span className="text-white/80">{c.channel}</span>
                      <span className="font-mono tabular-nums text-white/60">
                        {c.orders} · {formatARS(c.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded p-5">
              <div className="text-xs uppercase tracking-widest text-white/40 mb-3">Por método de pago</div>
              {report.detalle.por_metodo_pago.length === 0 ? (
                <p className="text-white/40 text-sm italic">—</p>
              ) : (
                <ul className="space-y-2">
                  {report.detalle.por_metodo_pago.map((p) => (
                    <li key={p.payment_method} className="flex justify-between text-sm">
                      <span className="text-white/80">{p.payment_method}</span>
                      <span className="font-mono tabular-nums text-white/60">
                        {p.orders} · {formatARS(p.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {report.detalle.gastos_fijos.length > 0 && (
              <div className="bg-white/[0.03] border border-white/10 rounded p-5">
                <div className="text-xs uppercase tracking-widest text-white/40 mb-3">Gastos fijos prorrateados</div>
                <ul className="space-y-2">
                  {report.detalle.gastos_fijos.map((g) => (
                    <li key={g.id} className="flex justify-between text-sm">
                      <span className="text-white/80">{g.name} <span className="text-white/40 text-xs">({g.category || g.frequency})</span></span>
                      <span className="font-mono tabular-nums text-white/60">{formatARS(g.amount_in_range)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.detalle.devoluciones && report.detalle.devoluciones.length > 0 && (
              <div className="bg-white/[0.03] border border-white/10 rounded p-5">
                <div className="text-xs uppercase tracking-widest text-white/40 mb-3">Devoluciones y contracargos</div>
                <ul className="space-y-2">
                  {report.detalle.devoluciones.map((v) => (
                    <li key={v.id} className="flex justify-between text-sm">
                      <span className="text-white/80">
                        {v.status === 'chargeback' ? 'Contracargo' : 'Devolución'}
                        <span className="text-white/40 text-xs ml-2">#{String(v.id).slice(0, 8)}</span>
                      </span>
                      <span className="font-mono tabular-nums text-red-300">−{formatARS(v.perdida)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(report.avisos.ordenes_sin_desglose_financiero > 0 || report.avisos.unidades_vendidas_sin_costo > 0) && (
              <div className="bg-yellow-500/5 border border-yellow-500/30 text-yellow-200 text-xs rounded p-4 space-y-1">
                {report.avisos.ordenes_sin_desglose_financiero > 0 && (
                  <div>
                    {report.avisos.ordenes_sin_desglose_financiero} órden(es) sin desglose financiero — neto estimado = total bruto. Correr el backfill para precisión.
                  </div>
                )}
                {report.avisos.unidades_vendidas_sin_costo > 0 && (
                  <div>
                    {report.avisos.unidades_vendidas_sin_costo} unidad(es) vendida(s) sin costo definido — COGS subestimado. Cargá costos en la pestaña Costos.
                  </div>
                )}
              </div>
            )}

            {report.avisos.pauta_no_configurada && (
              <div className="bg-orange-500/5 border border-orange-500/30 text-orange-200 text-xs rounded p-4">
                La pauta no está disponible: falta aplicar la migración <code className="text-orange-100">daily_expenses</code> en la base. La ganancia neta todavía no descuenta pauta.
              </div>
            )}

            {report.avisos.pauta_dias_sin_cargar > 0 && (
              <div className="bg-yellow-500/5 border border-yellow-500/30 text-yellow-200 text-xs rounded p-4">
                <div className="font-medium mb-1">
                  {report.avisos.pauta_dias_sin_cargar} día(s) sin pauta cargada — se asumen $0.
                </div>
                <div className="text-yellow-200/70">
                  {report.avisos.dias_sin_pauta.slice(0, 8).join(' · ')}
                  {report.avisos.dias_sin_pauta.length > 8 && ` · +${report.avisos.dias_sin_pauta.length - 8} más`}
                </div>
                <div className="text-yellow-200/50 mt-1">
                  Abrí cada día (clic en el heatmap) y cargá la pauta, o dejá $0 si no hubo.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && <p className="text-white/50 text-sm">Calculando…</p>}

      <HeatmapMensual
        month={heatmapMonth}
        porDia={monthDaily?.month === heatmapMonth ? monthDaily.por_dia : null}
        selectedDay={mode === 'day' ? anchor : null}
        todayYmd={todayYmd}
        onSelectDay={onSelectDay}
        loading={heatmapLoading}
      />
    </div>
  );
}
