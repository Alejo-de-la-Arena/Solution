import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

function UnaNuevaEraSection() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const baseAnimation = reducedMotion
    ? {}
    : {
        initial: { y: -16, opacity: 0 },
        animate: isVisible ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 },
        exit: { y: 16, opacity: 0 },
        transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
      };

  return (
    <section
      ref={sectionRef}
      className="bg-bg-dark-alt py-section-py-mobile md:py-section-py px-6 md:px-12 lg:px-16"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Columna Izquierda - Texto */}
          <div>
            <motion.div
              {...baseAnimation}
              transition={{ ...baseAnimation.transition, delay: 0 }}
            >
              <div className="w-16 md:w-20 h-0.5 bg-accent-cyan mb-4 md:mb-6" />
            </motion.div>

            <motion.h2
              {...baseAnimation}
              transition={{ ...baseAnimation.transition, delay: 0.1 }}
              className="text-section-title md:text-4xl lg:text-5xl font-heading font-semibold text-text-primary mb-4 md:mb-6"
            >
              Una nueva era
            </motion.h2>

            <motion.p
              {...baseAnimation}
              transition={{ ...baseAnimation.transition, delay: 0.2 }}
              className="text-text-primary text-xl md:text-2xl lg:text-3xl font-body mb-6 md:mb-8"
            >
              Cinco fragancias. Infinitas posibilidades.
            </motion.p>

            <motion.p
              {...baseAnimation}
              transition={{ ...baseAnimation.transition, delay: 0.3 }}
              className="text-text-secondary text-base md:text-lg font-body mb-8 md:mb-12 leading-relaxed max-w-lg"
            >
              Cada perfume de nuestra colección fue creado para acompañarte en distintos momentos: desde la energía del día hasta la sofisticación de la noche. Fragancias pensadas para personas que buscan autenticidad sin renunciar a la calidad.
            </motion.p>

            <motion.a
              {...baseAnimation}
              transition={{ ...baseAnimation.transition, delay: 0.4 }}
              href="#coleccion"
              className="inline-block border border-text-primary text-text-primary font-body uppercase tracking-wider text-sm md:text-base px-6 md:px-8 py-3 md:py-4 hover:bg-text-primary hover:text-bg-dark transition-all duration-300"
            >
              EXPLORAR COLECCIÓN &gt;
            </motion.a>
          </div>

          {/* Columna Derecha - Imagen */}
          <motion.div
            {...baseAnimation}
            transition={{ ...baseAnimation.transition, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-lg overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/20 via-transparent to-transparent blur-2xl" />
              
              {/* Image */}
              <div
                className="relative aspect-[4/3] bg-cover bg-center bg-no-repeat rounded-lg"
                style={{
                  backgroundImage: `url(https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&q=80&fit=crop)`,
                }}
              >
                {/* Overlay para mejor contraste */}
                <div className="absolute inset-0 bg-black/30" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default UnaNuevaEraSection;
