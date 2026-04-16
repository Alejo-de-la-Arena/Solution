import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { listAdminProducts } from '../../services/adminProducts';
import { mediaUrl } from '../../lib/mediaUrl';
import AdminProductEditor from '../../components/admin/AdminProductEditor';

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-AR');
}

function findStoreDefaultPath(product) {
  const imgs = product?.product_images || [];
  return imgs.find((i) => i.role === 'store_default')?.storage_path || null;
}

export default function AdminProductos() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await listAdminProducts();
      setProducts(list);
    } catch (e) {
      setError(e.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleProductUpdated = useCallback((updated) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-heading text-3xl tracking-widest mb-1">Productos</h1>
          <p className="text-white/50 text-sm">Editá precios, textos y gestioná imágenes.</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="text-xs tracking-widest uppercase border border-white/20 rounded px-4 py-2 text-white/70 hover:text-white hover:border-white/40 transition"
        >
          Refrescar
        </button>
      </div>

      {loading && (
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="border border-red-400/40 bg-red-400/10 text-red-300 text-sm rounded px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {products.map((product) => {
            const thumbPath = findStoreDefaultPath(product);
            const thumbUrl = thumbPath ? mediaUrl(thumbPath) : null;
            const isExpanded = expandedId === product.id;

            return (
              <div
                key={product.id}
                className="border border-white/10 rounded-lg bg-white/[0.02] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId((prev) => (prev === product.id ? null : product.id))}
                  className="w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-white/[0.03] transition"
                >
                  <div className="w-16 h-16 rounded bg-[#0b0b0b] border border-white/10 overflow-hidden flex-shrink-0">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">—</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="font-heading text-xl tracking-widest">{product.name}</h2>
                      {!product.is_active && (
                        <span className="text-[0.65rem] tracking-widest uppercase border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">{product.slug}</p>
                  </div>

                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <div className="text-sm text-white/80">
                      Retail <span className="text-white">${formatPrice(product.price_retail)}</span>
                    </div>
                    <div className="text-xs text-white/50 mt-1">
                      Mayorista ${formatPrice(product.price_wholesale)}
                    </div>
                  </div>

                  <span className="text-white/40 text-sm ml-2">{isExpanded ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="editor"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden border-t border-white/10"
                    >
                      <div className="p-6">
                        <AdminProductEditor
                          product={product}
                          onProductUpdated={handleProductUpdated}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {products.length === 0 && (
            <p className="text-center text-white/50 py-12">No hay productos.</p>
          )}
        </div>
      )}
    </div>
  );
}
