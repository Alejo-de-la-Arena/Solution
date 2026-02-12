import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function FinalCtaSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="py-40 px-4 border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-5xl text-center space-y-12">
        <div className="space-y-6">
          <motion.h2
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0 }}
            className="text-4xl sm:text-6xl lg:text-7xl tracking-wider leading-tight font-heading"
          >
            Explorá la colección
            <br />
            completa
          </motion.h2>
          <motion.p
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.05 }}
            className="text-base sm:text-lg opacity-50 leading-relaxed max-w-2xl mx-auto"
          >
            Cinco fragancias únicas. Cada una con su propia identidad. Todas con la calidad y autenticidad que define a SOLUTION.
          </motion.p>
        </div>

        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
        >
          <Link
            to="/#tienda"
            className="inline-block bg-white text-black px-12 py-5 tracking-widest text-sm hover:bg-white/90 transition-all duration-300"
          >
            IR A LA TIENDA
          </Link>
          <Link
            to="/aplicar-mayorista"
            className="inline-flex items-center gap-2 text-sm tracking-widest opacity-50 hover:opacity-100 transition-opacity group"
          >
            <span className="border-b border-white/0 group-hover:border-white transition-all pb-1">O VENDER SOLUTION</span>
            <span className="w-4 h-4 inline-block group-hover:translate-x-1 transition-transform" aria-hidden>→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
