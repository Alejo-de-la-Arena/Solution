import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

const accentCyan = 'rgb(0, 255, 255)';
const accentMagenta= 'rgb(255, 0, 255)';

export default function DelReventaSection() {
  const { ref, motionProps, reducedMotion, premiumEasing } = useScrollMotion();

  return (
    <section
      ref={ref}
      className="relative py-20 px-4 bg-black text-white overflow-hidden border-t border-white/5"
    >
      {/* atmósfera de fondo */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute -left-40 top-[-10%] w-[60vw] h-[60vh] rounded-full blur-[110px] mix-blend-screen"
          style={{ background: accentCyan, opacity: 0.12 }}
          animate={
            reducedMotion
              ? { opacity: 0.11 }
              : {
                opacity: [0.08, 0.14, 0.1],
                scale: [0.9, 1.05, 0.96],
              }
          }
          transition={{
            duration: 18,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute right-[-20%] bottom-[-20%] w-[55vw] h-[55vh] rounded-full blur-[120px] mix-blend-screen"
          style={{ background: accentMagenta, opacity: 0.11 }}
          animate={
            reducedMotion
              ? { opacity: 0.1 }
              : {
                opacity: [0.08, 0.14, 0.1],
                scale: [0.92, 1.06, 0.98],
              }
          }
          transition={{
            duration: 22,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        />
      </div>

      <div className="container mx-auto relative px-4 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_minmax(460px,0.9fr)] gap-16 lg:gap-20 items-stretch">
          {/* Bloque storytelling */}
          <div className="space-y-10 flex flex-col h-full">
            <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.02 }} className="space-y-6 flex flex-col h-full">
              <motion.div
                className="w-20 h-1 mb-2"
                style={{ backgroundColor: 'rgba(0,255,255,0.7)' }}
                transition={{ ...motionProps.transition, delay: 0 }}
              />

              <motion.h2
                transition={{ ...motionProps.transition, delay: 0.05 }}
                className="text-3xl sm:text-4xl lg:text-5xl tracking-wider leading-tight font-heading"
              >
                Los primeros pasos
              </motion.h2>

              <motion.div
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.08 }}
                className="relative rounded-3xl border border-white/10 bg-white/[0.02] px-6 sm:px-8 py-7 sm:py-9 backdrop-blur-md overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.02]" />
                <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-cyan-400/5 blur-3xl" />
                <div className="relative space-y-4 opacity-80 text-base sm:text-lg leading-relaxed max-w-2xl">
                  <p>Solution comenzó acercando al mercado las fragancias más reconocidas del rubro.</p>
                  <p>Y la verdad que nos fue bien. Construimos presencia, aprendimos del mercado y entendimos lo que funcionaba.</p>
                  <p className="opacity-70">Pero siempre supimos que algo faltaba.</p>
                  <p>No estábamos creando nada, solo distribuimos. Y esa inquietud nos llevó a tomar una decisión:</p>
                  <p className="opacity-70">Si íbamos a seguir en este mercado, teníamos que hacerlo de verdad.</p>
                </div>
              </motion.div>

              <motion.div
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.16 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6"
              >
                {['Sin depender de terceros.', 'Con identidad propia.', 'Con producto propio.'].map((txt, idx) => (
                  <motion.div
                    key={txt}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.55, delay: 0.12 + idx * 0.06, ease: premiumEasing }}
                    className="relative rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5 sm:px-5 sm:py-6 overflow-hidden min-h-[128px] flex items-center"
                  >
                    <div className="absolute inset-0 opacity-60">
                      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </div>
                    <div className="relative">
                      <p className="text-md tracking-[0.14em] uppercase text-white/90">{txt}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Bloque visual editorial */}
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.12 }}
            className="relative h-full"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none h-full">
              <div className="relative rounded-[32px] border border-white/10 bg-[#050505] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] h-full min-h-[640px]">
                <div className="relative h-full min-h-[640px]">
                  <img
                    src="https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products/Solution_edit/large/dsc03188.webp"
                    alt="Origin Story"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10)_0%,rgba(0,0,0,0.08)_55%,rgba(0,0,0,0.16)_100%)]" />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04)_0%,rgba(0,0,0,0.14)_100%)]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}