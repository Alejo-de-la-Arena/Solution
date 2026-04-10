import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollMotion } from '../hooks/useScrollMotion';
import { getPublicProducts, productToPerfume } from '../services/products';
import { ACCENT_COLORS } from '../data/perfumes';
import { getComboProfile, normalizeComboKey } from '../data/comboProfiles';
import { mediaUrl } from '../lib/mediaUrl';
import { getStoreProductImages } from '../lib/storeProductImages';

import { useCart } from '../contexts/CartContext';

function ChevronDownIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  );
}

function getUsage(intensity) {
  if (intensity >= 8) return 'Noche / Eventos';
  if (intensity >= 6) return 'Día / Noche';
  return 'Diario';
}

function getOcasion(intensity) {
  if (intensity >= 8) return 'Formal / Elegante';
  if (intensity >= 6) return 'Versátil';
  return 'Casual / Sport';
}

export default function Tienda() {
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerfume1, setSelectedPerfume1] = useState(null);
  const [selectedPerfume2, setSelectedPerfume2] = useState(null);
  const [altView, setAltView] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPublicProducts()
      .then((rows) => {
        if (cancelled) return;
        const list = rows.map(productToPerfume).filter(Boolean);
        setPerfumes(list);
        if (list.length > 0 && selectedPerfume1 === null) setSelectedPerfume1(list[0].id);
        if (list.length > 1 && selectedPerfume2 === null) setSelectedPerfume2(list[1].id);
      })
      .catch(() => {
        if (!cancelled) setPerfumes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (perfumes.length > 0 && !selectedPerfume1) setSelectedPerfume1(perfumes[0].id);
    if (perfumes.length > 1 && !selectedPerfume2) setSelectedPerfume2(perfumes[1].id);
  }, [perfumes, selectedPerfume1, selectedPerfume2]);

  // Auto-cambio sincronizado de imagen (sin hover) para todo el listado
  useEffect(() => {
    const id = window.setInterval(() => {
      setAltView((v) => !v);
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  const perfume1 = perfumes.find((p) => p.id === selectedPerfume1);
  const perfume2 = perfumes.find((p) => p.id === selectedPerfume2);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-black text-white">
      <TiendaHero />

      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="space-y-48">
            {perfumes.length === 0 ? (
              <p className="text-center text-white/60 py-12">No hay productos disponibles.</p>
            ) : (
              perfumes.map((perfume, index) => (
                <ProductBlock key={perfume.id} perfume={perfume} index={index} altView={altView} />
              ))
            )}
          </div>
        </div>
      </section>

      <TiendaInfoSection />

      {perfumes.length >= 2 && (
        <TiendaComboSection
          perfumes={perfumes}
          selectedPerfume1={selectedPerfume1}
          setSelectedPerfume1={setSelectedPerfume1}
          selectedPerfume2={selectedPerfume2}
          setSelectedPerfume2={setSelectedPerfume2}
          perfume1={perfume1}
          perfume2={perfume2}
        />
      )}
    </div>
  );
}

function TiendaHero() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <motion.section
      ref={ref}
      {...motionProps}
      className="py-20 sm:py-32 px-4 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl text-center space-y-16">
        <div>
          <h1 className="font-heading text-4xl sm:text-6xl tracking-wider mb-6">Fragancias SOLUTION</h1>
          <p className="text-base sm:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">
            Cinco fragancias diseñadas para diferentes momentos, estilos y personalidades. Todas con la misma calidad premium que nos define.
          </p>
        </div>

        <div className="space-y-8 pt-8">
          <div className="space-y-2">
            <p className="text-xs tracking-[0.4em] opacity-40 uppercase">Colección</p>
            <h2 className="font-heading text-5xl sm:text-6xl lg:text-7xl tracking-wider">NEW ERA</h2>
          </div>
          <div className="flex justify-center pt-6">
            <ChevronDownIcon className="w-6 h-6 text-white opacity-30 animate-bounce" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ProductBlock({ perfume, index, altView }) {
  const { ref, motionProps } = useScrollMotion();
  const accentColor = perfume.accent_color || ACCENT_COLORS[index];

  return (
    <motion.div ref={ref} {...motionProps} className="relative">
      <div className="text-center mb-12">
        <h2 className="font-heading text-5xl sm:text-6xl lg:text-7xl tracking-wider mb-4">{perfume.name}</h2>
        {perfume.tagline ? <p className="text-xl sm:text-2xl opacity-70">{perfume.tagline}</p> : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start max-w-7xl mx-auto">
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1 text-center">
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Momento ideal</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.tipo_de_uso || getUsage(perfume.intensity)}</p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Ocasión clave</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.ocasion || getOcasion(perfume.intensity)}</p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Personalidad</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.personality || `${perfume.intensity}/10`}</p>
          </div>
        </div>

        <div className="lg:col-span-6 order-1 lg:order-2">
          <PerfumeStoreImage perfume={perfume} accentColor={accentColor} altView={altView} />

          <div className="text-center mt-10 space-y-5">
            <div>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-4xl tracking-tight">${perfume.price.toLocaleString('es-AR')}</span>
                <span className="text-sm opacity-60">ARS</span>
              </div>
              <p className="text-xs opacity-50">60ml • Eau de Parfum</p>
            </div>
            <div className="w-24 h-px mx-auto" style={{ backgroundColor: accentColor, opacity: 0.5 }} />
            <Link
              to={`/producto/${perfume.id}`}
              className="inline-block border px-12 py-4 text-sm tracking-widest transition-all duration-300 text-white hover:bg-[var(--accent)] hover:text-black"
              style={{ borderColor: accentColor, ['--accent']: accentColor }}
            >
              VER DETALLES
            </Link>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8 order-3 text-center">
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Familia olfativa</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.family || perfume.feeling}</p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Notas principales</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.notes.top.slice(0, 3).join(', ')}</p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Perfil general</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.profileGeneral || perfume.usage}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PerfumeStoreImage({ perfume, accentColor, altView }) {
  const [defaultError, setDefaultError] = useState(false);
  const [altError, setAltError] = useState(false);

  const productImages = getStoreProductImages(perfume.slug);

  const defaultSrc = productImages?.default ? mediaUrl(productImages.default) : null;
  const altSrc = productImages?.hover ? mediaUrl(productImages.hover) : null;
  const hasAlt = Boolean(altSrc);
  const showAlt = Boolean(altView && hasAlt && !altError);
  const isBlackCode = (perfume.slug || '').trim().toLowerCase() === 'black-code';
  const baseScale = isBlackCode ? 0.985 : 1;
  const activeScale = showAlt ? (isBlackCode ? 1.01 : 1.015) : baseScale;
  const inactiveScale = showAlt ? baseScale : (isBlackCode ? 1.01 : 1.04);

  if (!defaultSrc) {
    return (
      <div className="relative mx-auto w-full max-w-[420px] aspect-[4/5] rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#111_0%,#050505_100%)] flex items-center justify-center">
        <p className="text-white/40 text-sm tracking-wider">Imagen no configurada</p>
      </div>
    );
  }

  return (
    <Link to={`/producto/${perfume.id}`} className="group block">
      <motion.div
        className="relative mx-auto w-full max-w-[420px]"
        initial={false}
        animate={{ y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Glow exterior */}
        <motion.div
          className="absolute inset-0 rounded-[28px] blur-[58px]"
          style={{ backgroundColor: accentColor }}
          animate={{
            opacity: showAlt ? 0.22 : 0.16,
            scale: showAlt ? 1.0 : 0.94,
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Card */}
        <motion.div
          className="relative z-10 aspect-[4/5] overflow-hidden rounded-[28px] border border-white/10 bg-[#080808]"
          animate={{
            borderColor: showAlt ? `${accentColor}55` : 'rgba(255,255,255,0.10)',
            boxShadow: showAlt
              ? `0 22px 70px rgba(0,0,0,0.52), 0 0 24px ${accentColor}14`
              : '0 16px 48px rgba(0,0,0,0.38)',
            scale: 1,
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Glow interno */}
          <motion.div
            className="pointer-events-none absolute inset-x-[18%] bottom-[6%] h-[24%] rounded-full blur-[56px]"
            style={{ backgroundColor: accentColor }}
            animate={{
              opacity: showAlt ? 0.2 : 0.14,
              scale: showAlt ? 1.04 : 1,
            }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Imagen base */}
          {!defaultError && (
            <motion.img
              src={defaultSrc}
              alt={perfume.name}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              animate={{
                opacity: showAlt ? 0 : 1,
                scale: showAlt ? inactiveScale : activeScale,
                filter: showAlt ? 'blur(2px)' : 'blur(0px)',
              }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onError={() => setDefaultError(true)}
            />
          )}

          {/* Imagen alternativa (auto) */}
          {altSrc && !altError && (
            <motion.img
              src={altSrc}
              alt={`${perfume.name} combo`}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              initial={false}
              animate={{
                opacity: showAlt ? 1 : 0,
                scale: showAlt ? activeScale : inactiveScale,
                filter: showAlt ? 'blur(0px)' : 'blur(2px)',
              }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onError={() => setAltError(true)}
            />
          )}

          {/* Overlay premium */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.03)_38%,rgba(0,0,0,0.18)_100%)]"
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Indicio premium de segunda vista */}
          {hasAlt && (
            <div className="pointer-events-none absolute bottom-4 right-4">
              <div className="relative overflow-hidden rounded-[18px] border border-black bg-black/45 backdrop-blur-md shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
                <div className="relative h-14 w-14">
                  <img
                    src={showAlt ? defaultSrc : altSrc}
                    alt=""
                    className="h-full w-full object-cover object-center opacity-90"
                    draggable={false}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.26)_100%)]" />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </Link>
  );
}


function ComboCollectionShowcase() {
  const slides = [
    {
      src: mediaUrl('all-products/large/all-perfumes-vidrio.webp'),
      alt: 'Colección completa Solution en vidrio',
    },
    {
      src: mediaUrl('all-products/large/perfumes.webp'),
      alt: 'Colección completa Solution',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      {/* glow exterior */}
      <motion.div
        className="absolute inset-0 rounded-[30px] blur-[70px]"
        animate={{
          opacity: [0.12, 0.18, 0.12],
          scale: [0.985, 1.02, 0.985],
        }}
        transition={{
          duration: 4.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,255,255,0.12) 0%, rgba(255,0,255,0.08) 46%, rgba(0,0,0,0) 78%)',
        }}
      />

      <div className="relative z-10 overflow-hidden rounded-[30px] border border-white/10 bg-[#050505] shadow-[0_24px_70px_rgba(0,0,0,0.44)]">
        <div className="relative aspect-[4/5] sm:aspect-[5/6] overflow-hidden">
          {slides.map((slide, index) => (
            <motion.div
              key={slide.src}
              className="absolute inset-0"
              initial={false}
              animate={{
                opacity: activeIndex === index ? 1 : 0,
              }}
              transition={{
                duration: 0.75,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* fondo blur */}
              <motion.img
                src={slide.src}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover scale-[1.12] blur-[22px] opacity-28"
                animate={{
                  scale: activeIndex === index ? 1.12 : 1.14,
                }}
                transition={{
                  duration: 1.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                draggable={false}
              />

              <div className="absolute inset-0 bg-black/28" />

              {/* imagen principal completa */}
              <div className="absolute inset-0">
                <motion.img
                  src={slide.src}
                  alt={slide.alt}
                  className="h-full w-full object-contain object-center"
                  animate={{
                    scale: activeIndex === index ? 1.01 : 1.02,
                  }}
                  transition={{
                    duration: 1.1,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  draggable={false}
                />
              </div>
            </motion.div>
          ))}

          {/* overlays premium */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_54%,rgba(0,0,0,0.18)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.04)_38%,rgba(0,0,0,0.22)_100%)]" />

          {/* label */}
          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-md">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-white/80">
              Colección completa
            </p>
          </div>

          {/* mini indicador visual sutil */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
            {slides.map((_, index) => (
              <motion.span
                key={index}
                className="block h-[5px] rounded-full"
                animate={{
                  width: activeIndex === index ? 18 : 6,
                  opacity: activeIndex === index ? 1 : 0.35,
                  backgroundColor: activeIndex === index ? 'rgb(255,255,255)' : 'rgba(255,255,255,0.6)',
                }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            ))}
          </div>

          {/* shine */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-[-22%] w-[18%] rotate-12 bg-white/10 blur-xl"
            animate={{ x: ['620%', '0%', '620%'] }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.4, 1],
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TiendaInfoSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <motion.section ref={ref} {...motionProps} className="py-20 px-4 border-t border-white/10">
      <div className="mx-auto max-w-[1380px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <h3 className="font-heading text-xl tracking-widest mb-4">ENVÍOS A TODO EL PAÍS</h3>
            <p className="text-sm opacity-70 leading-relaxed">Recibí tu fragancia en 2-5 días hábiles. Envío gratis llevando 2 o más perfumes!</p>
          </div>
          <div className="text-center">
            <h3 className="font-heading text-xl tracking-widest mb-4">GARANTÍA DE CALIDAD</h3>
            <p className="text-sm opacity-70 leading-relaxed">Si no estás 100% satisfecho, devolvelo dentro de los 30 días y te reintegramos tu dinero.</p>
          </div>
          <div className="text-center">
            <h3 className="font-heading text-xl tracking-widest mb-4">PAGO SEGURO</h3>
            <p className="text-sm opacity-70 leading-relaxed">Aceptamos todas las tarjetas y Mercado Pago. Tus datos siempre están protegidos.</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function TiendaComboSection({
  perfumes,
  selectedPerfume1,
  setSelectedPerfume1,
  selectedPerfume2,
  setSelectedPerfume2,
  perfume1,
  perfume2,
}) {
  const { ref, motionProps } = useScrollMotion();
  const { addToCart } = useCart();

  const handleAddCombo = () => {
    if (perfume1) addToCart(perfume1);
    if (perfume2) addToCart(perfume2);
  };

  const comboProfile = getComboProfile(selectedPerfume1, selectedPerfume2);
  const comboProfileKey = comboProfile
    ? normalizeComboKey(selectedPerfume1, selectedPerfume2)
    : `${selectedPerfume1 || 'empty'}__${selectedPerfume2 || 'empty'}`;

  return (
    <motion.section ref={ref} {...motionProps} className="py-32 px-4 border-t border-white/10">
      <div className="mx-auto max-w-[1380px]">
        <div className="text-center mb-20 space-y-4">
          <div className="text-sm tracking-[0.3em] uppercase" style={{ color: 'rgb(255, 0, 255)' }}>Oferta especial</div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-[0.16em]">COMBO SOLUTION</h2>
          <p className="text-base sm:text-lg opacity-72">2 perfumes de la colección a elección</p>
          <div className="inline-flex items-center justify-center">
            <div className="border border-white/10 bg-white/[0.03] px-5 py-3 text-[0.72rem] sm:text-xs tracking-[0.22em] uppercase text-white/82 backdrop-blur-sm">
              ENVÍO GRATIS A TODO EL PAÍS + 3 CUOTAS SIN INTERES
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 xl:gap-20 items-center">
          {/* Columna izquierda: imagen + selectores */}
          <div className="lg:col-span-5 space-y-10">
            <div className="max-w-[520px] mx-auto w-full">
              <ComboCollectionShowcase />
            </div>

            <div className="space-y-7 max-w-[620px] mx-auto">
              <div>
                <p className="text-xs tracking-[0.2em] mb-3 opacity-60 uppercase">Selecciona y combina tus dos fragancias</p>
                <p className="text-sm opacity-60 leading-relaxed mb-5">
                  a medida que vayas seleccionando te vamos a mostrar el perfil de la combinación que estás creando
                </p>

                <div className="mb-4">
                  <label className="text-xs tracking-wider opacity-40 mb-2 block">FRAGANCIA 1</label>
                  <div className="grid grid-cols-5 gap-2">
                    {perfumes.map((p, idx) => {
                      const ac = p.accent_color || ACCENT_COLORS[idx];
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPerfume1(p.id)}
                          className={`border py-3 px-2 text-xs tracking-widest transition-all duration-300 ${selectedPerfume1 === p.id ? 'text-black' : 'border-white/20 opacity-50 hover:opacity-100 text-white'
                            }`}
                          style={{
                            backgroundColor: selectedPerfume1 === p.id ? ac : 'transparent',
                            borderColor: selectedPerfume1 === p.id ? ac : undefined,
                          }}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs tracking-wider opacity-40 mb-2 block">FRAGANCIA 2</label>
                  <div className="grid grid-cols-5 gap-2">
                    {perfumes.map((p, idx) => {
                      const ac = p.accent_color || ACCENT_COLORS[idx];
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPerfume2(p.id)}
                          className={`border py-3 px-2 text-xs tracking-widest transition-all duration-300 ${selectedPerfume2 === p.id ? 'text-black' : 'border-white/20 opacity-50 hover:opacity-100 text-white'
                            }`}
                          style={{
                            backgroundColor: selectedPerfume2 === p.id ? ac : 'transparent',
                            borderColor: selectedPerfume2 === p.id ? ac : undefined,
                          }}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha: perfil + precio + CTA */}
          <div className="lg:col-span-7">
            <div className="space-y-10 text-center max-w-[640px] mx-auto">
              <div className="space-y-6">
                {perfume1 && (
                  <div className="border-t border-b py-6" style={{ borderColor: 'rgb(0, 255, 255)' }}>
                    <h3 className="font-heading text-2xl tracking-wider mb-2">{perfume1.name}</h3>
                    {perfume1.tagline ? <p className="text-sm opacity-70 mb-4">{perfume1.tagline}</p> : null}
                    <div className="flex justify-center gap-8 text-sm">
                      <div>
                        <span className="opacity-40 text-xs tracking-wider block mb-1">USO</span>
                        <span>{perfume1.tipo_de_uso || getUsage(perfume1.intensity)}</span>
                      </div>
                      <div>
                        <span className="opacity-40 text-xs tracking-wider block mb-1">INTENSIDAD</span>
                        <span>{perfume1.intensity}/10</span>
                      </div>
                    </div>
                  </div>
                )}

                {perfume2 && (
                  <div className="border-t border-b py-6" style={{ borderColor: 'rgb(255, 0, 255)' }}>
                    <h3 className="font-heading text-2xl tracking-wider mb-2">{perfume2.name}</h3>
                    {perfume2.tagline ? <p className="text-sm opacity-70 mb-4">{perfume2.tagline}</p> : null}
                    <div className="flex justify-center gap-8 text-sm">
                      <div>
                        <span className="opacity-40 text-xs tracking-wider block mb-1">USO</span>
                        <span>{perfume2.tipo_de_uso || getUsage(perfume2.intensity)}</span>
                      </div>
                      <div>
                        <span className="opacity-40 text-xs tracking-wider block mb-1">INTENSIDAD</span>
                        <span>{perfume2.intensity}/10</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-white/10" />

              <motion.div
                key={comboProfileKey}
                initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="max-w-2xl mx-auto"
              >
                {comboProfile ? (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="text-[0.72rem] tracking-[0.28em] uppercase text-white/42">Perfil de la combinación</div>
                      <motion.div
                        className="h-px w-28 mx-auto"
                        style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgb(255, 0, 255), rgba(255,255,255,0.05))' }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-heading text-3xl sm:text-4xl tracking-[0.14em] text-white">
                        {comboProfile.nickname}
                      </h3>
                      <p className="text-base sm:text-lg text-white/74 tracking-[0.08em]">
                        {comboProfile.summary}
                      </p>
                    </div>

                    <div className="space-y-4 max-w-xl mx-auto">
                      {comboProfile.description.map((paragraph, index) => (
                        <p
                          key={`${comboProfileKey}-${index}`}
                          className={`leading-[1.9] ${index === 0 ? 'text-white/82 text-[1rem]' : 'text-white/62 text-sm uppercase tracking-[0.12em]'}`}
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div className="text-[0.72rem] tracking-[0.28em] uppercase text-white/42">Perfil de la combinación</div>
                    <p className="text-2xl sm:text-3xl font-heading tracking-[0.14em] text-white/86">
                      Combiná dos fragancias
                    </p>
                    <p className="text-sm sm:text-base text-white/60 leading-[1.9]">
                      Selecciona dos perfumes distintos para descubrir el subtítulo, la bajada y la descripción completa de la combinación.
                    </p>
                  </div>
                )}
              </motion.div>

              <div className="space-y-4 max-w-lg mx-auto">
                <ul className="space-y-2 text-sm opacity-80">
                  <li className="flex items-center justify-center gap-2">
                    <span style={{ color: 'rgb(255, 0, 255)' }}>•</span>
                    <span>X2 perfumes a elección</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <span style={{ color: 'rgb(255, 0, 255)' }}>•</span>
                    <span>Envío gratis a todo el país</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <span style={{ color: 'rgb(255, 0, 255)' }}>•</span>
                    <span>3 cuotas sin interes</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <div className="flex items-baseline justify-center gap-3 mb-6 flex-wrap">
                  <span className="text-5xl tracking-tight">
                    ${perfume1 && perfume2 ? (perfume1.price + perfume2.price).toLocaleString('es-AR') : '—'}
                  </span>
                  <span className="text-sm opacity-60">ARS</span>
                </div>

                <button
                  type="button"
                  onClick={handleAddCombo}
                  disabled={!perfume1 || !perfume2}
                  className="group relative overflow-hidden border border-[rgb(255,0,255)] text-white px-12 py-4 text-sm tracking-widest transition-all duration-300 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10">AGREGAR COMBO AL CARRITO</span>
                  <div className="absolute inset-0 bg-[rgb(255,0,255)] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}