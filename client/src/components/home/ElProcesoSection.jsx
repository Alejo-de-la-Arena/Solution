import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function ElProcesoSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="py-20 px-4 border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-4xl">
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
              El proceso: de cero
            </motion.h3>
            <div className="space-y-6 text-lg opacity-80 leading-relaxed">
              <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.2 }}>
                Invertimos en investigación olfativa, trabajamos con perfumistas especializados y desarrollamos fórmulas propias que respondieran a lo que realmente buscaba nuestro público.
              </motion.p>
              <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.25 }} className="text-base opacity-60">
                Calidad, personalidad y durabilidad real.
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
