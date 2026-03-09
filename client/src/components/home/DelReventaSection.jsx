import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function DelReventaSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="relative py-20 px-4 bg-black text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute w-[50vw] max-w-md h-[40vh] rounded-full blur-[100px] opacity-[0.06] mix-blend-screen" style={{ background: 'rgb(255, 0, 255)', top: '10%', left: '-10%' }} />
        <div className="absolute w-[40vw] max-w-sm h-[30vh] rounded-full blur-[80px] opacity-[0.05] mix-blend-screen" style={{ background: 'rgb(0, 255, 255)', bottom: '20%', right: '-5%' }} />
      </div>
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center space-y-12 max-w-4xl mx-auto">
          <div>
            <motion.div
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0 }}
              className="w-20 h-1 mb-8 mx-auto"
              style={{ backgroundColor: 'rgb(0, 255, 255)' }}
            />
            <motion.h2
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.05 }}
              className="text-4xl sm:text-6xl tracking-wider leading-tight mb-8 font-heading"
            >
              Los primeros pasos
            </motion.h2>
          </div>
          <div className="space-y-6 opacity-80 text-lg leading-relaxed max-w-2xl mx-auto">
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.1 }}>
              Solution comenzó acercando al mercado las fragancias más reconocidas del rubro.
            </motion.p>
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.15 }}>
              Y la verdad que nos fue bien. Construimos presencia, aprendimos del mercado y entendimos lo que funcionaba.
            </motion.p>
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.2 }} className="opacity-70">
              Pero siempre supimos que algo faltaba.
            </motion.p>
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.25 }}>
              No estábamos creando nada, solo distribuimos. Y esa inquietud nos llevó a tomar una decisión:
            </motion.p>
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.3 }} className="opacity-70">
              Si íbamos a seguir en este mercado, teníamos que hacerlo de verdad.
            </motion.p>
            <motion.div
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.35 }}
              className="pt-6"
            >
              <div className="inline-flex flex-col items-center gap-3">
                <motion.div
                  className="h-px w-24"
                  style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.08), rgb(0, 255, 255), rgba(255,255,255,0.08))' }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                />
                <div className="space-y-2 text-center">
                  <motion.p
                    className="text-base sm:text-lg tracking-[0.12em] text-white/80"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.45, delay: 0.42 }}
                  >
                    Sin depender de terceros.
                  </motion.p>
                  <motion.p
                    className="text-lg sm:text-[1.35rem] tracking-[0.16em] text-white"
                    style={{ textShadow: '0 0 22px rgba(0, 255, 255, 0.08)' }}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.45, delay: 0.48 }}
                  >
                    Con identidad propia.
                  </motion.p>
                  <motion.p
                    className="text-base sm:text-lg tracking-[0.12em] text-white/80"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.45, delay: 0.54 }}
                  >
                    Con producto propio.
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.4 }} className="relative pt-8">
            <img
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1080&q=80"
              alt="Origin Story"
              className="w-full h-[500px] object-cover opacity-40 mx-auto max-w-3xl"
              style={{
                maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 100%)',
              }}
            />
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 blur-3xl opacity-10 pointer-events-none"
              style={{ backgroundColor: 'rgb(0, 255, 255)' }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
