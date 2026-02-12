import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductBySlug } from '../services/products';
import { productToPerfume } from '../services/products';

export default function Producto() {
  const { id: slug } = useParams();
  const [perfume, setPerfume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    getProductBySlug(slug)
      .then((row) => {
        if (cancelled) return;
        setPerfume(row ? productToPerfume(row) : null);
        setError(!row);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">Producto no encontrado</p>
          <Link to="/tienda" className="text-[rgb(0,255,255)] hover:underline text-sm tracking-widest">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const accentColor = perfume.accent_color || 'rgb(0, 255, 255)';

  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <Link to="/tienda" className="inline-block text-white/60 hover:text-white text-sm tracking-widest mb-10">
          ← Volver a la tienda
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="aspect-[3/4] overflow-hidden rounded-lg">
            <img
              src={perfume.image}
              alt={perfume.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-4xl font-heading tracking-wider mb-2">{perfume.name}</h1>
            <p className="text-xl text-white/70 mb-6">{perfume.tagline}</p>
            <p className="text-white/80 leading-relaxed mb-8">{perfume.description}</p>

            {perfume.notes?.top?.length > 0 && (
              <div className="mb-6">
                <div className="text-xs tracking-[0.2em] uppercase mb-2" style={{ color: accentColor }}>
                  Notas principales
                </div>
                <p className="text-sm text-white/80">{perfume.notes.top.join(', ')}</p>
              </div>
            )}

            <div className="pt-6 border-t border-white/20">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl tracking-tight">${perfume.price.toLocaleString('es-AR')}</span>
                <span className="text-sm text-white/50">ARS • 100ml</span>
              </div>
              <p className="text-white/50 text-sm mb-6">Eau de Parfum</p>
              <a
                href="/#carrito"
                className="inline-block border px-10 py-3 text-sm tracking-widest transition-all text-white hover:bg-white hover:text-black"
                style={{ borderColor: accentColor }}
              >
                AGREGAR AL CARRITO
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
