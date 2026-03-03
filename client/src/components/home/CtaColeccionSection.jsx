import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function CtaColeccionSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="py-32 px-4 bg-black text-white">
      <div className="mx-auto max-w-4xl relative">
        <div className="absolute -left-20 top-0 w-px h-32 opacity-20" style={{ backgroundColor: 'rgb(255, 0, 255)' }} />
        <div className="absolute -right-20 bottom-0 w-px h-32 opacity-20" style={{ backgroundColor: 'rgb(0, 255, 127)' }} />

        <div className="text-center space-y-8">
          <motion.p
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0 }}
            className="text-lg sm:text-xl opacity-50 tracking-wide"
          >
            ¿Querés conocer el resultado?
          </motion.p>
          <motion.a
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.05 }}
            href="#tienda"
            className="btn-home-cta inline-flex items-center gap-3 rounded border border-white/30 px-5 py-2.5 text-sm tracking-widest text-white group"
          >
            <span className="pb-0.5">VER LA COLECCIÓN</span>
            <span className="w-4 h-4 inline-block group-hover:translate-x-2 transition-transform" aria-hidden>→</span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
