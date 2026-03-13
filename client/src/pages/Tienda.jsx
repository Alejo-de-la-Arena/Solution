import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useScrollMotion } from '../hooks/useScrollMotion';
import { getPublicProducts, productToPerfume } from '../services/products';
import { ACCENT_COLORS } from '../data/perfumes';
import { getComboProfile, normalizeComboKey } from '../data/comboProfiles';
import { mediaUrl } from '../lib/mediaUrl';
import { getStoreProductImages } from '../lib/storeProductImages';

const testimonials = [
  { name: 'Martín G.', text: 'MIDNIGHT es increíble. Nunca pensé que iba a encontrar esta calidad a este precio en Argentina.', rating: 5 },
  { name: 'Diego R.', text: 'CARBON se convirtió en mi fragancia diaria. Elegante, moderno y dura todo el día.', rating: 5 },
  { name: 'Lucas P.', text: 'Compré ALPHA y la diferencia con otras marcas es notable. 100% recomendable.', rating: 5 },
];

function StarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

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

  const perfume1 = perfumes.find((p) => p.id === selectedPerfume1);
  const perfume2 = perfumes.find((p) => p.id === selectedPerfume2);
  const comboPrice = perfume1 && perfume2 ? Math.round((perfume1.price + perfume2.price) * 0.85) : 0;

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
                <ProductBlock key={perfume.id} perfume={perfume} index={index} testimonials={testimonials} />
              ))
            )}
          </div>
        </div>
      </section>

      <TiendaInfoSection />
      <TiendaFinalTestimonial testimonials={testimonials} />

      {perfumes.length >= 2 && (
        <TiendaComboSection
          perfumes={perfumes}
          selectedPerfume1={selectedPerfume1}
          setSelectedPerfume1={setSelectedPerfume1}
          selectedPerfume2={selectedPerfume2}
          setSelectedPerfume2={setSelectedPerfume2}
          perfume1={perfume1}
          perfume2={perfume2}
          comboPrice={comboPrice}
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
            <h2 className="font-heading text-5xl sm:text-6xl lg:text-7xl tracking-wider">Origin</h2>
          </div>
          <div className="flex justify-center pt-6">
            <ChevronDownIcon className="w-6 h-6 text-white opacity-30 animate-bounce" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function ProductBlock({ perfume, index, testimonials }) {
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
          <PerfumeStoreImage perfume={perfume} accentColor={accentColor} />

          <div className="text-center mt-10 space-y-5">
            <div>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-4xl tracking-tight">${perfume.price.toLocaleString('es-AR')}</span>
                <span className="text-sm opacity-60">ARS</span>
              </div>
              <p className="text-xs opacity-50">100ml • Eau de Parfum</p>
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

      {index === 1 && (
        <div className="mt-24 max-w-xl mx-auto text-center">
          <div className="border-t border-white/10 pt-12">
            <div className="flex gap-1 mb-6 justify-center">
              {[...Array(testimonials[0].rating)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-white" />
              ))}
            </div>
            <p className="text-lg opacity-80 leading-relaxed mb-4">&quot;{testimonials[0].text}&quot;</p>
            <p className="text-sm opacity-60 tracking-wider">— {testimonials[0].name}</p>
          </div>
        </div>
      )}

      {index === 3 && (
        <div className="mt-24 max-w-xl mx-auto text-center">
          <div className="border-t border-white/10 pt-12">
            <div className="flex gap-1 mb-6 justify-center">
              {[...Array(testimonials[1].rating)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-white" />
              ))}
            </div>
            <p className="text-lg opacity-80 leading-relaxed mb-4">&quot;{testimonials[1].text}&quot;</p>
            <p className="text-sm opacity-60 tracking-wider">— {testimonials[1].name}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PerfumeStoreImage({ perfume, accentColor }) {
  const [isHovered, setIsHovered] = useState(false);
  const [defaultError, setDefaultError] = useState(false);
  const [hoverError, setHoverError] = useState(false);

  const productImages = getStoreProductImages(perfume.slug);

  const defaultSrc = productImages?.default ? mediaUrl(productImages.default) : null;
  const hoverSrc = productImages?.hover ? mediaUrl(productImages.hover) : null;

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
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={false}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Glow exterior */}
        <motion.div
          className="absolute inset-0 rounded-[28px] blur-[58px]"
          style={{ backgroundColor: accentColor }}
          animate={{
            opacity: isHovered ? 0.28 : 0.16,
            scale: isHovered ? 1.04 : 0.94,
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Card */}
        <motion.div
          className="relative z-10 aspect-[4/5] overflow-hidden rounded-[28px] border border-white/10 bg-[#080808]"
          animate={{
            borderColor: isHovered ? `${accentColor}55` : 'rgba(255,255,255,0.10)',
            boxShadow: isHovered
              ? `0 22px 70px rgba(0,0,0,0.52), 0 0 24px ${accentColor}18`
              : '0 16px 48px rgba(0,0,0,0.38)',
            scale: isHovered ? 1.008 : 1,
          }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Glow interno */}
          <motion.div
            className="pointer-events-none absolute inset-x-[18%] bottom-[6%] h-[24%] rounded-full blur-[56px]"
            style={{ backgroundColor: accentColor }}
            animate={{
              opacity: isHovered ? 0.26 : 0.14,
              scale: isHovered ? 1.08 : 1,
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
                opacity: isHovered && hoverSrc && !hoverError ? 0 : 1,
                scale: isHovered ? 1.02 : 1,
                filter: isHovered ? 'blur(2px)' : 'blur(0px)',
              }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onError={() => setDefaultError(true)}
            />
          )}

          {/* Imagen hover */}
          {hoverSrc && !hoverError && (
            <motion.img
              src={hoverSrc}
              alt={`${perfume.name} combo`}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="lazy"
              initial={false}
              animate={{
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1.015 : 1.04,
                filter: isHovered ? 'blur(0px)' : 'blur(2px)',
              }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onError={() => setHoverError(true)}
            />
          )}

          {/* Overlay premium */}
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.03)_38%,rgba(0,0,0,0.18)_100%)]"
            animate={{ opacity: isHovered ? 0.82 : 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Shine */}
          <motion.div
            className="pointer-events-none absolute inset-y-0 left-[-24%] w-[18%] rotate-12 bg-white/10 blur-xl"
            animate={{
              x: isHovered ? '420%' : '-10%',
              opacity: isHovered ? 0.16 : 0,
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </motion.div>
      </motion.div>
    </Link>
  );
}

function ComboShowcaseSlider() {
  const slides = [
    {
      src: mediaUrl('all-products/thumb/packaging-all.webp'),
      alt: 'Packaging completo Solution',
    },
    {
      src: mediaUrl('combos/thumb/combo-bc-rd.webp'),
      alt: 'Combo Black Code + Red Desire',
    },
    {
      src: mediaUrl('combos/thumb/combo-yb-dp.webp'),
      alt: 'Combo Yellow Bloom + Deep Blue',
    },
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-[28px] blur-[60px]"
        animate={{
          opacity: [0.12, 0.18, 0.12],
          scale: [0.97, 1.01, 0.97],
        }}
        transition={{
          duration: 4.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(circle at center, rgba(0,255,255,0.14) 0%, rgba(255,0,255,0.08) 45%, rgba(0,0,0,0) 78%)',
        }}
      />

      <div className="relative z-10 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,#0b0b0b_0%,#050505_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.44)]">
        <div className="relative aspect-[16/10] overflow-hidden">
          {slides.map((slide, index) => (
            <motion.img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              className="absolute inset-0 h-full w-full object-cover object-center"
              initial={false}
              animate={{
                opacity: activeIndex === index ? 1 : 0,
                scale: activeIndex === index ? 1 : 1.02,
                filter: activeIndex === index ? 'blur(0px)' : 'blur(3px)',
              }}
              transition={{
                opacity: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 1.05, ease: [0.22, 1, 0.36, 1] },
                filter: { duration: 0.55, ease: 'easeOut' },
              }}
              loading="eager"
              draggable={false}
            />
          ))}

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.02)_42%,rgba(0,0,0,0.18)_100%)]" />

          <motion.div
            className="pointer-events-none absolute inset-y-0 left-[-18%] w-[14%] rotate-12 bg-white/10 blur-xl"
            animate={{ x: ['0%', '650%'] }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 1.1,
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-2 py-4">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir al slide ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className="group p-1"
            >
              <motion.span
                className="block h-[6px] rounded-full"
                animate={{
                  width: activeIndex === index ? 26 : 8,
                  opacity: activeIndex === index ? 1 : 0.3,
                  backgroundColor: activeIndex === index ? 'rgb(255,255,255)' : 'rgba(255,255,255,0.55)',
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TiendaInfoSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <motion.section ref={ref} {...motionProps} className="py-20 px-4 border-t border-white/10">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center">
            <h3 className="font-heading text-xl tracking-widest mb-4">ENVÍOS A TODO EL PAÍS</h3>
            <p className="text-sm opacity-70 leading-relaxed">Recibí tu fragancia en 3-5 días hábiles. Envío gratis en compras superiores a $30.000.</p>
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

function TiendaFinalTestimonial({ testimonials }) {
  const { ref, motionProps } = useScrollMotion();
  const t = testimonials[2];

  return (
    <motion.section ref={ref} {...motionProps} className="py-20 px-4">
      <div className="mx-auto max-w-3xl text-center">
        <div className="flex justify-center gap-1 mb-6">
          {[...Array(t.rating)].map((_, i) => (
            <StarIcon key={i} className="w-5 h-5 text-white" />
          ))}
        </div>
        <p className="text-xl opacity-80 leading-relaxed mb-6">&quot;{t.text}&quot;</p>
        <p className="text-sm opacity-60 tracking-wider">— {t.name}</p>
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
  comboPrice,
}) {
  const { ref, motionProps } = useScrollMotion();
  const comboProfile = getComboProfile(selectedPerfume1, selectedPerfume2);
  const comboProfileKey = comboProfile
    ? normalizeComboKey(selectedPerfume1, selectedPerfume2)
    : `${selectedPerfume1 || 'empty'}__${selectedPerfume2 || 'empty'}`;

  return (
    <motion.section ref={ref} {...motionProps} className="py-32 px-4 border-t border-white/10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <div className="text-sm tracking-[0.3em] uppercase" style={{ color: 'rgb(255, 0, 255)' }}>Oferta especial</div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-[0.16em]">COMBO SOLUTION</h2>
          <p className="text-base sm:text-lg opacity-72">2 perfumes de la colección a elección</p>
          <div className="inline-flex items-center justify-center">
            <div className="border border-white/10 bg-white/[0.03] px-5 py-3 text-[0.72rem] sm:text-xs tracking-[0.22em] uppercase text-white/82 backdrop-blur-sm">
              ENVÍO GRATIS A TODO EL PAÍS + 3 CUOTAS SIN INTERES
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-8">
            <ComboShowcaseSlider />

            <div className="space-y-6 max-w-md mx-auto">
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

          <div className="lg:col-span-6">
            <div className="space-y-8 text-center">
              <div className="space-y-6 max-w-lg mx-auto">
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
                  <span className="text-5xl tracking-tight">${comboPrice.toLocaleString('es-AR')}</span>
                  <span className="text-sm opacity-60">ARS</span>
                  {perfume1 && perfume2 && (
                    <span className="text-sm line-through opacity-40 ml-2">
                      ${(perfume1.price + perfume2.price).toLocaleString('es-AR')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="border border-[rgb(255,0,255)] text-white px-12 py-4 text-sm tracking-widest transition-all duration-300 hover:bg-[rgb(255,0,255)] hover:text-black"
                >
                  AGREGAR COMBO AL CARRITO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}