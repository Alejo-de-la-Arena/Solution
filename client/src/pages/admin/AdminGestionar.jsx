import { useState } from 'react';
import { motion } from 'motion/react';
import {
  gestionarDiscovery,
  gestionarLinkCatalog,
  gestionarDispatchNow,
} from '../../services/gestionar';

const cardClass = 'border border-white/15 rounded-lg bg-white/[0.02] p-5';
const buttonClass =
  'border border-[rgb(0,255,255)]/50 text-[rgb(0,255,255)] px-4 py-2 text-xs uppercase tracking-widest hover:bg-[rgb(0,255,255)]/10 transition-colors rounded disabled:opacity-40 disabled:cursor-not-allowed';

function Section({ title, children, action }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-heading tracking-widest text-white/80 uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Json({ value }) {
  return (
    <pre className="text-[11px] bg-black/40 border border-white/10 rounded p-3 max-h-72 overflow-auto whitespace-pre-wrap break-all text-white/80">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AdminGestionar() {
  const [discoveryData, setDiscoveryData] = useState(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');

  const [linkData, setLinkData] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');

  const [dispatchData, setDispatchData] = useState(null);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState('');

  async function runDiscovery() {
    setDiscoveryLoading(true);
    setDiscoveryError('');
    try {
      const data = await gestionarDiscovery();
      setDiscoveryData(data);
    } catch (e) {
      setDiscoveryError(e.message || 'Error');
    } finally {
      setDiscoveryLoading(false);
    }
  }

  async function runLink() {
    setLinkLoading(true);
    setLinkError('');
    try {
      const data = await gestionarLinkCatalog();
      setLinkData(data);
    } catch (e) {
      setLinkError(e.message || 'Error');
    } finally {
      setLinkLoading(false);
    }
  }

  async function runDispatch() {
    setDispatchLoading(true);
    setDispatchError('');
    try {
      const data = await gestionarDispatchNow({ limit: 50 });
      setDispatchData(data);
    } catch (e) {
      setDispatchError(e.message || 'Error');
    } finally {
      setDispatchLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-16 h-0.5 bg-[rgb(255,0,255)] mb-6" />
      <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} className="text-3xl sm:text-4xl font-heading tracking-wider mb-4">
        Gestionar
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }} className="text-white/70 mb-8">
        Panel de control de la integración con Gestionar Logística (CABA / GBA).
      </motion.p>

      <div className="space-y-5">
        <Section
          title="Discovery"
          action={
            <button type="button" onClick={runDiscovery} disabled={discoveryLoading} className={buttonClass}>
              {discoveryLoading ? 'Cargando…' : 'Ver estado'}
            </button>
          }
        >
          <p className="text-xs text-white/50 mb-3">
            Lee categorías, productos, depósitos y horas de colecta directo de Gestionar.
          </p>
          {discoveryError && <p className="text-sm text-red-300 mb-2">{discoveryError}</p>}
          {discoveryData && (
            <div className="space-y-3 text-xs">
              <p className="text-white/70">
                <span className="text-white/40">Categorías:</span> {discoveryData.categories?.length || 0}
                <span className="text-white/40 ml-4">Productos:</span> {discoveryData.products?.length || 0}
                <span className="text-white/40 ml-4">Depósitos:</span> {discoveryData.warehouses?.length || 0}
                <span className="text-white/40 ml-4">Horas pickup:</span> {discoveryData.pickupTimes?.length || 0}
              </p>
              <details>
                <summary className="cursor-pointer text-white/60 hover:text-white/80">Ver respuesta cruda</summary>
                <div className="mt-2"><Json value={discoveryData} /></div>
              </details>
            </div>
          )}
        </Section>

        <Section
          title="Mapear catálogo"
          action={
            <button type="button" onClick={runLink} disabled={linkLoading} className={buttonClass}>
              {linkLoading ? 'Mapeando…' : 'Sincronizar SKUs'}
            </button>
          }
        >
          <p className="text-xs text-white/50 mb-3">
            Asocia los SKUs de Solution con el ID interno de cada producto en Gestionar.
            No crea productos nuevos. Correr al deployar y cuando se sume un producto.
          </p>
          {linkError && <p className="text-sm text-red-300 mb-2">{linkError}</p>}
          {linkData && (
            <div className="space-y-2 text-xs">
              <p className="text-emerald-300">
                Mapeados: {linkData.matched?.length || 0}
                {linkData.unmatched?.length > 0 && (
                  <span className="text-red-300 ml-4">Sin match: {linkData.unmatched.length}</span>
                )}
              </p>
              {linkData.unmatched?.length > 0 && (
                <div>
                  <p className="text-white/70 mb-1">SKUs sin match en Gestionar:</p>
                  <ul className="text-white/60 list-disc list-inside">
                    {linkData.unmatched.map((u) => (
                      <li key={u.id}>{u.slug} ({u.sku})</li>
                    ))}
                  </ul>
                </div>
              )}
              <details>
                <summary className="cursor-pointer text-white/60 hover:text-white/80">Ver detalle</summary>
                <div className="mt-2"><Json value={linkData} /></div>
              </details>
            </div>
          )}
        </Section>

        <Section
          title="Dispatch ahora"
          action={
            <button type="button" onClick={runDispatch} disabled={dispatchLoading} className={buttonClass}>
              {dispatchLoading ? 'Despachando…' : 'Forzar dispatch'}
            </button>
          }
        >
          <p className="text-xs text-white/50 mb-3">
            Toma las órdenes paid pendientes de push y las sube a Gestionar (Excel
            fullfilment). El cron in-process corre cada 15 min si está habilitado;
            esto sirve para reintentar manualmente o forzar el envío.
          </p>
          {dispatchError && <p className="text-sm text-red-300 mb-2">{dispatchError}</p>}
          {dispatchData && (
            <div className="space-y-2 text-xs">
              <p className="text-white/70">
                Tomadas: <span className="text-white">{dispatchData.picked}</span>
                <span className="text-emerald-300 ml-4">OK: {dispatchData.succeeded}</span>
                <span className="text-red-300 ml-4">Fallidas: {dispatchData.failed}</span>
              </p>
              {dispatchData.errors?.length > 0 && (
                <div>
                  <p className="text-white/70 mb-1">Errores:</p>
                  <ul className="text-red-300 list-disc list-inside">
                    {dispatchData.errors.map((e, i) => (
                      <li key={i}>
                        {e.stage ? `[${e.stage}] ` : ''}
                        {e.orderId ? `${e.orderId.slice(0, 8)} — ` : ''}
                        {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <details>
                <summary className="cursor-pointer text-white/60 hover:text-white/80">Ver respuesta cruda</summary>
                <div className="mt-2"><Json value={dispatchData} /></div>
              </details>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
