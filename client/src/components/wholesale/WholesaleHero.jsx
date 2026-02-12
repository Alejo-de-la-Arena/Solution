export default function WholesaleHero() {
  return (
    <section className="bg-black text-white py-20 md:py-28 lg:py-36 px-4 border-b border-white/10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-wider mb-6">
          Programa Mayorista
        </h1>
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-16 md:mb-20">
          Convertite en revendedor oficial de SOLUTION y accedé a condiciones exclusivas para hacer crecer tu negocio.
        </p>
        <div className="flex justify-center">
          <svg
            className="w-6 h-6 text-[rgb(0,255,255)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  );
}
