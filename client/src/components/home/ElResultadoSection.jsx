import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function ElResultadoSection() {
  const { ref, motionProps, reducedMotion, premiumEasing } = useScrollMotion();

  return (
    <section ref={ref} className="relative py-20 sm:py-32 bg-black text-white overflow-hidden border-t border-white/10">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute inset-y-[-10%] left-1/2 w-[75vw] max-w-4xl -translate-x-1/2 blur-[90px]"
          style={{
            background:
              'radial-gradient(circle at 20% 0%, rgba(0,255,255,0.16) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(255,215,0,0.18) 0%, transparent 55%)',
          }}
          animate={
            reducedMotion
              ? { opacity: 0.4 }
              : {
                opacity: [0.3, 0.55, 0.4],
                scale: [0.96, 1.04, 0.98],
              }
          }
          transition={{ duration: 24, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto relative px-4 sm:px-8 lg:px-16 space-y-16">
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.02 }}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-10 lg:gap-16 items-start"
        >
          <div className="space-y-6 max-w-xl">
            <motion.div
              className="w-20 h-1"
              style={{ backgroundColor: 'rgb(255, 215, 0)' }}
              transition={{ ...motionProps.transition, delay: 0 }}
            />
            <h3 className="text-3xl sm:text-5xl lg:text-6xl tracking-wider leading-tight font-heading">
              El resultado:
            </h3>
            <p
              className="text-3xl sm:text-4xl lg:text-5xl font-heading tracking-[0.22em] leading-tight"
              style={{ textShadow: '0 0 28px rgba(255, 215, 0, 0.08)' }}
            >
              NEW ERA
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
            {[
              { text: 'Cinco fragancias.', color: 'rgba(255,255,255,0.92)' },
              { text: 'Cinco personalidades.', color: 'rgba(255, 235, 180, 0.92)' },
              { text: 'Cinco colores', color: 'rgba(198, 231, 255, 0.92)' },
              { text: 'Una nueva etapa.', color: 'rgba(255,255,255,0.92)' },
            ].map((item, i) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.55, delay: 0.1 + i * 0.05, ease: premiumEasing }}
                className="rounded-3xl border border-white/10 bg-white/[0.02] px-4 py-4 sm:px-5 sm:py-5 backdrop-blur-md"
              >
                <p
                  className="text-sm sm:text-xl tracking-[0.12em] font-heading leading-snug"
                  style={{ color: item.color }}
                >
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-14 lg:gap-16 items-start">
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.08 }}
            className="relative"
          >
            <div className="relative max-w-xl">
              <div className="relative h-[500px] rounded-[32px] overflow-hidden border border-white/10 bg-[#050505] shadow-[0_32px_110px_rgba(0,0,0,0.88)]">
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle_at_20%_0%, rgba(255,215,0,0.16) 0%, transparent 50%), radial-gradient(circle_at_80%_60%, rgba(255,255,255,0.08) 0%, transparent 55%)',
                  }}
                  animate={
                    reducedMotion
                      ? { opacity: 0.45 }
                      : { opacity: [0.35, 0.6, 0.45], scale: [0.99, 1.03, 1] }
                  }
                  transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
                />

                <img
                  src="https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products/Solution_edit/medium/dsc03574.webp"
                  alt="Design Excellence"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  loading="lazy"
                />

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06)_0%,rgba(0,0,0,0.28)_100%)]" />

                <motion.div
                  className="pointer-events-none absolute top-0 left-[-25%] h-[140%] w-[55%] rotate-12 bg-white/10 blur-2xl"
                  initial={{ opacity: 0 }}
                  animate={reducedMotion ? { opacity: 0 } : { opacity: [0, 0.22, 0], x: ['-10%', '220%'] }}
                  transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.1 }}
            className="space-y-7 max-w-lg"
          >
            <motion.p
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.15 }}
              className="opacity-70 text-sm sm:text-base tracking-[0.18em] uppercase text-white/65"
            >
              &quot;The language of colors&quot;
            </motion.p>

            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Desarrolladas desde nuestra visión, pensadas para el ritmo real de quienes las usan.
            </p>

            <p className="text-sm opacity-60 italic pt-4 leading-relaxed">
              Desde la frescura cotidiana hasta la intensidad que deja huella.
              <br />
              NEW ERA es el inicio de una identidad que llegó para quedarse.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.22, ease: premiumEasing }}
              className="pt-2"
            >
              <a
                href="#tienda"
                className="group inline-flex items-center gap-3 rounded border border-white/30 bg-white/[0.03] px-8 py-3 text-sm tracking-widest text-white backdrop-blur-sm transition-all duration-300 hover:border-[rgb(255,215,0)] hover:bg-white/[0.06] hover:shadow-[0_0_30px_rgba(255,215,0,0.12)]"
              >
                EXPLORAR COLECCIÓN
                <span
                  className="inline-block w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}