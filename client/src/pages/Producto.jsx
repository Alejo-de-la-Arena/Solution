import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getProductBySlug, productToPerfume } from '../services/products';
import { useCart } from '../contexts/CartContext';

export default function Producto() {
  const { id: slug } = useParams();
  const [perfume, setPerfume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { addToCart } = useCart();

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
        <div className="w-12 h-12 border border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !perfume) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-heading tracking-widest">Producto no encontrado</h2>
          <Link to="/tienda" className="inline-block border-b border-white/30 pb-1 hover:border-white transition-colors text-sm tracking-widest">
            VOLVER A LA TIENDA
          </Link>
        </div>
      </div>
    );
  }

  const accentColor = perfume.accent_color || 'rgb(0, 255, 255)';

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Ambient Background */}
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] pointer-events-none mix-blend-screen"
        style={{ backgroundColor: accentColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[100px] pointer-events-none mix-blend-screen"
        style={{ backgroundColor: accentColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div className="relative z-10 px-4 py-12 sm:py-24 max-w-7xl mx-auto">
        <nav className="mb-12 sm:mb-20">
          <Link
            to="/tienda"
            className="group inline-flex items-center gap-3 text-sm tracking-widest text-white/40 hover:text-white transition-colors duration-300"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-300">←</span>
            VOLVER A LA TIENDA
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Image Column */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="aspect-[3/4] overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              <motion.img
                src={perfume.image}
                alt={perfume.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              />
            </div>
            {/* Decorative elements around image */}
            <div className="absolute -inset-4 border border-white/5 z-[-1] translate-x-4 translate-y-4 hidden sm:block" />
          </motion.div>

          {/* Content Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center h-full"
          >
            <div className="space-y-8">
              <div>
                <motion.h1
                  className="text-5xl sm:text-7xl font-heading tracking-wider mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {perfume.name}
                </motion.h1>
                <motion.p
                  className="text-xl sm:text-2xl text-white/60 font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {perfume.tagline}
                </motion.p>
              </div>

              <motion.div
                className="w-20 h-px"
                style={{ backgroundColor: accentColor }}
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />

              <motion.p
                className="text-white/80 leading-relaxed text-lg font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {perfume.description}
              </motion.p>

              {/* Notes */}
              {perfume.notes?.top?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <span className="text-xs tracking-[0.2em] uppercase block mb-4 text-white/40">Notas Olfativas</span>
                  <div className="flex flex-wrap gap-3">
                    {perfume.notes.top.map((note, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 border border-white/10 text-sm text-white/80 tracking-wide bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Price & Action */}
              <motion.div
                className="pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-end gap-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl tracking-tight font-light">${perfume.price.toLocaleString('es-AR')}</span>
                    <span className="text-sm text-white/40 tracking-widest">ARS</span>
                  </div>
                  <p className="text-white/40 text-xs tracking-widest">100ML • EAU DE PARFUM</p>
                </div>

                <button
                  onClick={() => addToCart(perfume)}
                  className="group relative overflow-hidden px-12 py-4 bg-white text-black text-sm tracking-[0.2em] uppercase font-medium transition-all hover:bg-[var(--accent)]"
                  style={{ '--accent': accentColor }}
                >
                  <span className="relative z-10">Agregar al carrito</span>
                  <div
                    className="absolute inset-0 bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
                    style={{ backgroundColor: accentColor }}
                  />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
