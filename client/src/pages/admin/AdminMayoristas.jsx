import { useEffect, useState } from 'react';
import { listWholesaleApplications, reviewWholesaleApplication } from '../../services/admin';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
];

// Selects dark theme: fondo #0b0b0b, borde acento, texto blanco
const selectClass =
  'bg-[#0b0b0b] border border-[rgb(255,0,255)] rounded px-3 py-2 text-white text-sm focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-1 focus:ring-[rgb(0,255,255)]/30 appearance-none cursor-pointer';

export default function AdminMayoristas() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [approvePlan, setApprovePlan] = useState('A');
  const [lastReviewResult, setLastReviewResult] = useState(null);

  const fetchList = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const list = await listWholesaleApplications(statusFilter);
      setApplications(list);
    } catch (e) {
      setError(e.message || 'Error al cargar solicitudes');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [statusFilter]);

  const selected = applications.find((a) => a.id === selectedId);
  const isReviewed = selected && selected.status !== 'pending';

  const handleReview = async (applicationId, decision, plan) => {
    if (actionLoading) return;
    setActionLoading(applicationId);
    setError('');
    setLastReviewResult(null);
    try {
      const data = await reviewWholesaleApplication(applicationId, decision, plan);
      setLastReviewResult({ mode: data?.mode, emailSent: data?.emailSent });
      await fetchList(true);
      setSelectedId(null);
    } catch (e) {
      setError(e.message || 'Error al procesar');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="w-16 h-0.5 bg-[rgb(255,0,255)] mb-6" />
      <h1 className="text-3xl sm:text-4xl font-heading tracking-wider mb-4">Solicitudes mayoristas</h1>
      <p className="text-white/70 mb-8">Revisar y aprobar o rechazar solicitudes del programa mayorista.</p>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="text-white/80 text-sm tracking-wide">Estado:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
          style={{ colorScheme: 'dark' }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#0b0b0b] text-white">
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded border border-red-500/50 bg-red-500/10 text-red-200 text-sm">
          {error}
        </div>
      )}

      {lastReviewResult && (
        <div className="mb-6 space-y-2">
          {lastReviewResult.mode === 'no_invite' && (
            <div className="p-3 rounded border border-amber-500/50 bg-amber-500/10 text-amber-200 text-sm">
              Aprobado (modo test: sin invite Supabase). Email enviado por Resend.
            </div>
          )}
          {lastReviewResult.emailSent === false && (
            <div className="p-3 rounded border border-amber-500/50 bg-amber-500/10 text-amber-200 text-sm">
              El envío del email por Resend falló. Revisá RESEND_API_KEY y RESEND_FROM_EMAIL en la Edge Function.
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {applications.length === 0 ? (
              <p className="text-white/50 text-sm">
                {statusFilter === 'pending' && 'No hay solicitudes pendientes.'}
                {statusFilter === 'approved' && 'No hay solicitudes aprobadas.'}
                {statusFilter === 'rejected' && 'No hay solicitudes rechazadas.'}
              </p>
            ) : (
              applications.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setSelectedId(app.id)}
                  className={`w-full text-left border rounded px-4 py-3 transition-colors ${
                    selectedId === app.id
                      ? 'border-[rgb(255,0,255)] bg-white/10'
                      : 'border-white/20 hover:bg-white/5'
                  }`}
                >
                  <span className="block font-medium text-white truncate">{app.full_name || app.email}</span>
                  <span className="block text-white/60 text-sm truncate">{app.email}</span>
                  <span
                    className={`inline-block mt-1 text-xs uppercase ${
                      app.status === 'pending'
                        ? 'text-amber-400'
                        : app.status === 'approved'
                          ? 'text-emerald-400'
                          : 'text-red-400'
                    }`}
                  >
                    {app.status}
                    {app.wholesale_plan && app.status === 'approved' ? ` · Plan ${app.wholesale_plan}` : ''}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border border-white/20 rounded p-6">
            {!selected ? (
              <p className="text-white/50 text-sm">Seleccioná una solicitud.</p>
            ) : (
              <>
                <h2 className="text-lg font-heading tracking-wider mb-4">Detalle</h2>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-white/60">Nombre</dt>
                    <dd className="text-white">{selected.full_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-white/60">Email</dt>
                    <dd className="text-white">{selected.email}</dd>
                  </div>
                  <div>
                    <dt className="text-white/60">Teléfono</dt>
                    <dd className="text-white">{selected.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-white/60">Estado</dt>
                    <dd className="text-white uppercase">
                      {selected.status}
                      {selected.wholesale_plan && selected.status === 'approved'
                        ? ` · Plan ${selected.wholesale_plan}`
                        : ''}
                    </dd>
                  </div>
                  {selected.answers && typeof selected.answers === 'object' && (
                    <div>
                      <dt className="text-white/60 mb-1">Respuestas</dt>
                      <dd className="text-white/80 text-xs whitespace-pre-wrap">
                        {JSON.stringify(selected.answers, null, 2)}
                      </dd>
                    </div>
                  )}
                </dl>

                {selected.status === 'pending' && (
                  <div className="mt-8 pt-6 border-t border-white/20 space-y-4">
                    <div>
                      <label className="block text-white/80 text-sm mb-2">Plan al aprobar</label>
                      <select
                        value={approvePlan}
                        onChange={(e) => setApprovePlan(e.target.value)}
                        className={selectClass}
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="A" className="bg-[#0b0b0b] text-white">Plan A — Revendedor Inicial</option>
                        <option value="B" className="bg-[#0b0b0b] text-white">Plan B — Revendedor Premium</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={!!actionLoading}
                        onClick={() => handleReview(selected.id, 'approve', approvePlan)}
                        className="border border-emerald-500/60 text-emerald-400 px-4 py-2 text-sm uppercase tracking-widest hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === selected.id ? 'Enviando...' : 'Aprobar'}
                      </button>
                      <button
                        type="button"
                        disabled={!!actionLoading}
                        onClick={() => handleReview(selected.id, 'reject')}
                        className="border border-red-500/60 text-red-400 px-4 py-2 text-sm uppercase tracking-widest hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === selected.id ? 'Enviando...' : 'Rechazar'}
                      </button>
                    </div>
                  </div>
                )}

                {isReviewed && (
                  <p className="mt-6 text-white/50 text-sm">
                    Esta solicitud ya fue revisada. No se pueden realizar más acciones.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
