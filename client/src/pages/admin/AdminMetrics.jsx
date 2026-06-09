import { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getMetrics } from '../../services/adminMetrics';

// ── Helpers ───────────────────────────────────────────────────────────────
const CYAN = 'rgb(0,255,255)';

function formatMoney(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function formatInt(n) {
  return new Intl.NumberFormat('es-AR').format(Number(n) || 0);
}

function shortDay(ymd) {
  // 'YYYY-MM-DD' → 'DD/MM' (sin instanciar Date para evitar corrimiento de TZ)
  if (!ymd || typeof ymd !== 'string') return '';
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}`;
}

// ── Metric card ───────────────────────────────────────────────────────────
function MetricCard({ label, value, primary = false, accent = false }) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/[0.02] p-4 sm:p-5 flex flex-col justify-between ${
        primary ? 'col-span-2 md:col-span-1' : ''
      }`}
    >
      <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-white/50 mb-2">
        {label}
      </p>
      <p
        className={`font-heading tabular-nums leading-none ${
          primary ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
        }`}
        style={accent ? { color: CYAN } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

// ── Block ─────────────────────────────────────────────────────────────────
function Block({ title, cols, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="mb-10"
    >
      <h2 className="text-xs font-heading tracking-widest text-white/60 mb-3 uppercase">
        {title}
      </h2>
      <div className={`grid grid-cols-2 ${cols} gap-3 sm:gap-4`}>{children}</div>
    </motion.section>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-white/15 bg-[#0b0b0b] px-3 py-2 text-xs shadow-lg">
      <p className="text-white/60 mb-1">{shortDay(p.date)}</p>
      <p className="font-heading tabular-nums" style={{ color: CYAN }}>
        {formatMoney(p.revenue)}
      </p>
      <p className="text-white/60 mt-0.5">
        {formatInt(p.orders)} {Number(p.orders) === 1 ? 'orden' : 'órdenes'}
      </p>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-10">
      {[4, 6, 4].map((count, bi) => (
        <div key={bi}>
          <div className="h-3 w-32 bg-white/10 rounded mb-3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        </div>
      ))}
      <div className="h-[200px] md:h-[280px] rounded-lg border border-white/10 bg-white/[0.03]" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AdminMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las métricas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const daily = Array.isArray(metrics?.daily_revenue) ? metrics.daily_revenue : [];

  return (
    <div className="mx-auto max-w-7xl">
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
        Métricas
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="text-white/70 mb-8"
      >
        Facturación, ventas y usuarios. Ventas efectivas = órdenes pagadas o enviadas.
      </motion.p>

      {error && (
        <div className="mb-8 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={load}
            className="text-xs uppercase tracking-widest border border-red-400/40 text-red-200 hover:bg-red-500/10 rounded px-3 py-1.5 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : metrics ? (
        <>
          {/* BLOQUE 1 — FACTURACIÓN */}
          <Block title="Facturación" cols="md:grid-cols-4" delay={0.1}>
            <MetricCard label="Facturación total" value={formatMoney(metrics.revenue_total)} primary accent />
            <MetricCard label="Hoy" value={formatMoney(metrics.revenue_today)} />
            <MetricCard label="Este mes" value={formatMoney(metrics.revenue_this_month)} />
            <MetricCard label="Mes anterior" value={formatMoney(metrics.revenue_last_month)} />
          </Block>

          {/* BLOQUE 2 — VENTAS */}
          <Block title="Ventas" cols="md:grid-cols-3" delay={0.16}>
            <MetricCard label="Ventas totales" value={formatInt(metrics.orders_total)} primary accent />
            <MetricCard label="Hoy" value={formatInt(metrics.orders_today)} />
            <MetricCard label="Este mes" value={formatInt(metrics.orders_this_month)} />
            <MetricCard label="Mes anterior" value={formatInt(metrics.orders_last_month)} />
            <MetricCard label="Ticket promedio total" value={formatMoney(metrics.avg_ticket_total)} />
            <MetricCard label="Ticket promedio este mes" value={formatMoney(metrics.avg_ticket_this_month)} />
          </Block>

          {/* BLOQUE 3 — USUARIOS */}
          <Block title="Usuarios" cols="md:grid-cols-4" delay={0.22}>
            <MetricCard label="Usuarios totales" value={formatInt(metrics.users_total)} primary accent />
            <MetricCard label="Nuevos hoy" value={formatInt(metrics.users_today)} />
            <MetricCard label="Nuevos este mes" value={formatInt(metrics.users_this_month)} />
            <MetricCard label="Mes anterior" value={formatInt(metrics.users_last_month)} />
          </Block>

          {/* GRÁFICO — últimos 30 días */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.28 }}
          >
            <h2 className="text-xs font-heading tracking-widest text-white/60 mb-3 uppercase">
              Facturación últimos 30 días
            </h2>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 sm:p-4">
              {daily.length === 0 ? (
                <div className="h-[200px] md:h-[280px] flex items-center justify-center text-white/40 text-sm">
                  Sin ventas en los últimos 30 días.
                </div>
              ) : (
                <div className="h-[200px] md:h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={shortDay}
                        tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                        tickFormatter={(v) => {
                          const n = Number(v) || 0;
                          if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
                          if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
                          return String(n);
                        }}
                      />
                      <Tooltip
                        content={<ChartTooltip />}
                        cursor={{ fill: 'rgba(0,255,255,0.06)' }}
                      />
                      <Bar dataKey="revenue" fill={CYAN} radius={[3, 3, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.section>
        </>
      ) : null}
    </div>
  );
}
