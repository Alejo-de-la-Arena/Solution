import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

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
    : { initial: { y: -16, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } };

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-black text-white">
      {/* Background: imagen con máscara radial + glow cian (como Figma) */}
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
          {...entrance}
          className="text-6xl sm:text-7xl lg:text-8xl font-heading font-bold tracking-wider uppercase"
        >
          SOLUTION
        </motion.h1>
        <motion.p
          {...entrance}
          transition={{ ...entrance.transition, delay: 0.15 }}
          className="text-xl sm:text-2xl opacity-70 tracking-wide max-w-2xl mx-auto leading-relaxed"
        >
          Fragancias masculinas auténticas.
          <br />
          Diseñadas desde cero. Sin imitaciones.
        </motion.p>

        <div className="pt-12">
          <div className="w-px h-16 bg-gradient-to-b from-white/50 to-transparent mx-auto" />
        </div>
      </div>
    </section>
  );
}
