import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

const TESTIMONIALS = [
  {
    name: 'Martín Gonzalez',
    city: 'Buenos Aires',
    quote:
      'La calidad es excepcional. MIDNIGHT se convirtió en mi fragancia de confianza para cada ocasión importante.',
  },
  {
    name: 'Diego Ramírez',
    city: 'Córdoba',
    quote:
      'Nunca imaginé encontrar esta relación precio-calidad. CARBON es perfecto para el día a día.',
  },
  {
    name: 'Lucas Peralta',
    city: 'Rosario',
    quote: 'SOLUTION cambió mi percepción sobre las fragancias premium.',
  },
];

export default function TestimonialsSection() {
  const { ref, motionProps, reducedMotion, premiumEasing } = useScrollMotion();

  return (
    <section ref={ref} className="relative py-28 px-4 border-t border-white/10 bg-black text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute inset-y-[-20%] left-1/2 -translate-x-1/2 w-[80vw] max-w-5xl blur-[80px]"
          style={{
            background:
              'radial-gradient(circle_at_0%_50%,rgba(0,255,255,0.16)_0%,transparent_55%),radial-gradient(circle_at_100%_50%,rgba(255,0,255,0.16)_0%,transparent_55%)',
          }}
          animate={
            reducedMotion
              ? { opacity: 0.4 }
              : {
                  opacity: [0.3, 0.55, 0.4],
                  scale: [0.96, 1.04, 0.98],
                }
          }
          transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-12">
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.02 }}
          className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6"
        >
          <div className="space-y-4 max-w-xl">
            <div className="text-xs tracking-[0.4em] opacity-30 mb-3">TESTIMONIOS</div>
            <h2 className="text-2xl sm:text-3xl tracking-wider opacity-60 font-heading">
              Lo que dicen nuestros clientes
            </h2>
          </div>
        </motion.div>

        {/* carrusel horizontal premium */}
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.08 }}
          className="relative"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black via-black/80 to-transparent" />

          <div className="no-scrollbar flex gap-5 overflow-x-auto px-1 py-2 snap-x snap-mandatory">
            {TESTIMONIALS.map((t, index) => (
              <motion.article
                key={t.name}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.04, ease: premiumEasing }}
                className="relative w-[260px] sm:w-[320px] lg:w-[360px] snap-center shrink-0"
              >
                <div className="relative h-full rounded-3xl border border-white/12 bg-white/[0.03] px-5 py-6 sm:px-6 sm:py-7 backdrop-blur-lg shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden">
                  <div className="absolute inset-0 opacity-70">
                    <div className="absolute -top-10 right-[-40px] h-32 w-32 rotate-12 bg-white/6 blur-2xl" />
                  </div>
                  <div className="relative flex flex-col h-full gap-5">
                    <p className="text-4xl leading-none text-white/25">“</p>
                    <p className="text-sm sm:text-[0.95rem] text-white/80 leading-relaxed">{t.quote}</p>
                    <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs tracking-[0.18em] uppercase text-white/80">{t.name}</p>
                        <p className="text-[0.7rem] text-white/55">{t.city}</p>
                      </div>
                      <div className="relative h-10 w-10 rounded-full border border-white/15 bg-white/5 overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(255,255,255,0.6)_0%,transparent_55%)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
