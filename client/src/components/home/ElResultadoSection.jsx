import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function ElResultadoSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="py-20 px-4 bg-black text-white">
      <div className="mx-auto max-w-4xl text-center space-y-12">
        <div>
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0 }}
            className="w-20 h-1 mb-8 mx-auto"
            style={{ backgroundColor: 'rgb(255, 215, 0)' }}
          />
          <motion.h3
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.05 }}
            className="text-3xl sm:text-5xl lg:text-6xl tracking-wider leading-tight mb-8 font-heading"
          >
            El resultado:
            <br />
            identidad propia
          </motion.h3>
        </div>

        <div className="space-y-6 text-base sm:text-lg opacity-80 leading-relaxed max-w-2xl mx-auto">
          <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.1 }}>
            Hoy, SOLUTION presenta cinco fragancias completamente originales. No son copias. Son creaciones diseñadas desde cero, pensadas para el estilo de vida real de nuestros clientes.
          </motion.p>
          <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.15 }} className="opacity-70">
            Cada perfume tiene su personalidad: frescura para el día, elegancia para la noche, intensidad para momentos especiales.
          </motion.p>
          <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.2 }} className="text-sm opacity-60 italic pt-4">
            Una colección curada que nace de la experiencia, el conocimiento del mercado y el compromiso con la excelencia.
          </motion.p>
        </div>

        <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.25 }} className="relative pt-8">
          <img
            src="https://images.unsplash.com/photo-1761392676464-2d518ffa243d?w=1080&q=80"
            alt="Design Excellence"
            className="w-full h-[550px] object-cover opacity-40 mx-auto max-w-3xl"
            style={{
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 95%)',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: 'rgb(255, 215, 0)' }}
          />
        </motion.div>

        <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.3 }} className="pt-6">
          <a
            href="#tienda"
            className="inline-flex items-center gap-3 border border-white/30 px-8 py-3 text-sm tracking-widest text-white hover:border-white hover:bg-white/5 transition-all"
          >
            EXPLORAR COLECCIÓN
            <span className="inline-block w-4 h-4" aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
