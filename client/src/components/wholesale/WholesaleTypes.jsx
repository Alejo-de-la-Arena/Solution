import { motion } from "motion/react";
import { WHOLESALE_PLANS_LANDING } from "../../data/wholesalePlans";
import { useScrollMotion } from "../../hooks/useScrollMotion";

function PlanCard({ data, index, reducedMotion, premiumEasing }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.65, ease: premiumEasing, delay: 0.05 + index * 0.06 }}
      whileHover={
        reducedMotion
          ? undefined
          : {
              y: -10,
              scale: 1.012,
            }
      }
      className="group relative rounded-[28px] bg-white/[0.02] p-6 md:p-8 border border-white/10 backdrop-blur-md transition-all"
      style={{ borderColor: data.borderColor }}
    >
      {/* Glow accent (muy sutil) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-hidden
        style={{
          background: `radial-gradient(circle at 20% 0%, ${data.borderColor}22 0%, transparent 45%), radial-gradient(circle at 80% 100%, ${data.borderColor}14 0%, transparent 55%)`,
        }}
      />

      <span
        className="absolute top-0 left-0 rounded-tl-lg px-3 py-1 text-xs font-bold text-black uppercase tracking-wider"
        style={{ backgroundColor: data.tagBg }}
      >
        {data.tag}
      </span>

      <h3 className="font-heading text-xl md:text-2xl font-bold text-white mt-6 mb-1 tracking-wide">
        {data.title}
      </h3>
      <p className="text-white/90 text-lg font-semibold mb-1">{data.discount} descuento</p>
      <p className="text-white/60 text-sm mb-4">{data.unitsRange}</p>
      {data.description ? <p className="text-white/70 text-sm mb-4">{data.description}</p> : null}

      <div className="border-t border-white/10 pt-4 mb-4">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Beneficios</p>
        <ul className="space-y-2">
          {data.benefits.map((text) => (
            <li key={text.slice(0, 40)} className="flex gap-2 text-white/90 text-sm leading-relaxed">
              <span
                className="shrink-0 w-1.5 h-1.5 rounded-full mt-2"
                style={{ backgroundColor: data.borderColor }}
              />
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Requisito de permanencia</p>
        <p className="text-white/80 text-sm">{data.requirement}</p>
      </div>
    </motion.div>
  );
}

export default function WholesaleTypes() {
  const { ref, reducedMotion, premiumEasing } = useScrollMotion();

  return (
    <section
      ref={ref}
      className="section-tipos-bg relative bg-black text-white py-12 md:py-20 px-4 overflow-hidden"
    >
      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: premiumEasing }}
          className="font-heading text-3xl md:text-4xl font-semibold tracking-wider text-center mb-4"
        >
          Tipos de revendedores
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: premiumEasing, delay: 0.05 }}
          className="text-white/70 text-center text-sm md:text-base max-w-xl mx-auto mb-10"
        >
          Elegí el nivel de acceso que mejor se adapte a tu perfil y comenzá a vender fragancias premium.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {WHOLESALE_PLANS_LANDING.map((plan, i) => (
            <PlanCard
              key={plan.key}
              data={plan}
              index={i}
              reducedMotion={reducedMotion}
              premiumEasing={premiumEasing}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
