import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

export default function ElResultadoSection() {
  const { ref, motionProps } = useScrollMotion();

  return (
    <section ref={ref} className="py-20 px-4 bg-black text-white">
      <div className="mx-auto max-w-4xl text-center space-y-12">
        <div>
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0 }}
            className="w-20 h-1 mb-8 mx-auto"
            style={{ backgroundColor: 'rgb(255, 215, 0)' }}
          />
          <motion.h3
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.05 }}
            className="text-3xl sm:text-5xl lg:text-6xl tracking-wider leading-tight mb-8 font-heading"
          >
            El resultado
          </motion.h3>
        </div>

        <div className="space-y-8 text-base sm:text-lg opacity-80 leading-relaxed max-w-2xl mx-auto">
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.1 }}
            className="space-y-3"
          >
            <motion.p
              className="text-3xl sm:text-5xl tracking-[0.22em] text-white"
              style={{ textShadow: '0 0 28px rgba(255, 215, 0, 0.08)' }}
              initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.55, delay: 0.16 }}
            >
              NEW ERA
            </motion.p>
            <motion.div
              className="h-px w-32 mx-auto"
              style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.05), rgb(255, 215, 0), rgba(255,255,255,0.05))' }}
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.7, delay: 0.22 }}
            />
          </motion.div>
          <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.15 }} className="opacity-70 text-sm sm:text-base tracking-[0.18em] uppercase text-white/65">
            &quot;The language of colors&quot;
          </motion.p>
          <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.2 }} className="grid gap-3 max-w-xl mx-auto">
            <motion.p
              className="text-lg sm:text-xl tracking-[0.12em] text-white/88"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.4, delay: 0.24 }}
            >
              Cinco fragancias.
            </motion.p>
            <motion.p
              className="text-lg sm:text-xl tracking-[0.12em] text-white/88"
              style={{ color: 'rgba(255, 235, 180, 0.92)' }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.4, delay: 0.28 }}
            >
              Cinco personalidades.
            </motion.p>
            <motion.p
              className="text-lg sm:text-xl tracking-[0.12em]"
              style={{ color: 'rgba(198, 231, 255, 0.92)' }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.4, delay: 0.32 }}
            >
              Cinco colores
            </motion.p>
            <motion.p
              className="text-xl sm:text-2xl tracking-[0.14em] text-white"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.45, delay: 0.36 }}
            >
              Una nueva etapa.
            </motion.p>
          </motion.div>
          <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.25 }}>
            Desarrolladas desde nuestra visión, pensadas para el ritmo real de quienes las usan.
          </motion.p>
          <motion.p {...motionProps} transition={{ ...motionProps.transition, delay: 0.3 }} className="text-sm opacity-60 italic pt-4">
            Desde la frescura cotidiana hasta la intensidad que deja huella.
            <br />
            NEW ERA es el inicio de una identidad que llegó para quedarse.
          </motion.p>
        </div>

        <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.35 }} className="relative pt-8">
          <img
            src="https://images.unsplash.com/photo-1761392676464-2d518ffa243d?w=1080&q=80"
            alt="Design Excellence"
            className="w-full h-[550px] object-cover opacity-40 mx-auto max-w-3xl"
            style={{
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 95%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 95%)',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-3xl opacity-15 pointer-events-none"
            style={{ backgroundColor: 'rgb(255, 215, 0)' }}
          />
        </motion.div>

        <motion.div {...motionProps} transition={{ ...motionProps.transition, delay: 0.4 }} className="pt-6">
          <a
            href="#tienda"
            className="btn-home-cta inline-flex items-center gap-3 rounded border border-white/40 bg-white/5 px-8 py-3 text-sm tracking-widest text-white backdrop-blur-sm"
          >
            EXPLORAR COLECCIÓN
            <span className="inline-block w-4 h-4" aria-hidden>→</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
