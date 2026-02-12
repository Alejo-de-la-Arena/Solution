import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

const CIRCLE_ACCENT = 'rgb(0, 150, 255)';

export default function CirculoCincoSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="bg-black py-32 px-4">
      <div className="mx-auto max-w-6xl relative min-h-[600px] flex items-center justify-center">
        {/* Glow central (sin círculo relleno) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-48 h-48 sm:w-64 sm:h-64 blur-3xl opacity-30"
          style={{ backgroundColor: CIRCLE_ACCENT }}
        />

        {/* Solo circunferencia fina, sin relleno */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] rounded-full pointer-events-none"
          style={{ border: `1px solid ${CIRCLE_ACCENT}`, opacity: 0.3 }}
        />


        {/* Top - CINCO FRAGANCIAS (con caja) */}
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.1 }}
          className="
    absolute left-2/2 -translate-x-2/2 -translate-y-1/2
    top-[calc(50%-200px)] sm:top-[calc(50%-250px)]
  "
        >
          <div
            className="border px-6 py-3"
            style={{ borderColor: CIRCLE_ACCENT, borderWidth: '1px' }}
          >
            <p className="text-base sm:text-lg tracking-widest whitespace-nowrap text-white">
              CINCO FRAGANCIAS
            </p>
          </div>
        </motion.div>


        {/* Right - CINCO PERSONALIDADES */}
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.15 }}
          className="absolute top-1/2 right-4 sm:right-12 -translate-y-1/2 text-center"
        >
          <p className="text-sm sm:text-base tracking-widest opacity-70 whitespace-nowrap text-white">
            CINCO
            <br />
            PERSONALIDADES
          </p>
        </motion.div>

        {/* Bottom - CINCO AROMAS */}
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.2 }}
          className="absolute bottom-8 left-2/2 -translate-x-1/2"
        >
          <p className="text-sm sm:text-base tracking-widest opacity-70 whitespace-nowrap text-white">
            CINCO AROMAS
          </p>
        </motion.div>

        {/* Left - CINCO SITUACIONES */}
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.25 }}
          className="absolute top-1/2 left-4 sm:left-12 -translate-y-1/2 text-center"
        >
          <p className="text-sm sm:text-base tracking-widest opacity-70 whitespace-nowrap text-white">
            CINCO
            <br />
            SITUACIONES
          </p>
        </motion.div>

        {/* CTA central */}
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0 }}
          className="relative z-10"
        >
          <a
            href="#tienda"
            className="inline-flex items-center gap-3 border px-8 py-4 text-sm tracking-widest text-white transition-all duration-300 hover:bg-[rgb(0,150,255)] hover:text-black"
            style={{ borderColor: CIRCLE_ACCENT }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = CIRCLE_ACCENT;
              e.currentTarget.style.color = 'black';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'white';
            }}
          >
            EXPLORAR LA COLECCIÓN
            <span className="inline-block w-4 h-4 ml-1" aria-hidden>
              →
            </span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
