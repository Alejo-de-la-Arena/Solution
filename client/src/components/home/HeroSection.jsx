import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const premiumEasing = [0.25, 0.1, 0.25, 1];

export default function HeroSection() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  const entrance = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } }
    : { initial: { y: -16, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.6, ease: premiumEasing } };

  const revealHeadline = reducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } }
    : {
        initial: { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
        animate: { clipPath: 'inset(0 0 0 0)', opacity: 1 },
        transition: { duration: 0.9, ease: premiumEasing },
      };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-black text-white">
      {/* Background: glows con drift + imagen con máscara */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="glow-blob absolute w-[70vw] max-w-2xl h-[50vh] rounded-full blur-[100px] mix-blend-screen"
          style={{ background: 'rgb(255, 0, 255)', top: '15%', right: '-10%', opacity: 0.12 }}
        />
        <div
          className="glow-blob-b absolute w-[60vw] max-w-xl h-[45vh] rounded-full blur-[100px] mix-blend-screen"
          style={{ background: 'rgb(0, 255, 255)', bottom: '20%', left: '-15%', opacity: 0.11 }}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-2xl">
          <img
            src="https://images.unsplash.com/photo-1610109790326-9a21dfe969b7?w=1080&q=80"
            alt="SOLUTION Fragrance"
            className="w-full h-[700px] object-cover opacity-30"
            style={{
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            }}
          />
          <div
            className="absolute inset-0 blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: 'rgb(0, 255, 255)' }}
          />
        </div>
      </div>

      <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
        <motion.h1
          {...revealHeadline}
          className="text-6xl sm:text-7xl lg:text-8xl font-heading font-bold tracking-wider uppercase"
        >
          SOLUTION
        </motion.h1>
        <motion.p
          {...entrance}
          transition={{ ...entrance.transition, delay: 0.2 }}
          className="text-xl sm:text-2xl opacity-70 tracking-wide max-w-2xl mx-auto leading-relaxed"
        >
          Fragancias masculinas auténticas.
          <br />
          Diseñadas desde cero. Sin imitaciones.
        </motion.p>

        <motion.div
          {...entrance}
          transition={{ ...entrance.transition, delay: 0.35 }}
          className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#tienda"
            className="btn-home-cta inline-flex items-center gap-2 rounded border border-white/40 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white backdrop-blur-sm"
          >
            Ver colección
            <span className="inline-block w-4 h-4" aria-hidden>→</span>
          </a>
        </motion.div>

        <div className="pt-8">
          <div className="w-px h-16 bg-gradient-to-b from-white/50 to-transparent mx-auto" />
        </div>
      </div>
    </section>
  );
}
