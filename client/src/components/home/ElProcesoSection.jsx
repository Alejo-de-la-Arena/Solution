import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

const ACCENT = 'rgb(255, 0, 255)';
const ACCENT_CYAN = 'rgb(0, 255, 255)';
const ACCENT_BLUE = 'rgb(0, 150, 255)';

export default function ElProcesoSection() {
  const { ref, motionProps, reducedMotion, premiumEasing } = useScrollMotion();

  const cards = [
    {
      id: 'c1',
      eyebrow: 'Mercado',
      text: 'Entendimos qué busca realmente el mercado: identidad, calidad y una fragancia que se sienta propia.',
    },
    {
      id: 'c2',
      eyebrow: 'Desarrollo',
      text: 'Sumamos perfumistas especializados al proceso y desarrollamos fórmulas con criterio y dirección clara.',
    },
    {
      id: 'c3',
      eyebrow: 'Resultado',
      text: 'Todo ese aprendizaje se ve reflejado en esta colección.',
    },
  ];

  return (
    <section
      ref={ref}
      id="proceso-solution"
      className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-28 sm:py-32 lg:py-40 text-white"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          className="absolute left-[-12%] top-[8%] h-[36rem] w-[36rem] rounded-full blur-[140px] mix-blend-screen"
          style={{ background: ACCENT_CYAN, opacity: 0.09 }}
          animate={
            reducedMotion
              ? { opacity: 0.08 }
              : {
                opacity: [0.06, 0.11, 0.08],
                scale: [0.96, 1.04, 0.98],
                x: ['0%', '3%', '0%'],
              }
          }
          transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
        />
        <motion.div
          className="absolute right-[-10%] top-[-6%] h-[34rem] w-[34rem] rounded-full blur-[130px] mix-blend-screen"
          style={{ background: ACCENT, opacity: 0.08 }}
          animate={
            reducedMotion
              ? { opacity: 0.08 }
              : {
                opacity: [0.05, 0.11, 0.07],
                scale: [0.98, 1.05, 1],
                y: ['0%', '3%', '0%'],
              }
          }
          transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.015)_0%,rgba(255,255,255,0)_18%,rgba(255,255,255,0)_100%)]" />
      </div>

      <div className="container mx-auto relative px-4 sm:px-8 lg:px-16">
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.02 }}
          className="mb-14 flex flex-col gap-8 lg:mb-16 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
              <span
                className="inline-block h-1.5 w-20 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${ACCENT_CYAN} 0%, ${ACCENT} 100%)`,
                }}
              />
              <span className="text-[0.68rem] uppercase tracking-[0.38em] text-white/40">
                proceso
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="max-w-3xl text-4xl leading-[0.98] tracking-tight sm:text-5xl lg:text-6xl font-heading">
                Aprender para crear
              </h3>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:gap-10 xl:gap-14">
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.06 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] shadow-[0_30px_100px_rgba(0,0,0,0.9)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_35%,rgba(255,255,255,0.00)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,255,0.08)_0%,transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,0,255,0.08)_0%,transparent_35%)]" />

              <div className="relative grid min-h-[540px] grid-cols-1 lg:min-h-[620px]">
                <div className="relative h-full min-h-[420px] lg:min-h-[620px]">
                  <img
                    src="https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products/Solution_edit/large/dsc03564.webp"
                    alt="Development Process"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    loading="lazy"
                  />

                  <motion.div
                    className="pointer-events-none absolute -left-[20%] top-[-10%] h-[70%] w-[55%] rotate-[18deg] bg-white/10 blur-3xl"
                    animate={
                      reducedMotion
                        ? { opacity: 0.08 }
                        : {
                          opacity: [0.03, 0.12, 0.05],
                          x: ['0%', '18%', '4%'],
                        }
                    }
                    transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }}
                  />

                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-10">
                    <div className="max-w-xl rounded-[28px] border border-white/10 bg-black/35 p-5 backdrop-blur-xl sm:p-6">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="inline-block h-[1px] w-10 bg-white/30" />
                        <span className="text-[0.65rem] uppercase tracking-[0.36em] text-white/45">
                          construcción de marca
                        </span>
                      </div>

                      <p className="text-base leading-relaxed text-white/84 sm:text-lg">
                        Entender el mercado fue el punto de partida. Crear una identidad propia fue el siguiente paso lógico.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="flex h-full flex-col justify-between gap-5">
            {cards.map((c, idx) => (
              <motion.article
                key={c.id}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.65, delay: 0.05 + idx * 0.08, ease: premiumEasing }}
                whileHover={
                  reducedMotion
                    ? undefined
                    : {
                      y: -6,
                      scale: 1.012,
                    }
                }
                className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl transition-colors duration-300 sm:p-7"
              >
                <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.10)_0%,transparent_38%)]" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${ACCENT}12 0%, transparent 40%, ${ACCENT_CYAN}10 100%)`,
                    }}
                  />
                </div>

                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                <div className="relative flex h-full flex-col gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: idx === 1 ? ACCENT_CYAN : ACCENT }}
                        />
                        <span className="text-[0.65rem] uppercase tracking-[0.34em] text-white/40">
                          {c.eyebrow}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-xs tracking-[0.22em] text-white/45">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <p className="max-w-[38rem] text-base leading-relaxed text-white/82 sm:text-[1.02rem]">
                    {c.text}
                  </p>

  
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}