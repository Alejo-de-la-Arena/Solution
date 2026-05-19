import { useCallback, useEffect, useState } from 'react';
import { listProductCosts, updateProductCost } from '../../../services/finance';

function formatARS(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CalculadoraCostos() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await listProductCosts();
      setItems(list);
      const map = {};
      for (const p of list) map[p.id] = p.cost_price == null ? '' : String(p.cost_price);
      setDrafts(map);
    } catch (e) {
      setError(e.message || 'Error cargando costos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onSave = async (productId) => {
    try {
      setSavingId(productId);
      const raw = drafts[productId];
      const value = raw === '' ? null : Number(raw);
      if (value != null && (!Number.isFinite(value) || value < 0)) {
        setError('El costo debe ser un número ≥ 0');
        return;
      }
      await updateProductCost(productId, value);
      setItems((prev) => prev.map((p) => p.id === productId ? { ...p, cost_price: value } : p));
      setSavedId(productId);
      setTimeout(() => setSavedId(null), 1500);
    } catch (e) {
      setError(e.message || 'Error guardando');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <p className="text-white/50 text-sm">Cargando…</p>;

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 border border-red-500/30 bg-red-500/5 text-red-300 text-sm rounded">
          {error}
        </div>
      )}

      <p className="text-white/50 text-xs mb-4">
        Costo unitario actual en ARS. Cambios afectan sólo a ventas <strong>futuras</strong>; las órdenes ya creadas mantienen el costo capturado al momento de la venta.
      </p>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/40 uppercase tracking-widest text-xs">
            <th className="py-3 pr-4">Producto</th>
            <th className="py-3 pr-4">Precio retail</th>
            <th className="py-3 pr-4">Precio mayorista</th>
            <th className="py-3 pr-4">Costo (ARS)</th>
            <th className="py-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id} className="border-t border-white/10">
              <td className="py-3 pr-4">
                <div className="font-medium">{p.name}</div>
                <div className="text-white/40 text-xs">{p.slug}</div>
              </td>
              <td className="py-3 pr-4 text-white/70">{formatARS(p.price_retail)}</td>
              <td className="py-3 pr-4 text-white/70">{formatARS(p.price_wholesale)}</td>
              <td className="py-3 pr-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={drafts[p.id] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                  placeholder="sin definir"
                  className="bg-white/5 border border-white/15 rounded px-3 py-2 text-sm w-36 focus:outline-none focus:border-[rgb(255,0,255)]"
                />
              </td>
              <td className="py-3">
                <button
                  type="button"
                  onClick={() => onSave(p.id)}
                  disabled={savingId === p.id}
                  className="text-xs uppercase tracking-widest border border-white/20 rounded px-3 py-2 text-white/80 hover:text-white hover:border-white/40 transition disabled:opacity-50"
                >
                  {savingId === p.id ? 'Guardando…' : savedId === p.id ? 'Guardado ✓' : 'Guardar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
