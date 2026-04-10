import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductBySlug, productToPerfume } from '../services/products';
import { useCart } from '../contexts/CartContext';
import { mediaUrl } from '../lib/mediaUrl';
import { getProductGalleryImages } from '../lib/productGalleryImages';

export default function Producto() {
  const { id: slug } = useParams();
  const [perfume, setPerfume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
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

  // Reset índice de galería cuando cambia el perfume
  useEffect(() => {
    setActiveIndex(0);
  }, [perfume?.slug]);

  // Auto-advance suave de la galería
  useEffect(() => {
    if (!perfume) return undefined;
    const items = getProductGalleryImages(perfume.slug, perfume.image);
    const length = items.length;
    if (length <= 1) return undefined;

    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % length);
    }, 9000);

    return () => window.clearInterval(id);
  }, [perfume?.slug, perfume?.image]);

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
  const descriptionParagraphs = perfume.descriptionParagraphs?.length
    ? perfume.descriptionParagraphs
    : perfume.description
      ? [perfume.description]
      : [];
  const galleryItems = perfume ? getProductGalleryImages(perfume.slug, perfume.image) : [];
  const safeIndex = galleryItems.length > 0 ? Math.min(activeIndex, galleryItems.length - 1) : 0;
  const activeItem = galleryItems[safeIndex] || null;

  const noteGroups = [
    {
      key: 'top',
      label: 'Salida',
      textColor: 'rgb(172, 235, 255)',
      borderColor: 'rgba(145, 220, 255, 0.24)',
      backgroundColor: 'rgba(125, 205, 255, 0.08)',
      glowColor: 'rgba(125, 205, 255, 0.12)',
    },
    {
      key: 'heart',
      label: 'Corazón',
      textColor: 'rgb(233, 196, 255)',
      borderColor: 'rgba(220, 170, 255, 0.24)',
      backgroundColor: 'rgba(205, 120, 255, 0.08)',
      glowColor: 'rgba(205, 120, 255, 0.12)',
    },
    {
      key: 'base',
      label: 'Fondo',
      textColor: 'rgb(237, 214, 167)',
      borderColor: 'rgba(225, 195, 135, 0.24)',
      backgroundColor: 'rgba(210, 175, 105, 0.08)',
      glowColor: 'rgba(210, 175, 105, 0.12)',
    },
  ];

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
            <div className="relative mx-auto w-full max-w-[560px]">
              {/* Glow exterior */}
              <motion.div
                className="absolute inset-0 rounded-[30px] blur-[70px]"
                style={{ backgroundColor: accentColor }}
                animate={{
                  opacity: [0.16, 0.24, 0.16],
                  scale: [0.9, 1.02, 0.9],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Card */}
              <div className="relative z-10 overflow-hidden rounded-[30px] border border-white/10 bg-[#050505] shadow-[0_24px_70px_rgba(0,0,0,0.6)]">
                <div className="relative aspect-[4/5] sm:aspect-[5/6] overflow-hidden">
                  {/* Fondo blur */}
                  <AnimatePresence initial={false} mode="popLayout">
                    {activeItem && (
                      <motion.img
                        key={`bg-${activeItem.path}`}
                        src={activeItem.path.startsWith('http') ? activeItem.path : mediaUrl(activeItem.path)}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover scale-[1.15] blur-[26px] opacity-30"
                        initial={{ opacity: 0, scale: 1.18 }}
                        animate={{ opacity: 0.3, scale: 1.15 }}
                        exit={{ opacity: 0, scale: 1.18 }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                        draggable={false}
                      />
                    )}
                  </AnimatePresence>

                  <div className="absolute inset-0 bg-black/25" />

                  {/* Imagen principal */}
                  <AnimatePresence initial={false} mode="wait">
                    {activeItem && (
                      <motion.img
                        key={activeItem.path}
                        src={activeItem.path.startsWith('http') ? activeItem.path : mediaUrl(activeItem.path)}
                        alt={perfume.name}
                        className="absolute inset-0 h-full w-full object-contain object-center"
                        initial={{ opacity: 0, scale: 1.04, y: 10, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, scale: 1.02, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.98, y: -8, filter: 'blur(6px)' }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        draggable={false}
                      />
                    )}
                  </AnimatePresence>

                  {/* Overlays premium */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,rgba(0,0,0,0.32)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.06)_38%,rgba(0,0,0,0.32)_100%)]" />

                  {/* Badge */}
                  <div className="absolute left-4 top-4 rounded-full border border-white/12 bg-black/40 px-4 py-2 backdrop-blur-md">
                    <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-white/80">
                      Colección Solution
                    </p>
                  </div>

                  {/* Indicador numerado */}
                  {galleryItems.length > 1 && (
                    <div className="absolute right-4 bottom-4 flex items-center gap-2 rounded-full border border-white/14 bg-black/45 px-3 py-1.5 backdrop-blur-md">
                      <span className="h-1 w-8 rounded-full bg-gradient-to-r from-white/60 to-white/10" />
                      <span className="text-[10px] tracking-[0.22em] uppercase text-white/70">
                        {String(activeIndex + 1).padStart(2, '0')}/{String(galleryItems.length).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnails / navegación secundaria */}
            {galleryItems.length > 1 && (
              <div className="mt-7 space-y-3 max-w-[560px] mx-auto">
                <div className="flex items-center justify-between gap-4 px-1">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-white/45">
                    <span className="inline-block h-px w-6 bg-white/20" />
                    <span>Galería</span>
                  </div>
                  <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.22em] text-white/40">
                    Desliza o toca para cambiar
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {galleryItems.map((item, index) => {
                    const isActive = index === activeIndex;
                    const src = item.path.startsWith('http') ? item.path : mediaUrl(item.path);

                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`relative h-16 w-16 sm:h-[4.75rem] sm:w-[4.75rem] flex-shrink-0 overflow-hidden rounded-2xl border transition-all duration-200 ${
                          isActive ? 'border-white/80 shadow-[0_0_24px_rgba(0,0,0,0.9)]' : 'border-white/14 opacity-70 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: '#050505',
                        }}
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover object-center"
                          loading="lazy"
                          draggable={false}
                        />
                        {isActive && (
                          <div className="pointer-events-none absolute inset-0 border border-white/40 mix-blend-screen" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Content Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-center h-full"
          >
            <div className="space-y-10">
              <div>
                <motion.h1
                  className="text-5xl sm:text-7xl font-heading tracking-wider mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {perfume.name}
                </motion.h1>
                {perfume.tagline ? (
                  <motion.p
                    className="text-xl sm:text-2xl text-white/60 font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    {perfume.tagline}
                  </motion.p>
                ) : null}
              </div>

              <motion.div
                className="w-20 h-px"
                style={{ backgroundColor: accentColor }}
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />

              {descriptionParagraphs.length > 0 && (
                <motion.div
                  className="max-w-2xl space-y-4 sm:space-y-5 text-white/80 leading-[1.9] text-[1.02rem] sm:text-[1.08rem] font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                >
                  {descriptionParagraphs.map((paragraph, index) => (
                    <motion.p
                      key={`${perfume.id}-description-${index}`}
                      initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.45, delay: 0.56 + index * 0.04 }}
                      className={index === 0 ? 'text-white text-[1.15rem] sm:text-[1.25rem] font-normal leading-[1.75]' : ''}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </motion.div>
              )}

              {/* Notes */}
              {(perfume.notes?.top?.length > 0 || perfume.notes?.heart?.length > 0 || perfume.notes?.base?.length > 0) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.66 }}
                  className="space-y-7 pt-2"
                >
                  <div className="space-y-3">
                    <span className="text-sm sm:text-[0.95rem] tracking-[0.34em] uppercase block text-white/72">Notas olfativas</span>
                    <motion.div
                      className="h-px w-28"
                      style={{ background: `linear-gradient(to right, ${accentColor}, rgba(255,255,255,0.08))` }}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ duration: 0.55, delay: 0.72 }}
                    />
                  </div>
                  {noteGroups.map((group, groupIndex) => {
                    const items = perfume.notes?.[group.key] || [];
                    if (items.length === 0) return null;

                    return (
                      <motion.div
                        key={group.key}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.76 + groupIndex * 0.06 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className="text-[0.72rem] sm:text-xs tracking-[0.28em] uppercase"
                            style={{ color: group.textColor }}
                          >
                            {group.label}
                          </span>
                          <span
                            className="h-px flex-1"
                            style={{ background: `linear-gradient(to right, ${group.borderColor}, transparent)` }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {items.map((note, i) => (
                            <motion.span
                              key={`${group.key}-${i}`}
                              className="px-4 py-2 border text-sm tracking-[0.08em] backdrop-blur-sm transition-all duration-300"
                              style={{
                                color: group.textColor,
                                borderColor: group.borderColor,
                                backgroundColor: group.backgroundColor,
                                boxShadow: `0 0 30px ${group.glowColor}`,
                              }}
                              whileHover={{ y: -1, borderColor: 'rgba(255,255,255,0.26)', backgroundColor: 'rgba(255,255,255,0.08)' }}
                              transition={{ duration: 0.2 }}
                            >
                              {note}
                            </motion.span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {perfume.profileGeneral ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.86 }}
                  className="relative max-w-2xl pt-7"
                >
                  <span
                    className="block h-px w-28 mb-4"
                    style={{ background: `linear-gradient(to right, ${accentColor}, rgba(255,255,255,0.08))` }}
                  />
                  <span className="text-[0.72rem] sm:text-xs tracking-[0.28em] uppercase block mb-4 text-white/60">Perfil general</span>
                  <p className="max-w-xl text-white/86 leading-[1.9] text-[1rem] sm:text-[1.05rem] font-light">
                    {perfume.profileGeneral}
                  </p>
                </motion.div>
              ) : null}

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
                  <p className="text-white/40 text-xs tracking-widest">60ML • EAU DE PARFUM</p>
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
