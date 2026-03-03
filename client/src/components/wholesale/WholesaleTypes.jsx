import { WHOLESALE_PLANS_LANDING } from "../../data/wholesalePlans";

function PlanCard({ data }) {
  return (
    <div
      className="rounded-lg bg-white/5 p-6 md:p-8 border relative"
      style={{ borderColor: data.borderColor, borderWidth: "1px" }}
    >
      <span
        className="absolute top-0 left-0 rounded-tl-lg px-3 py-1 text-xs font-bold text-black uppercase tracking-wider"
        style={{ backgroundColor: data.tagBg }}
      >
        {data.tag}
      </span>
      <h3 className="font-heading text-xl md:text-2xl font-bold text-white mt-6 mb-1">{data.title}</h3>
      <p className="text-white/90 text-lg font-semibold mb-1">{data.discount} descuento</p>
      <p className="text-white/60 text-sm mb-4">{data.unitsRange}</p>
      {data.description ? (
        <p className="text-white/70 text-sm mb-4">{data.description}</p>
      ) : null}

      <div className="border-t border-white/10 pt-4 mb-4">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-3">Beneficios</p>
        <ul className="space-y-2">
          {data.benefits.map((text) => (
            <li
              key={text.slice(0, 40)}
              className="flex gap-2 text-white/90 text-sm leading-relaxed"
            >
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
    </div>
  );
}

export default function WholesaleTypes() {
  return (
    <section className="section-tipos-bg relative bg-black text-white py-12 md:py-20 px-4 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-wider text-center mb-4">
          Tipos de revendedores
        </h2>
        <p className="text-white/70 text-center text-sm md:text-base max-w-xl mx-auto mb-10">
          Elegí el nivel de acceso que mejor se adapte a tu perfil y comenzá a vender fragancias premium.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {WHOLESALE_PLANS_LANDING.map((plan) => (
            <PlanCard key={plan.key} data={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
