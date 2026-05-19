import { useEffect, useRef } from 'react';

/**
 * Attach this ref to a container with className "sol-reveal".
 * When it enters the viewport, adds "sol-in" (triggers CSS transition).
 * Respects prefers-reduced-motion.
 */
export function useReveal(threshold = 0.12) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion — reveal immediately
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      el.classList.add('sol-in');
      return;
    }

    if (!('IntersectionObserver' in window)) {
      el.classList.add('sol-in');
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('sol-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold, rootMargin: '0px 0px -8% 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return ref;
}
