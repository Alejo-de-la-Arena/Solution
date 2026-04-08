
import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

const TESTIMONIALS = [
  {
    name: 'Andrés Ferrero',
    city: 'Buenos Aires',
    initial: 'A',
    quote:
      'Les compre cuando vendían equivalencias y ahora con los perfumes nuevos, probé el Red Desire y el Black, ambos muy buenos, recomiendo!',
  },
  {
    name: 'Sebastian Carmona',
    city: 'Rosario',
    initial: 'S',
    quote:
      'Si te gustan los perfumes dulces recomiendo el Yellow Bloom, tiene un parecido al Erba pura',
  },
  {
    name: 'Franco Belligoi',
    city: 'Córdoba',
    initial: 'F',
    quote:
      'Compre el White ice y cumple con la descripción, super versátil y fresco para usar durante el dia',
  },
  {
    name: 'Nicolás Méndez',
    city: 'Buenos Aires',
    initial: 'N',
    quote:
      'Buena atención, Buen producto',
  },
  {
    name: 'Ezequiel Zotto',
    city: 'Mendoza',
    initial: 'E',
    quote:
      'Elegí el Deep Blue y cumplió 100%, pero lo que me compro fue el envase, original y practico para llevar durante el día',
  },
  {
    name: 'Patricia Montone',
    city: 'Mar del Plata',
    initial: 'P',
    quote:
      'Compre el combo de 2 para regalarle a mi hijo, están barbaros, recomiendo!',
  },
];

// Duplicate for seamless infinite loop
const ITEMS = [...TESTIMONIALS, ...TESTIMONIALS];

export default function TestimonialsSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section
      ref={ref}
      className="relative py-24 border-t border-white/10 bg-black text-white overflow-hidden"
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-3xl h-48 blur-[90px] opacity-25"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(0,255,255,0.3) 0%, transparent 55%), radial-gradient(ellipse at 80% 50%, rgba(255,0,255,0.2) 0%, transparent 55%)',
          }}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <motion.div
          {...motionProps}
          className="text-center mb-14 space-y-3 px-4"
        >
          <p className="text-xs tracking-[0.4em] opacity-40 uppercase">Testimonios</p>
          <h2 className="text-2xl sm:text-3xl font-heading tracking-wider opacity-70">
            Lo que dicen nuestros clientes
          </h2>
        </motion.div>

        {/* Infinite scroll track */}
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.1 }}
          className="relative"
        >
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />

          {/* Scrolling container */}
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-5 w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                duration: 30,
                ease: 'linear',
                repeat: Infinity,
              }}
            >
              {ITEMS.map((t, index) => (
                <div
                  key={`${t.name}-${index}`}
                  className="w-[320px] sm:w-[340px] lg:w-[380px] shrink-0 py-2 px-1"
                >
                  <TestimonialCard t={t} />
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }) {
  return (
    <div className="relative h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm flex flex-col gap-4">
      {/* Quote mark */}
      <span className="text-5xl leading-none text-white/15 font-serif select-none">"</span>

      {/* Quote text */}
      <p className="text-sm text-white/75 leading-relaxed flex-1">
        {t.quote}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/10">
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs font-semibold text-white/60 shrink-0">
          {t.initial}
        </div>
        <div>
          <p className="text-xs font-medium text-white/80 tracking-wide">{t.name}</p>
          <p className="text-[10px] text-white/40">{t.city}</p>
        </div>
        <div className="ml-auto flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-3 h-3 text-[rgb(0,255,255)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
      </div>
    </div>
  );
}