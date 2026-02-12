import { useEffect, useRef, useState } from 'react';

const defaultOptions = {
  threshold: 0.15,
  rootMargin: '0px 0px -5% 0px',
};

/**
 * Hook para animaciones de entrada/salida por scroll (solo eje vertical).
 * - Entrada: cuando el elemento entra en viewport → y: -16 → 0, opacity: 0 → 1
 * - Salida: cuando sale → y: 0 → 16, opacity: 1 → 0
 * Respetar prefers-reduced-motion: reducir movimiento o solo fade.
 */
export function useScrollMotion(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const { threshold, rootMargin } = { ...defaultOptions, ...options };

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(prefersReduced.matches);
    const onChange = (e) => setReducedMotion(e.matches);
    prefersReduced.addEventListener('change', onChange);

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold, rootMargin }
    );

    const el = ref.current;
    if (el) observer.observe(el);

    return () => {
      prefersReduced.removeEventListener('change', onChange);
      if (el) observer.unobserve(el);
    };
  }, [threshold, rootMargin]);

  const motionProps = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: inView ? { opacity: 1 } : { opacity: 0 },
        transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
      }
    : {
        initial: { y: -16, opacity: 0 },
        animate: inView ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 },
        transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
      };

  return { ref, inView, motionProps };
}
