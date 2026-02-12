import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useScrollMotion } from '../hooks/useScrollMotion';
import { getPublicProducts, productToPerfume } from '../services/products';
import { ACCENT_COLORS } from '../data/perfumes';

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

function useUsage(intensity) {
  if (intensity >= 8) return 'Noche / Eventos';
  if (intensity >= 6) return 'Día / Noche';
  return 'Diario';
}

function useOcasion(intensity) {
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
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (perfumes.length > 0 && !selectedPerfume1) setSelectedPerfume1(perfumes[0].id);
    if (perfumes.length > 1 && !selectedPerfume2) setSelectedPerfume2(perfumes[1].id);
  }, [perfumes]);

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
      {/* Hero */}
      <TiendaHero />

      {/* Products Grid */}
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

      {/* Info Section */}
      <TiendaInfoSection />

      {/* Final Testimonial */}
      <TiendaFinalTestimonial testimonials={testimonials} />

      {/* Combo Section */}
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
        <p className="text-xl sm:text-2xl opacity-70">{perfume.tagline}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start max-w-7xl mx-auto">
        {/* Left */}
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1 text-center">
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Tipo de uso</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.tipo_de_uso || useUsage(perfume.intensity)}</p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Ocasión</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.ocasion || useOcasion(perfume.intensity)}</p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Intensidad</div>
            <div className="flex items-center gap-2 justify-center">
              <div className="w-20 h-1 bg-white/10 overflow-hidden rounded">
                <div className="h-full rounded" style={{ backgroundColor: accentColor, width: `${perfume.intensity * 10}%` }} />
              </div>
              <span className="text-sm opacity-90">{perfume.intensity}/10</span>
            </div>
          </div>
        </div>

        {/* Center */}
        <div className="lg:col-span-6 order-1 lg:order-2">
          <Link to={`/producto/${perfume.id}`} className="group block">
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-0 blur-3xl opacity-20 rounded-full" style={{ backgroundColor: accentColor }} />
              <div className="relative z-10 aspect-[3/4] overflow-hidden">
                <img
                  src={perfume.image}
                  alt={perfume.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{
                    maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
                  }}
                />
              </div>
            </div>
          </Link>
          <div className="text-center mt-12 space-y-6">
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

        {/* Right */}
        <div className="lg:col-span-3 space-y-8 order-3 text-center">
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Perfil olfativo</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.feeling}</p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Notas principales</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.notes.top.slice(0, 3).join(', ')}</p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] mb-3 uppercase" style={{ color: accentColor }}>Momento ideal</div>
            <p className="text-sm opacity-90 leading-relaxed">{perfume.usage.split('.')[0]}</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-12 max-w-2xl mx-auto">
        <p className="opacity-70 leading-relaxed">{perfume.description}</p>
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

function TiendaComboSection({ perfumes, selectedPerfume1, setSelectedPerfume1, selectedPerfume2, setSelectedPerfume2, perfume1, perfume2, comboPrice }) {
  const { ref, motionProps } = useScrollMotion();
  return (
    <motion.section ref={ref} {...motionProps} className="py-32 px-4 border-t border-white/10">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <div className="text-sm tracking-[0.3em] mb-4" style={{ color: 'rgb(255, 0, 255)' }}>OFERTA ESPECIAL</div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-wider mb-4">Combo de 2 fragancias</h2>
          <p className="text-lg opacity-70">Elegí tu combinación ideal y ahorrá un 15%</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-8">
            <div className="max-w-md mx-auto">
              <div className="aspect-square overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80"
                  alt="Combo de perfumes"
                  className="w-full h-full object-cover"
                  style={{
                    maskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 100%)',
                  }}
                />
              </div>
            </div>
            <div className="space-y-6 max-w-md mx-auto">
              <div>
                <p className="text-xs tracking-[0.2em] mb-3 opacity-60">SELECCIONÁ TUS FRAGANCIAS</p>
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
                          className={`border py-3 px-2 text-xs tracking-widest transition-all duration-300 ${
                            selectedPerfume1 === p.id ? 'text-black' : 'border-white/20 opacity-50 hover:opacity-100 text-white'
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
                          className={`border py-3 px-2 text-xs tracking-widest transition-all duration-300 ${
                            selectedPerfume2 === p.id ? 'text-black' : 'border-white/20 opacity-50 hover:opacity-100 text-white'
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
                    <p className="text-sm opacity-70 mb-4">{perfume1.tagline}</p>
                    <div className="flex justify-center gap-8 text-sm">
                      <div>
                        <span className="opacity-40 text-xs tracking-wider block mb-1">USO</span>
                        <span>{useUsage(perfume1.intensity)}</span>
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
                    <p className="text-sm opacity-70 mb-4">{perfume2.tagline}</p>
                    <div className="flex justify-center gap-8 text-sm">
                      <div>
                        <span className="opacity-40 text-xs tracking-wider block mb-1">USO</span>
                        <span>{useUsage(perfume2.intensity)}</span>
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
              <div className="space-y-4 max-w-lg mx-auto">
                <p className="text-sm opacity-70 leading-relaxed">
                  Este combo te permite tener dos fragancias complementarias: una para el día a día y otra para ocasiones especiales. Versátil, completo y con ahorro garantizado.
                </p>
                <ul className="space-y-2 text-sm opacity-80">
                  <li className="flex items-center justify-center gap-2">
                    <span style={{ color: 'rgb(255, 0, 255)' }}>•</span>
                    <span>2 × 100ml Eau de Parfum</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <span style={{ color: 'rgb(255, 0, 255)' }}>•</span>
                    <span>15% de descuento incluido</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <span style={{ color: 'rgb(255, 0, 255)' }}>•</span>
                    <span>Envío gratis sin mínimo de compra</span>
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
