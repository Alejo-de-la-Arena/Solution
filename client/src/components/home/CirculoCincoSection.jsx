import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

const COLORS = {
  deepBlue: 'rgb(0, 150, 255)',
  redDesire: 'rgb(255, 72, 72)',
  yellowBloom: 'rgb(255, 196, 64)',
  whiteIce: 'rgb(225, 240, 255)',
  blackCode: 'rgb(70, 76, 88)',
};

export default function CirculoCincoSection() {
  const { ref, motionProps, reducedMotion } = useScrollMotion();

  return (
    <section
      ref={ref}
      className="relative bg-black py-20 sm:py-32 border-t border-white/10 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-6xl h-[90vw] max-h-[760px] blur-[130px] opacity-30"
          style={{
            background: `
              radial-gradient(circle at 50% 50%, rgba(0,150,255,0.18) 0%, transparent 44%),
              radial-gradient(circle at 30% 32%, rgba(255,72,72,0.10) 0%, transparent 22%),
              radial-gradient(circle at 70% 32%, rgba(255,196,64,0.10) 0%, transparent 22%),
              radial-gradient(circle at 32% 70%, rgba(225,240,255,0.08) 0%, transparent 20%),
              radial-gradient(circle at 68% 70%, rgba(70,76,88,0.14) 0%, transparent 22%)
            `,
          }}
          animate={
            reducedMotion
              ? { opacity: 0.24 }
              : {
                  opacity: [0.2, 0.3, 0.24],
                  scale: [0.99, 1.03, 1],
                }
          }
          transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>

      <div className=" relative mx-auto container min-h-[720px] sm:min-h-[860px] flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-full">
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.02 }}
            className="relative w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] lg:w-[620px] lg:h-[620px] flex items-center justify-center"
            whileHover={reducedMotion ? undefined : { scale: 1.015 }}
          >
            {/* glow multicolor interior más simétrico */}
            <motion.div
              className="absolute inset-[12%] rounded-full blur-3xl"
              style={{
                background: `
                  radial-gradient(circle at 50% 50%, rgba(0,150,255,0.18) 0%, rgba(0,150,255,0.10) 28%, transparent 56%),
                  radial-gradient(circle at 34% 34%, rgba(255,72,72,0.14) 0%, transparent 20%),
                  radial-gradient(circle at 66% 34%, rgba(255,196,64,0.14) 0%, transparent 20%),
                  radial-gradient(circle at 34% 66%, rgba(225,240,255,0.09) 0%, transparent 18%),
                  radial-gradient(circle at 66% 66%, rgba(70,76,88,0.14) 0%, transparent 20%)
                `,
                opacity: 0.82,
              }}
              animate={
                reducedMotion
                  ? { opacity: 0.72 }
                  : {
                      opacity: [0.68, 0.88, 0.74],
                      scale: [0.99, 1.025, 1],
                    }
              }
              transition={{ duration: 14, ease: 'easeInOut', repeat: Infinity }}
            />

            {/* borde exterior multicolor */}
            <motion.div
              className="absolute inset-[4%] rounded-full"
              style={{
                background: `
                  conic-gradient(
                    from 180deg,
                    ${COLORS.whiteIce} 0deg,
                    ${COLORS.redDesire} 72deg,
                    ${COLORS.yellowBloom} 144deg,
                    ${COLORS.deepBlue} 216deg,
                    ${COLORS.blackCode} 288deg,
                    ${COLORS.whiteIce} 360deg
                  )
                `,
                padding: '1.5px',
                boxShadow:
                  '0 0 90px rgba(0,150,255,0.14), 0 0 40px rgba(255,72,72,0.08), 0 0 40px rgba(255,196,64,0.07)',
              }}
              animate={
                reducedMotion
                  ? { opacity: 0.82 }
                  : {
                      opacity: [0.7, 0.96, 0.8],
                      boxShadow: [
                        '0 0 70px rgba(0,150,255,0.12), 0 0 28px rgba(255,72,72,0.06), 0 0 28px rgba(255,196,64,0.05)',
                        '0 0 120px rgba(0,150,255,0.2), 0 0 42px rgba(255,72,72,0.10), 0 0 42px rgba(255,196,64,0.09)',
                        '0 0 84px rgba(0,150,255,0.14), 0 0 32px rgba(255,72,72,0.07), 0 0 32px rgba(255,196,64,0.06)',
                      ],
                    }
              }
              transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
            >
              <div className="h-full w-full rounded-full bg-black/80" />
            </motion.div>

            {/* anillo interior */}
            <motion.div
              className="absolute inset-[18%] rounded-full border border-white/18"
              animate={
                reducedMotion
                  ? { opacity: 0.34 }
                  : { opacity: [0.24, 0.42, 0.3] }
              }
              transition={{ duration: 16, ease: 'easeInOut', repeat: Infinity }}
            />

            {/* capa cromática giratoria sutil y simétrica */}
            <motion.div
              className="absolute inset-[8%] rounded-full pointer-events-none"
              style={{
                background: `
                  conic-gradient(
                    from 0deg,
                    rgba(255,72,72,0.12) 0deg,
                    rgba(255,196,64,0.12) 72deg,
                    rgba(225,240,255,0.08) 144deg,
                    rgba(70,76,88,0.12) 216deg,
                    rgba(0,150,255,0.16) 288deg,
                    rgba(255,72,72,0.12) 360deg
                  )
                `,
                mixBlendMode: 'screen',
                maskImage:
                  'radial-gradient(circle at center, transparent 0%, black 40%, black 66%, transparent 82%)',
                WebkitMaskImage:
                  'radial-gradient(circle at center, transparent 0%, black 40%, black 66%, transparent 82%)',
                opacity: 0.48,
              }}
              animate={reducedMotion ? { opacity: 0.3 } : { rotate: [0, 360] }}
              transition={{ duration: 34, ease: 'linear', repeat: Infinity }}
            />

            {/* haz suave */}
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 320deg, transparent 0deg, rgba(255,255,255,0.13) 18deg, transparent 42deg, transparent 360deg)',
                maskImage: 'radial-gradient(circle at center, black 30%, transparent 74%)',
                WebkitMaskImage:
                  'radial-gradient(circle at center, black 30%, transparent 74%)',
              }}
              animate={reducedMotion ? { opacity: 0.16 } : { rotate: [0, 360] }}
              transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
            />

            <div className="pointer-events-none absolute inset-0">
              {/* título superior */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[-18%] sm:top-[-16%] text-center">
                <div className="relative inline-flex flex-col items-center">
                  <p className="text-[1.05rem] sm:text-[1.3rem] lg:text-[1.55rem] tracking-[0.22em] font-medium whitespace-nowrap text-white">
                    CINCO FRAGANCIAS
                  </p>

                  <div className="mt-3 h-[2px] w-[78%] rounded-full bg-[#2a2a2a]" />
                </div>
              </div>

              {/* derecha */}
              <div className="absolute top-1/2 right-[2%] sm:right-[4%] lg:right-[8%] -translate-y-1/2 text-center">
                <p className="text-[0.78rem] sm:text-[0.95rem] lg:text-[1.05rem] leading-[1.45] tracking-[0.18em] sm:tracking-[0.22em] opacity-72 whitespace-nowrap text-white">
                  CINCO
                  <br />
                  PERSONALIDADES
                </p>
              </div>

              {/* abajo */}
              <div className="absolute bottom-[2%] sm:bottom-[8%] left-1/2 -translate-x-1/2 text-center">
                <p className="text-[0.82rem] sm:text-[0.98rem] lg:text-[1.08rem] tracking-[0.18em] sm:tracking-[0.22em] opacity-72 whitespace-nowrap text-white">
                  CINCO AROMAS
                </p>
              </div>

              {/* izquierda */}
              <div className="absolute top-1/2 left-[2%] sm:left-[4%] lg:left-[8%] -translate-y-1/2 text-center">
                <p className="text-[0.78rem] sm:text-[0.95rem] lg:text-[1.05rem] leading-[1.45] tracking-[0.18em] sm:tracking-[0.22em] opacity-72 whitespace-nowrap text-white">
                  CINCO
                  <br />
                  SITUACIONES
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0 }}
          className="mt-14 sm:mt-16"
        >
          <a
            href="#tienda"
            className="btn-home-cta inline-flex items-center justify-center gap-3 rounded border px-8 py-4 text-sm tracking-widest text-white transition-all duration-300 hover:bg-[rgb(0,150,255)] hover:text-black hover:shadow-[0_0_28px_-4px_rgba(0,150,255,0.4)]"
            style={{ borderColor: COLORS.deepBlue }}
          >
            EXPLORAR LA COLECCIÓN
            <span className="inline-block w-4 h-4 ml-1" aria-hidden>
              →
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}