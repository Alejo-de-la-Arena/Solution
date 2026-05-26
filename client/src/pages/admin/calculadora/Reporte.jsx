import { useCallback, useEffect, useMemo, useState } from 'react';
import { getFinanceReport } from '../../../services/finance';

function formatARS(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function currentYearMonth() {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function rangeForMonth(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

function shiftMonth(year, month, delta) {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function Line({ label, value, accent = false, negative = false, hint = null }) {
  return (
    <div className={`flex items-baseline justify-between py-3 ${accent ? 'border-t border-white/20 mt-2 pt-4' : 'border-t border-white/5'}`}>
      <div className={`text-sm ${accent ? 'uppercase tracking-widest text-white/80' : 'text-white/60'}`}>
        {label}
        {hint && <span className="text-white/30 text-xs ml-2">({hint})</span>}
      </div>
      <div className={`font-mono tabular-nums ${accent ? 'text-lg text-white' : negative ? 'text-red-300' : 'text-white/90'}`}>
        {negative && value > 0 ? '−' : ''}{formatARS(value)}
      </div>
    </div>
  );
}

export default function CalculadoraReporte() {
  const initial = currentYearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { from, to } = useMemo(() => rangeForMonth(year, month), [year, month]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFinanceReport(from, to);
      setReport(data);
    } catch (e) {
      setError(e.message || 'Error generando reporte');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const onPrev = () => { const { year: y, month: m } = shiftMonth(year, month, -1); setYear(y); setMonth(m); };
  const onNext = () => { const { year: y, month: m } = shiftMonth(year, month, 1); setYear(y); setMonth(m); };

  const r = report?.resumen;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrev}
            className="text-white/60 hover:text-white border border-white/20 rounded w-9 h-9 flex items-center justify-center"
            aria-label="Mes anterior"
          >
            ‹
          </button>
          <div className="text-lg font-heading tracking-widest">
            {MONTHS_ES[month - 1]} {year}
          </div>
          <button
            type="button"
            onClick={onNext}
            className="text-white/60 hover:text-white border border-white/20 rounded w-9 h-9 flex items-center justify-center"
            aria-label="Mes siguiente"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="text-xs uppercase tracking-widest border border-white/20 rounded px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition disabled:opacity-50"
        >
          {loading ? 'Cargando…' : 'Refrescar'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-300 text-sm rounded">
          {error}
        </div>
      )}

      {!loading && r && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded p-6">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-2">Cierre {from} → {to}</div>
            <Line label="Ingresos brutos" value={r.ingresos_brutos} />
            <Line label="Comisiones de pasarela" value={r.comisiones_pasarela} negative hint="MP / Nave" />
            <Line label="Impuestos retenidos" value={r.impuestos_retenidos} negative hint="IVA / IIBB en cobro" />
            <Line label="Neto recibido" value={r.neto_recibido} accent />
            <Line label="Costo de envío" value={r.costo_envio} negative />
            <Line label="Costo de productos (COGS)" value={r.cogs} negative />
            <Line label="Ganancia operativa" value={r.ganancia_operativa} accent />
            <Line label="Gastos fijos del período" value={r.gastos_fijos} negative hint="pauta, agencia, infra…" />
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
          </div>
        </div>
      )}

      {loading && <p className="text-white/50 text-sm">Calculando…</p>}
    </div>
  );
}
