import { Link } from "react-router-dom";

function scrollToBeneficios() {
  document.getElementById("beneficios")?.scrollIntoView({ behavior: "smooth" });
}

export default function WholesaleHero() {
  return (
    <section className="relative bg-black text-white min-h-[85vh] flex flex-col items-center justify-center px-4 py-20 md:py-28 overflow-hidden">
      {/* Glows de fondo (muy suaves) */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div
          className="absolute w-[80vw] max-w-2xl h-[60vh] rounded-full blur-[120px] opacity-[0.08] mix-blend-screen"
          style={{ background: "rgb(255, 0, 255)", top: "10%", left: "-20%" }}
        />
        <div
          className="absolute w-[70vw] max-w-xl h-[50vh] rounded-full blur-[100px] opacity-[0.08] mix-blend-screen"
          style={{ background: "rgb(0, 255, 255)", bottom: "5%", right: "-15%" }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto text-center z-10">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-wider mb-6">
          Programa Mayorista
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-10">
          Convertite en revendedor oficial de SOLUTION y accedé a condiciones exclusivas para hacer crecer tu negocio.
        </p>

        <Link
          to="/aplicar-mayorista"
          className="inline-block px-10 py-4 font-semibold uppercase tracking-widest text-sm rounded border-2 border-[rgb(0,255,255)] transition-all duration-500 ease-out hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[rgb(0,255,255)] focus:ring-offset-2 focus:ring-offset-black animate-wholesale-cta"
          style={{
            background: "linear-gradient(135deg, rgb(255,0,255) 0%, rgba(255,0,255,0.9) 50%, rgba(0,255,255,0.15) 100%)",
            boxShadow: "0 0 30px rgba(255,0,255,0.35), 0 0 60px rgba(0,255,255,0.15)",
          }}
        >
          Aplicar para ser mayorista
        </Link>

        <button
          type="button"
          onClick={scrollToBeneficios}
          className="mt-12 flex flex-col items-center gap-2 text-white/70 hover:text-[rgb(0,255,255)] transition-colors duration-300 focus:outline-none focus:text-[rgb(0,255,255)]"
          aria-label="Ir a beneficios del programa"
        >
          <span className="text-xs uppercase tracking-widest">Ver más</span>
          <svg
            className="w-6 h-6 text-[rgb(0,255,255)] animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </section>
  );
}
