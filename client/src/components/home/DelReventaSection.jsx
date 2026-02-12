import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function DelReventaSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="py-20 px-4 bg-black text-white">
      <div className="mx-auto max-w-7xl">
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
              Del reventa a la creación
            </motion.h2>
          </div>
          <div className="space-y-6 opacity-80 text-lg leading-relaxed max-w-2xl mx-auto">
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.1 }}>
              SOLUTION comenzó como muchos: revendiendo fragancias importadas. Nos fue bien. Construimos presencia, aprendimos el mercado, entendimos lo que funcionaba.
            </motion.p>
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.15 }} className="opacity-70">
              Pero siempre supimos que algo faltaba.
            </motion.p>
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.2 }}>
              No estábamos creando nada. Solo distribuíamos. Y esa inquietud nos llevó a tomar una decisión: si íbamos a seguir en este mercado, teníamos que hacerlo de verdad.
            </motion.p>
            <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.25 }} className="opacity-60 text-base italic pt-4">
              Sin depender de terceros. Con identidad propia. Con producto propio.
            </motion.p>
          </div>

          <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.3 }} className="relative pt-8">
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
