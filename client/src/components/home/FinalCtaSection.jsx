import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function FinalCtaSection() {
  const { ref, motionProps, reducedMotion } = useScrollMotion();

  return (
    <section
      ref={ref}
      className="relative py-20 sm:py-32 px-4 border-t border-white/10 bg-black text-white overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute inset-x-[-10%] bottom-[-30%] h-[70vh] blur-[90px]"
          style={{
            background:
              'radial-gradient(circle_at_20%_0%,rgba(0,255,255,0.22)_0%,transparent_55%),radial-gradient(circle_at_80%_20%,rgba(255,215,0,0.24)_0%,transparent_55%)',
          }}
          animate={
            reducedMotion
              ? { opacity: 0.5 }
              : { opacity: [0.36, 0.7, 0.5], scale: [0.96, 1.04, 0.98] }
          }
          transition={{ duration: 26, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.02 }}
          className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[#050505]/80 px-6 py-10 sm:px-10 sm:py-14 lg:px-16 lg:py-18 shadow-[0_40px_120px_rgba(0,0,0,0.95)]"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-[-20%] top-0 h-[40%] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.16)_0%,transparent_60%)]" />
          </div>

          <div className="relative flex flex-col lg:flex-row items-center lg:items-end justify-between gap-10">
            <div className="space-y-6 max-w-xl text-center lg:text-left">
              <motion.h2
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-heading tracking-[0.18em] leading-tight"
              >
                Explorá la colección
                <br />
                completa
              </motion.h2>
              <motion.p
                {...motionProps}
                transition={{ ...motionProps.transition, delay: 0.05 }}
                className="text-base sm:text-lg opacity-50 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Cinco fragancias únicas. Cada una con su propia identidad. Todas con la calidad y autenticidad que define a
                SOLUTION.
              </motion.p>
            </div>

            <div className="flex flex-col items-center lg:items-end gap-4 min-w-[260px]">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Link
                  to="/#tienda"
                  className="inline-block bg-white text-black px-12 py-5 tracking-widest text-sm font-semibold rounded hover:bg-white/90 hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  IR A LA TIENDA
                </Link>
                <Link
                  to="/aplicar-mayorista"
                  className="nav-link-underline inline-flex items-center gap-2 text-sm tracking-widest opacity-60 hover:opacity-100 transition-opacity group text-white"
                >
                  <span className="pb-1">O VENDER SOLUTION</span>
                  <span className="w-4 h-4 inline-block group-hover:translate-x-1 transition-transform" aria-hidden>
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

