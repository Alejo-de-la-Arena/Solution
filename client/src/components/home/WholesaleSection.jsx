import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useScrollMotion } from '../../hooks/useScrollMotion';

const PLAN_ACCENTS = {
  starter: 'rgb(255, 215, 0)',
  pro: 'rgb(255, 0, 255)',
  elite: 'rgb(0, 255, 255)',
};

export default function WholesaleSection() {
  const { ref, motionProps, reducedMotion, premiumEasing } = useScrollMotion();

  const benefits = [
    { color: PLAN_ACCENTS.starter, text: 'Descuentos reales por plan: 20%, 25% y 30%.' },
    { color: PLAN_ACCENTS.pro, text: 'Material oficial de marca para acompañar la venta.' },
    { color: 'rgb(0, 255, 255)', text: 'Soporte personalizado para crecer con SOLUTION.' },
  ];

  const plans = [
    { name: 'Starter', detail: '20%', color: PLAN_ACCENTS.starter },
    { name: 'Pro', detail: '25%', color: PLAN_ACCENTS.pro },
    { name: 'Elite', detail: '30%', color: PLAN_ACCENTS.elite },
  ];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-32 text-white"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <motion.div
          className="absolute inset-y-[-10%] left-[10%] w-[60vw] max-w-4xl blur-[80px]"
          style={{
            background:
              'radial-gradient(circle_at_0%_20%,rgba(0,255,255,0.16)_0%,transparent_55%),radial-gradient(circle_at_100%_80%,rgba(255,0,255,0.12)_0%,transparent_55%)',
          }}
          animate={
            reducedMotion
              ? { opacity: 0.36 }
              : {
                opacity: [0.28, 0.5, 0.36],
                scale: [0.97, 1.05, 0.99],
              }
          }
          transition={{ duration: 24, ease: 'easeInOut', repeat: Infinity }}
        />

        <motion.div
          className="absolute right-[-8%] bottom-[-12%] h-[28rem] w-[28rem] rounded-full blur-[120px]"
          style={{
            background:
              'radial-gradient(circle, rgba(255,215,0,0.09) 0%, rgba(255,215,0,0.03) 35%, transparent 68%)',
          }}
          animate={
            reducedMotion
              ? { opacity: 0.22 }
              : {
                opacity: [0.16, 0.26, 0.2],
                scale: [0.98, 1.06, 1],
              }
          }
          transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl space-y-14">
        <motion.div
          {...motionProps}
          transition={{ ...motionProps.transition, delay: 0.02 }}
          className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end"
        >
          <div className="max-w-xl space-y-4">
            <div className="mb-4 text-xs tracking-[0.4em] opacity-30">OPORTUNIDAD</div>
            <h2 className="font-heading text-4xl tracking-wider sm:text-6xl lg:text-7xl">
              Crecé con SOLUTION
            </h2>
          </div>

          <div className="max-w-md space-y-4">
            <p className="text-sm leading-relaxed text-white/74 sm:text-base">
              Si sos emprendedor o tenés un negocio establecido, podés sumarte a nuestro programa
              mayorista exclusivo. Ofrecemos condiciones especiales, precios diferenciados y el
              soporte necesario para vender fragancias premium con una propuesta clara.
            </p>


          </div>
        </motion.div>

        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)] lg:gap-16">
          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.08 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3 sm:text-sm">
              {benefits.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.55, delay: 0.1 + i * 0.05, ease: premiumEasing }}
                  className="rounded-3xl border border-white/10 bg-white/[0.02] px-5 py-5 backdrop-blur-md"
                >
                  <div className="mb-3 h-px w-12" style={{ backgroundColor: item.color }} />
                  <p className="text-sm leading-relaxed text-white/72">{item.text}</p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.18, ease: premiumEasing }}
              className="rounded-[28px] border border-white/10 bg-white/[0.02] p-5 backdrop-blur-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[0.72rem] uppercase tracking-[0.28em] text-white/42">
                    esquema comercial
                  </p>
                  <p className="text-sm leading-relaxed text-white/74 sm:text-base">
                    Tres niveles de compra para que puedas empezar, escalar y mejorar tu margen con
                    una estructura clara.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs tracking-[0.16em] text-white/72"
                    >
                      <span style={{ color: plan.color }}>{plan.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.22, ease: premiumEasing }}
              className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center"
            >
              <Link
                to="/aplicar-mayorista"
                className="group inline-flex items-center gap-3 rounded border border-white/50 px-10 py-4 text-sm tracking-widest text-white transition-all duration-300 hover:border-[rgb(255,215,0)] hover:bg-white/[0.05] hover:shadow-[0_0_30px_rgba(255,215,0,0.08)]"
              >
                CONOCER PROGRAMA
                <span
                  className="inline-block h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            {...motionProps}
            transition={{ ...motionProps.transition, delay: 0.1 }}
            className="relative"
          >
            <div className="relative mx-auto max-w-md">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] border border-white/10 bg-[#050505] shadow-[0_34px_110px_rgba(0,0,0,0.95)]">
                <motion.div
                  className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    background:
                      'radial-gradient(circle_at_22%_18%, rgba(255,255,255,0.12) 0%, transparent 28%), radial-gradient(circle_at_80%_20%, rgba(0,255,255,0.08) 0%, transparent 34%), radial-gradient(circle_at_50%_90%, rgba(255,215,0,0.08) 0%, transparent 30%)',
                  }}
                  animate={
                    reducedMotion
                      ? { opacity: 0.42 }
                      : {
                        opacity: [0.32, 0.5, 0.38],
                        scale: [0.99, 1.02, 1],
                      }
                  }
                  transition={{ duration: 18, ease: 'easeInOut', repeat: Infinity }}
                />

                <img
                  src="https://tpyzgrcqregtzmuirfny.supabase.co/storage/v1/object/public/solution-products/Solution_edit/medium/dsc03237.webp"
                  alt="Exhibición mayorista SOLUTION"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: '50% 52%' }}
                  loading="lazy"
                />

                <div className="pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.34)_100%)]" />
                <div className="pointer-events-none absolute inset-x-8 bottom-7 z-[3] h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                <div className="pointer-events-none absolute bottom-6 left-6 right-6 z-[3]">
                  <div className="rounded-2xl border border-white/10 bg-black/28 px-4 py-3 backdrop-blur-md">
                    <p className="text-[0.68rem] uppercase tracking-[0.28em] text-white/42">
                      mayorista solution
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/72">
                      Una propuesta premium para puntos de venta, emprendedores y negocios que
                      buscan crecer con producto, identidad y mejores márgenes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}