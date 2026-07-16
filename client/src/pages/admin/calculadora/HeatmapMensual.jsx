import { useMemo } from 'react';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/** Lunes = primera columna (misma convención que AdminDatePicker). */
function mondayOffsetFirstOfMonth(year, monthIndex) {
  const dow = new Date(year, monthIndex, 1).getDay();
  return dow === 0 ? 6 : dow - 1;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

/** Abrevia un monto para la celda: 62k, −4k, 850. */
function compactARS(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
  return `${sign}${Math.round(abs)}`;
}

function formatARS(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const GREEN = [34, 197, 94];
const ORANGE = [249, 115, 22];
const NEUTRAL_BAND = 0.08;

/**
 * Agenda mensual: cada día pintado según su ganancia neta vs el promedio de
 * los días con ventas del mes. Verde = por encima, naranja = por debajo,
 * gris = sin ventas / en el promedio. Click en un día → desglose de ese día.
 *
 * @param {object} props
 * @param {string} props.month 'YYYY-MM' del mes a mostrar
 * @param {Array|null} props.porDia serie del backend (solo días pasados/hoy)
 * @param {string|null} props.selectedDay YYYY-MM-DD resaltado (vista Día activa)
 * @param {string} props.todayYmd hoy en hora Argentina
 * @param {(fecha: string) => void} props.onSelectDay
 * @param {boolean} props.loading
 */
export default function HeatmapMensual({ month, porDia, selectedDay, todayYmd, onSelectDay, loading }) {
  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const offset = mondayOffsetFirstOfMonth(year, monthIndex);

  const { byFecha, avg, scale } = useMemo(() => {
    const list = porDia || [];
    const map = new Map(list.map((d) => [d.fecha, d]));
    const conVentas = list.filter((d) => d.ordenes > 0);
    const promedio = conVentas.reduce((s, d) => s + d.ganancia_neta, 0) / (conVentas.length || 1);
    const maxDev = Math.max(...conVentas.map((d) => Math.abs(d.ganancia_neta - promedio)), 1);
    return {
      byFecha: map,
      avg: conVentas.length > 0 ? promedio : null,
      scale: Math.max(Math.abs(promedio), maxDev),
    };
  }, [porDia]);

  const cellStyle = (d) => {
    if (avg == null) return {};
    let t = clamp((d.ganancia_neta - avg) / scale, -1, 1);
    if (d.ganancia_neta < 0) t = -1;
    if (Math.abs(t) < NEUTRAL_BAND) return { backgroundColor: 'rgba(255,255,255,0.06)' };
    const alpha = 0.12 + 0.48 * Math.abs(t);
    const [r, g, b] = t > 0 ? GREEN : ORANGE;
    return {
      backgroundColor: `rgba(${r},${g},${b},${alpha})`,
      borderColor: `rgba(${r},${g},${b},${Math.min(alpha + 0.25, 0.9)})`,
    };
  };

  return (
    <div className="mt-6 bg-white/[0.03] border border-white/10 rounded p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div className="text-xs uppercase tracking-widest text-white/40">
          Agenda del mes — {MONTHS_ES[monthIndex]} {year}
        </div>
        {loading && <span className="text-white/40 text-xs">Cargando…</span>}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] uppercase tracking-widest text-white/30">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: offset }, (_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNum = i + 1;
          const fecha = `${month}-${String(dayNum).padStart(2, '0')}`;
          const d = byFecha.get(fecha);
          const isToday = fecha === todayYmd;
          const isSelected = fecha === selectedDay;

          if (!d) {
            return (
              <div
                key={fecha}
                className={`h-14 rounded border border-white/5 flex flex-col items-center justify-center text-white/20 ${isToday ? 'border-dashed border-white/30' : ''}`}
              >
                <span className="text-xs">{dayNum}</span>
              </div>
            );
          }

          const sinVentas = d.ordenes === 0;
          return (
            <button
              key={fecha}
              type="button"
              onClick={() => onSelectDay(fecha)}
              style={sinVentas ? {} : cellStyle(d)}
              title={`${fecha} · ${d.ordenes} orden(es) · Ganancia neta $ ${formatARS(d.ganancia_neta)}`}
              aria-label={`Ver desglose del ${fecha}`}
              className={[
                'h-14 rounded border flex flex-col items-center justify-center gap-0.5 transition',
                sinVentas ? 'bg-white/[0.04] border-white/5 text-white/30' : 'border-transparent text-white/90',
                isToday ? 'border-dashed !border-white/50' : '',
                isSelected ? 'ring-1 ring-[rgb(255,0,255)]' : '',
                'hover:ring-1 hover:ring-white/40',
              ].join(' ')}
            >
              <span className="text-xs leading-none">{dayNum}</span>
              <span className="font-mono tabular-nums text-[10px] leading-none opacity-80">
                {sinVentas ? '—' : compactARS(d.ganancia_neta)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(${ORANGE.join(',')},0.5)` }} />
          por debajo del promedio
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-white/10" />
          promedio / sin ventas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(${GREEN.join(',')},0.5)` }} />
          por encima del promedio
        </span>
        {avg != null && (
          <span className="ml-auto font-mono tabular-nums text-white/40">
            promedio (días con ventas): $ {formatARS(avg)}
          </span>
        )}
      </div>
    </div>
  );
}
