import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listWholesaleApplications, reviewWholesaleApplication } from '../services/admin';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
];

export default function Admin() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [approvePlan, setApprovePlan] = useState('A');

  const fetchList = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await listWholesaleApplications(statusFilter || null);
      setApplications(list);
    } catch (e) {
      setError(e.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [statusFilter]);

  const selected = applications.find((a) => a.id === selectedId);

  const handleReview = async (applicationId, decision, plan) => {
    setActionLoading(applicationId);
    setError('');
    try {
      await reviewWholesaleApplication(applicationId, decision, plan);
      await fetchList();
      setSelectedId(null);
    } catch (e) {
      setError(e.message || 'Error al procesar');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="w-16 h-0.5 bg-[rgb(255,0,255)] mb-6" />
        <h1 className="text-3xl sm:text-4xl font-heading tracking-wider mb-4">Panel de administración</h1>
        <p className="text-white/70 mb-8">Solicitudes mayoristas.</p>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <label className="text-white/80 text-sm tracking-wide">Estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-[rgb(255,0,255)] focus:outline-none"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
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

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {applications.length === 0 ? (
                <p className="text-white/50 text-sm">No hay solicitudes.</p>
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
                      <dd className="text-white uppercase">{selected.status}</dd>
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
                          className="bg-white/5 border border-white/20 rounded px-3 py-2 text-white text-sm focus:border-[rgb(255,0,255)] focus:outline-none"
                        >
                          <option value="A">Plan A — Revendedor Inicial</option>
                          <option value="B">Plan B — Revendedor Premium</option>
                        </select>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleReview(selected.id, 'approve', approvePlan)}
                          className="border border-emerald-500/60 text-emerald-400 px-4 py-2 text-sm uppercase tracking-widest hover:bg-emerald-500/10 disabled:opacity-50"
                        >
                          {actionLoading === selected.id ? '...' : 'Aprobar'}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => handleReview(selected.id, 'reject')}
                          className="border border-red-500/60 text-red-400 px-4 py-2 text-sm uppercase tracking-widest hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {actionLoading === selected.id ? '...' : 'Rechazar'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link to="/" className="text-[rgb(0,255,255)] hover:underline text-sm tracking-widest">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
