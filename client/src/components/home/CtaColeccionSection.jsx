import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

const accentCyan = 'rgb(0, 150, 255)';

export default function CtaColeccionSection() {
  const { ref, motionProps, reducedMotion } = useScrollMotion();

  return (
    <section
      ref={ref}
      className="relative py-20 sm:py-32 bg-black text-white overflow-hidden -mt-10"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute left-[-18%] bottom-[-28%] w-[88vw] h-[52vh] rounded-full blur-[130px] mix-blend-screen"
          style={{ background: accentCyan, opacity: 0.12 }}
          animate={
            reducedMotion
              ? { opacity: 0.11 }
              : {
                opacity: [0.09, 0.15, 0.11],
                scale: [0.95, 1.04, 0.98],
                x: ['0%', '2%', '0%'],
                y: ['0%', '-2%', '0%'],
              }
          }
          transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
        />

        <motion.div
          className="absolute inset-y-[-20%] left-[58%] w-[72vw] max-w-6xl -translate-x-1/2 blur-[95px]"
          style={{
            background:
              'radial-gradient(circle at 12% 75%, rgba(0,255,255,0.14) 0%, transparent 52%), radial-gradient(circle at 90% 12%, rgba(255,0,255,0.08) 0%, transparent 55%)',
          }}
          animate={
            reducedMotion
              ? { opacity: 0.24 }
              : {
                opacity: [0.2, 0.32, 0.24],
                y: ['0%', '-2%', '0%'],
              }
          }
          transition={{ duration: 20, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto relative px-4 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.8fr)] items-center gap-12 lg:gap-16">
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.04 }}
            className="order-2 lg:order-1"
          >
            <div className="relative min-h-[500px] sm:min-h-[420px] lg:min-h-[800px] rounded-[34px] overflow-hidden border border-white/10 bg-[#050505] shadow-[0_40px_120px_rgba(0,0,0,0.92)]">
              <motion.div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle_at_20%_0%, rgba(255,255,255,0.10) 0%, transparent 45%), radial-gradient(circle_at_75%_60%, rgba(0,255,255,0.08) 0%, transparent 55%)',
                }}
                animate={
                  reducedMotion
                    ? { opacity: 0.5 }
                    : { opacity: [0.4, 0.62, 0.48], scale: [0.985, 1.015, 0.99] }
                }
                transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity }}
              />

              <img
                src="https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products/Solution_edit/medium/dsc03274.webp"
                alt="Nueva era - colección SOLUTION"
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="lazy"
              />

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.34)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07)_0%,transparent_55%)]" />

              <div className="absolute bottom-6 left-6 right-6">
                <motion.a
                  {...motionProps}
                  transition={{ ...motionProps.transition, delay: 0 }}
                  href="#tienda"
                  className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-full border border-white/35 bg-white/5 px-8 py-4 text-[0.72rem] tracking-widest uppercase text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10"
                >
                  <span
                    className="absolute inset-0 rounded-full origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                    style={{
                      background:
                        'linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.32))',
                      opacity: 0.9,
                    }}
                    aria-hidden="true"
                  />
                  <span className="relative z-10">VER LA COLECCIÓN</span>
                  <span
                    className="relative z-10 inline-block h-4 w-4 transition-transform duration-300 group-hover:translate-x-2"
                    aria-hidden
                  >
                    →
                  </span>
                </motion.a>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.06 }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[0.72rem] tracking-[0.35em] text-white/45 uppercase">
                Nueva era
              </div>

              <div className="max-w-md">
                <h3 className="text-3xl sm:text-4xl lg:text-[3.2rem] leading-[2] tracking-tight text-white text-balance">
                  ¿Querés conocer el resultado?
                </h3>

                <p className="mt-5 text-base sm:text-lg leading-relaxed text-white/55">
                  Descubrí la colección y explorá el universo visual y sensorial que define esta nueva etapa de Solution.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}