import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function ElProcesoSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="relative py-20 px-4 border-t border-white/10 bg-black text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute w-[45vw] max-w-sm h-[35vh] rounded-full blur-[90px] opacity-[0.06] mix-blend-screen" style={{ background: 'rgb(0, 255, 255)', top: '30%', right: '-15%' }} />
      </div>
      <div className="relative mx-auto max-w-4xl">
        <div className="text-center space-y-16">
          <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0 }} className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              <img
                src="https://images.unsplash.com/photo-1760960067586-3999b9aae844?w=1080&q=80"
                alt="Development Process"
                className="w-full h-[350px] object-cover opacity-50"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                }}
              />
            </div>
          </motion.div>

          <div className="space-y-8 max-w-2xl mx-auto">
            <motion.div
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.1 }}
              className="w-20 h-1 mx-auto"
              style={{ backgroundColor: 'rgb(255, 0, 255)' }}
            />
            <motion.h3
              {...motionProps}
              transition={{ ...motionProps.transition, delay: 0.15 }}
              className="text-3xl sm:text-5xl tracking-wider font-heading"
            >
              Aprender para crear
            </motion.h3>
            <div className="space-y-6 text-lg opacity-80 leading-relaxed">
              <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.2 }}>
                Entendimos qué busca realmente el mercado: identidad, calidad y una fragancia que se sienta propia.
              </motion.p>
              <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.25 }}>
                Sumamos perfumistas especializados al proceso y desarrollamos fórmulas con criterio y dirección clara.
              </motion.p>
              <motion.div
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.3 }}
                className="pt-4"
              >
                <div className="inline-flex flex-col items-center gap-3">
                  <motion.p
                    className="text-base sm:text-xl tracking-[0.12em] text-white/88"
                    style={{ textShadow: '0 0 22px rgba(255, 0, 255, 0.08)' }}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.55, delay: 0.34 }}
                  >
                    Todo ese aprendizaje se ve reflejado en esta colección
                  </motion.p>
                  <motion.div
                    className="h-px w-36"
                    style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgb(255, 0, 255), rgba(255,255,255,0.05))' }}
                    initial={{ scaleX: 0, opacity: 0 }}
                    whileInView={{ scaleX: 1, opacity: 1 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: 0.65, delay: 0.4 }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
