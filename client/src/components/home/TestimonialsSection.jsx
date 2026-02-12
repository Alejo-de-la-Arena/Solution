import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function TestimonialsSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="py-20 px-4 border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-7xl">
        <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0 }} className="text-center mb-16">
          <div className="text-xs tracking-[0.4em] opacity-30 mb-3">TESTIMONIOS</div>
          <h2 className="text-2xl sm:text-3xl tracking-wider opacity-60 font-heading">Lo que dicen nuestros clientes</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.1 }}
            className="md:col-span-5 border-l border-white/20 pl-8"
          >
            <p className="opacity-80 leading-relaxed mb-10 text-xl">
              &quot;La calidad es excepcional. MIDNIGHT se convirtió en mi fragancia de confianza para cada ocasión importante.&quot;
            </p>
            <div>
              <p className="tracking-wider mb-1">Martín Gonzalez</p>
              <p className="text-sm opacity-50">Buenos Aires</p>
            </div>
          </motion.div>

          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.15 }}
            className="md:col-span-4 border-l border-white/20 pl-8 md:mt-12"
          >
            <p className="opacity-70 leading-relaxed mb-8 text-base">
              &quot;Nunca imaginé encontrar esta relación precio-calidad. CARBON es perfecto para el día a día.&quot;
            </p>
            <div>
              <p className="tracking-wider mb-1 text-sm">Diego Ramírez</p>
              <p className="text-xs opacity-50">Córdoba</p>
            </div>
          </motion.div>

          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.2 }}
            className="md:col-span-3 border-l border-white/20 pl-8 md:mt-20"
          >
            <p className="opacity-70 leading-relaxed mb-8 text-base">
              &quot;SOLUTION cambió mi percepción sobre las fragancias premium.&quot;
            </p>
            <div>
              <p className="tracking-wider mb-1 text-sm">Lucas Peralta</p>
              <p className="text-xs opacity-50">Rosario</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
