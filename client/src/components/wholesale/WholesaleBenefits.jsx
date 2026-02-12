const BENEFITS = [
  {
    iconColor: 'rgb(0, 255, 255)',
    title: 'Descuento del 40%',
    description: 'Precios mayoristas con un margen de ganancia atractivo para tu negocio.',
  },
  {
    iconColor: 'rgb(255, 215, 0)',
    title: 'Material promocional',
    description: 'Acceso a imágenes, descripciones y recursos para potenciar tus ventas.',
  },
  {
    iconColor: 'rgb(255, 0, 255)',
    title: 'Stock garantizado',
    description: 'Siempre tendrás acceso a toda la línea de productos sin limitaciones.',
  },
  {
    iconColor: 'rgb(138, 43, 226)',
    title: 'Asesoramiento',
    description: 'Soporte directo de nuestro equipo para responder todas tus consultas.',
  },
  {
    iconColor: 'rgb(0, 255, 127)',
    title: 'Envío rápido',
    description: 'Despachos prioritarios en 24-48 horas a todo el país.',
  },
  {
    iconColor: 'rgb(255, 182, 193)',
    title: 'Sin mínimo inicial',
    description: 'Comenzá con la cantidad que necesites, sin exigencias de compra mínima.',
  },
];

function CheckIcon({ color }) {
  return (
    <span
      className="flex shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2"
      style={{ borderColor: color, color }}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export default function WholesaleBenefits() {
  return (
    <section className="bg-black text-white py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold tracking-wider text-center mb-14 md:mb-20">
          Beneficios del programa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-12 md:gap-y-16 mb-16 md:mb-24">
          {BENEFITS.map((item) => (
            <div key={item.title} className="flex gap-4 text-left">
              <CheckIcon color={item.iconColor} />
              <div>
                <h3 className="font-heading text-lg md:text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm md:text-base leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="relative aspect-[4/3] rounded overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80"
              alt=""
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="relative aspect-[4/3] rounded overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80"
              alt=""
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        </div>
      </div>
    </section>
  );
}
