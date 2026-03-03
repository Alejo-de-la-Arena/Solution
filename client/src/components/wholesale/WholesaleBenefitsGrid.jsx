const BENEFITS = [
  {
    iconColor: "rgb(0, 255, 255)",
    title: "Descuentos por plan",
    description: "Accedé a precios mayoristas según tu nivel (Starter, Pro o Elite).",
  },
  {
    iconColor: "rgb(255, 0, 255)",
    title: "Stock garantizado",
    description: "Acceso prioritario a reposiciones y disponibilidad según plan.",
  },
  {
    iconColor: "rgb(0, 255, 127)",
    title: "Envío rápido",
    description: "Despachos ágiles y prioridad logística en planes avanzados.",
  },
  {
    iconColor: "rgb(255, 215, 0)",
    title: "Material promocional",
    description: "Imágenes, videos y recursos listos para vender (Pro/Elite).",
  },
  {
    iconColor: "rgb(138, 43, 226)",
    title: "Asesoramiento",
    description: "Soporte comercial para ayudarte a crecer y resolver dudas.",
  },
  {
    iconColor: "rgb(255, 182, 193)",
    title: "Sin mínimo inicial",
    description: "Una vez aprobado el plan, podés comprar sin mínimo.",
  },
];

function CheckIcon({ color }) {
  return (
    <span
      className="benefit-icon shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-400 ease-out"
      style={{ borderColor: color, color }}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export default function WholesaleBenefitsGrid() {
  return (
    <section id="beneficios" className="section-beneficios-bg bg-black text-white py-16 md:py-24 px-4">
      <div className="relative z-10 max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold tracking-wider text-center mb-14 md:mb-20">
          Beneficios del programa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12 md:gap-y-16">
          {BENEFITS.map((item) => (
            <div
              key={item.title}
              className="benefit-card flex gap-4 text-left rounded-lg p-3 -m-3 transition-all duration-400 ease-out border border-transparent hover:border-white/10"
            >
              <CheckIcon color={item.iconColor} />
              <div className="min-w-0">
                <h3 className="font-heading text-lg md:text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm md:text-base leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
