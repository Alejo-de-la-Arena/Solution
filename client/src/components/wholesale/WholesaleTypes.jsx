const TIPO_A = {
  tag: 'TIPO A',
  tagBg: 'rgb(0, 255, 255)',
  borderColor: 'rgb(0, 255, 255)',
  title: 'Revendedor Inicial',
  price: '$50.000',
  priceSuffix: 'ARS',
  priceNote: 'Compra mínima de ingreso',
  benefits: [
    'Acceso a precios mayoristas: 40% de descuento durante 6 meses desde la primera compra',
    'Compras sin mínimo: Realizá pedidos online de cualquier cantidad una vez dentro del programa',
    'Material oficial: Acceso completo a imágenes de producto y contenido para redes sociales',
    'Soporte de venta: Asesoramiento básico sobre productos y preguntas frecuentes',
  ],
  requirements: [
    'Volumen mínimo: $80.000 en compras cada 6 meses para mantener el acceso',
    'Consumo mensual sugerido: Mínimo $13.000/mes promedio',
    'Precios al público: Respeto obligatorio de los precios de venta sugeridos por la marca',
  ],
};

const TIPO_B = {
  tag: 'TIPO B',
  tagBg: 'rgb(255, 0, 255)',
  borderColor: 'rgb(255, 0, 255)',
  title: 'Revendedor Premium',
  price: '$120.000',
  priceSuffix: 'ARS',
  priceNote: 'Compra mínima de ingreso',
  benefits: [
    'Acceso a precios mayoristas: 40% de descuento durante 12 meses desde la primera compra',
    'Compras sin mínimo: Realizá pedidos online de cualquier cantidad con envío prioritario',
    'Material oficial: Acceso completo a imágenes de producto, contenido exclusivo y banners personalizados',
    'Servicio de logística: Posibilidad de usar el servicio de dropshipping de la marca para gestión de pedidos',
    'Soporte dedicado: Asesor comercial asignado con atención personalizada y lanzamientos anticipados',
  ],
  requirements: [
    'Volumen mínimo: $200.000 en compras cada 12 meses para mantener el acceso',
    'Consumo mensual sugerido: Mínimo $16.500/mes promedio',
    'Precios al público: Respeto obligatorio de los precios de venta sugeridos por la marca',
  ],
};

function ResellerCard({ data }) {
  return (
    <div
      className="rounded-lg bg-white/5 p-6 md:p-8 border relative"
      style={{ borderColor: data.borderColor, borderWidth: '1px' }}
    >
      <span
        className="absolute top-0 left-0 rounded-tl-lg px-3 py-1 text-xs font-bold text-white uppercase tracking-wider"
        style={{ backgroundColor: data.tagBg }}
      >
        {data.tag}
      </span>
      <h3 className="font-heading text-2xl md:text-3xl font-bold text-white mt-6 mb-2">{data.title}</h3>
      <p className="text-white text-2xl md:text-3xl font-bold">
        {data.price} <span className="text-sm font-normal text-white/70 align-super">{data.priceSuffix}</span>
      </p>
      <p className="text-white/60 text-sm mb-6">{data.priceNote}</p>

      <div className="border-t border-white/10 pt-6 mb-6">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-4">Beneficios del programa</p>
        <ul className="space-y-3">
          {data.benefits.map((text) => (
            <li key={text} className="flex gap-3 text-white/90 text-sm md:text-base leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: `${data.borderColor}30`, color: data.borderColor }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10 pt-6 mb-6">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-4">Requisitos de permanencia</p>
        <ul className="space-y-2">
          {data.requirements.map((text) => (
            <li key={text} className="flex gap-2 text-white/90 text-sm leading-relaxed">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ backgroundColor: data.borderColor }} />
              {text}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-white/50 text-xs italic leading-relaxed">
        * El incumplimiento de estos requisitos resultará en la desactivación de la cuenta de revendedor y la pérdida de acceso a precios mayoristas.
      </p>
    </div>
  );
}

export default function WholesaleTypes() {
  return (
    <section className="bg-black text-white py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold tracking-wider text-center mb-6">
          Tipos de revendedores
        </h2>
        <p className="text-white/80 text-center text-base md:text-lg max-w-2xl mx-auto mb-14 md:mb-20 leading-relaxed">
          Elegí el nivel de acceso que mejor se adapte a tu perfil y comenzá a vender fragancias premium.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <ResellerCard data={TIPO_A} />
          <ResellerCard data={TIPO_B} />
        </div>
      </div>
    </section>
  );
}
