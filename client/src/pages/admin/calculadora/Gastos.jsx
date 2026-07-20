import { useCallback, useEffect, useState } from 'react';
import {
  listFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
} from '../../../services/finance';

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'daily', label: 'Diario' },
  { value: 'annual', label: 'Anual' },
  { value: 'one-time', label: 'Único' },
];

const COMMON_CATEGORIES = ['pauta', 'agencia', 'contador', 'infra', 'logistica', 'otro'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft() {
  return {
    name: '',
    category: 'otro',
    amount: '',
    frequency: 'monthly',
    effective_from: todayIso(),
    notes: '',
  };
}

function formatARS(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CalculadoraGastos() {
  const [items, setItems] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await listFixedExpenses({ history: showHistory });
      setItems(list);
    } catch (e) {
      setError(e.message || 'Error cargando gastos');
    } finally {
      setLoading(false);
    }
  }, [showHistory]);

  useEffect(() => { refresh(); }, [refresh]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: draft.name.trim(),
        category: draft.category.trim() || null,
        amount: Number(draft.amount),
        frequency: draft.frequency,
        effective_from: draft.effective_from,
        notes: draft.notes.trim() || null,
      };
      if (!payload.name) { setError('Nombre requerido'); setSaving(false); return; }
      if (!Number.isFinite(payload.amount) || payload.amount < 0) {
        setError('Monto inválido'); setSaving(false); return;
      }

      if (editingId) {
        await updateFixedExpense(editingId, payload);
      } else {
        await createFixedExpense(payload);
      }
      setDraft(emptyDraft());
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (exp) => {
    setEditingId(exp.id);
    setDraft({
      name: exp.name || '',
      category: exp.category || 'otro',
      amount: exp.amount != null ? String(exp.amount) : '',
      frequency: exp.frequency || 'monthly',
      effective_from: exp.effective_from || todayIso(),
      notes: exp.notes || '',
    });
  };

  // Cierre suave: deja de aplicar desde hoy pero SIGUE impactando los meses
  // donde ya estuvo vigente. Para gastos reales que terminaron.
  const onClose = async (exp) => {
    if (!window.confirm(
      `¿Cerrar "${exp.name}"?\n\n` +
      `Deja de aplicar desde hoy, pero SIGUE impactando los reportes de los ` +
      `meses donde ya estuvo vigente (es un gasto real que terminó).`
    )) return;
    try {
      await deleteFixedExpense(exp.id);
      await refresh();
    } catch (err) {
      setError(err.message || 'Error cerrando gasto');
    }
  };

  // Borrado real: saca el gasto de TODOS los períodos, histórico incluido.
  // Para gastos de prueba o cargados por error.
  const onPurge = async (exp) => {
    if (!window.confirm(
      `¿Eliminar "${exp.name}" definitivamente?\n\n` +
      `Se borra de TODOS los períodos, incluido el histórico. Ideal para ` +
      `gastos de prueba o cargados por error. No se puede deshacer.`
    )) return;
    try {
      await deleteFixedExpense(exp.id, { purge: true });
      await refresh();
    } catch (err) {
      setError(err.message || 'Error eliminando gasto');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-300 text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white/[0.03] border border-white/10 rounded p-5 mb-8">
        <div className="text-xs uppercase tracking-widest text-white/50 mb-4">
          {editingId ? 'Editar gasto' : 'Nuevo gasto'}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Nombre</span>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="ej. Meta Ads Mayo"
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-[rgb(255,0,255)]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Categoría</span>
            <input
              type="text"
              list="categories"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-[rgb(255,0,255)]"
            />
            <datalist id="categories">
              {COMMON_CATEGORIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>

          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Monto (ARS)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={draft.amount}
              onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-[rgb(255,0,255)]"
            />
          </label>

          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Frecuencia</span>
            <select
              value={draft.frequency}
              onChange={(e) => setDraft({ ...draft, frequency: e.target.value })}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-[rgb(255,0,255)]"
            >
              {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-white/50 block mb-1">Vigente desde</span>
            <input
              type="date"
              value={draft.effective_from}
              onChange={(e) => setDraft({ ...draft, effective_from: e.target.value })}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-[rgb(255,0,255)]"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-xs text-white/50 block mb-1">Notas</span>
            <input
              type="text"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-[rgb(255,0,255)]"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="text-xs uppercase tracking-widest bg-[rgb(255,0,255)] text-black rounded px-5 py-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Guardando…' : editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs uppercase tracking-widest border border-white/20 rounded px-5 py-2 text-white/70 hover:text-white hover:border-white/40 transition"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-white/50">
          {showHistory ? 'Vigentes + histórico' : 'Sólo vigentes'}
        </div>
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input
            type="checkbox"
            checked={showHistory}
            onChange={(e) => setShowHistory(e.target.checked)}
          />
          Mostrar histórico
        </label>
      </div>

      {loading ? (
        <p className="text-white/50 text-sm">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="text-white/40 text-sm italic">Sin gastos cargados.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 uppercase tracking-widest text-xs">
              <th className="py-3 pr-4">Nombre</th>
              <th className="py-3 pr-4">Categoría</th>
              <th className="py-3 pr-4">Monto</th>
              <th className="py-3 pr-4">Frecuencia</th>
              <th className="py-3 pr-4">Vigencia</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((exp) => (
              <tr key={exp.id} className="border-t border-white/10">
                <td className="py-3 pr-4">
                  <div className="font-medium">{exp.name}</div>
                  {exp.notes && <div className="text-white/40 text-xs">{exp.notes}</div>}
                </td>
                <td className="py-3 pr-4 text-white/60">{exp.category || '—'}</td>
                <td className="py-3 pr-4 text-white/80">{formatARS(exp.amount)}</td>
                <td className="py-3 pr-4 text-white/60">
                  {FREQUENCIES.find((f) => f.value === exp.frequency)?.label || exp.frequency}
                </td>
                <td className="py-3 pr-4 text-white/60 text-xs">
                  {exp.effective_from}
                  {exp.effective_until ? ` → ${exp.effective_until}` : ' →'}
                </td>
                <td className="py-3">
                  <div className="flex gap-2 justify-end flex-wrap">
                    {!exp.effective_until && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(exp)}
                          className="text-xs uppercase tracking-widest border border-white/20 rounded px-3 py-1.5 text-white/80 hover:text-white hover:border-white/40 transition"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          title="Deja de aplicar desde hoy, pero sigue contando en los meses donde ya estuvo vigente"
                          onClick={() => onClose(exp)}
                          className="text-xs uppercase tracking-widest border border-white/20 rounded px-3 py-1.5 text-white/70 hover:text-white hover:border-white/40 transition"
                        >
                          Cerrar
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      title="Borra el gasto de TODOS los períodos, incluido el histórico (para pruebas o errores)"
                      onClick={() => onPurge(exp)}
                      className="text-xs uppercase tracking-widest border border-red-500/30 rounded px-3 py-1.5 text-red-300 hover:bg-red-500/10 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
