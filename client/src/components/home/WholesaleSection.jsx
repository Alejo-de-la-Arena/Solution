import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function WholesaleSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="py-32 px-4 border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-5xl text-center space-y-12">
        <div>
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0 }}
            className="text-xs tracking-[0.4em] opacity-30 mb-4"
          >
            OPORTUNIDAD
          </motion.div>
          <motion.h2
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.05 }}
            className="text-4xl sm:text-6xl lg:text-7xl tracking-wider mb-6 font-heading"
          >
            Crecé con SOLUTION
          </motion.h2>
        </div>

        <motion.p
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.1 }}
          className="text-base sm:text-lg opacity-80 leading-relaxed max-w-2xl mx-auto"
        >
          Si sos emprendedor o tenés un negocio establecido, podés sumarte a nuestro programa mayorista exclusivo. Ofrecemos condiciones especiales, precios diferenciados y todo el soporte que necesitás para ofrecer fragancias premium a tus clientes.
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto pt-8">
          <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.15 }} className="space-y-3">
            <div className="w-12 h-px mx-auto" style={{ backgroundColor: 'rgb(0, 255, 255)' }} />
            <p className="text-sm opacity-70 leading-relaxed">40% descuento en toda la colección</p>
          </motion.div>
          <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.2 }} className="space-y-3">
            <div className="w-12 h-px mx-auto" style={{ backgroundColor: 'rgb(255, 0, 255)' }} />
            <p className="text-sm opacity-70 leading-relaxed">Material oficial de marca</p>
          </motion.div>
          <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.25 }} className="space-y-3">
            <div className="w-12 h-px mx-auto" style={{ backgroundColor: 'rgb(0, 255, 127)' }} />
            <p className="text-sm opacity-70 leading-relaxed">Soporte personalizado</p>
          </motion.div>
        </div>

        <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.3 }} className="pt-8">
          <Link
            to="/aplicar-mayorista"
            className="inline-flex items-center gap-3 border border-white px-10 py-4 tracking-widest text-sm text-white hover:bg-white hover:text-black transition-all duration-300"
          >
            CONOCER PROGRAMA
            <span className="w-4 h-4 inline-block" aria-hidden>→</span>
          </Link>
        </motion.div>

        <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.35 }} className="relative pt-12">
          <div className="aspect-video overflow-hidden max-w-3xl mx-auto">
            <img
              src="https://images.unsplash.com/photo-1635182473361-1f72e7b4be83?w=1080&q=80"
              alt="Business Opportunity"
              className="w-full h-full object-cover opacity-30"
              style={{
                maskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 60%, transparent 100%)',
              }}
            />
          </div>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 blur-3xl opacity-10 pointer-events-none"
            style={{ backgroundColor: 'rgb(255, 0, 255)' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
