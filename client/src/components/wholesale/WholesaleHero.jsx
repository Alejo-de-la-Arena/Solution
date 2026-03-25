import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useScrollMotion } from "../../hooks/useScrollMotion";

function scrollToBeneficios() {
  document.getElementById("beneficios")?.scrollIntoView({ behavior: "smooth" });
}

export default function WholesaleHero() {
  const { ref, motionProps, reducedMotion, premiumEasing } = useScrollMotion();

  return (
    <motion.section
      ref={ref}
      {...motionProps}
      transition={{ ...motionProps.transition, ease: premiumEasing }}
      className="relative bg-black text-white min-h-[85vh] flex flex-col items-center justify-center px-4 py-20 md:py-28 overflow-hidden"
    >
      {/* Glows con breathing (scale + translate suave, 20–40s) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="glow-breathing-a absolute w-[80vw] max-w-2xl h-[60vh] rounded-full blur-[120px] mix-blend-screen"
          style={{
            background: "rgb(255, 0, 255)",
            top: "10%",
            left: "-20%",
            opacity: 0.16,
          }}
        />
        <div
          className="glow-breathing-b absolute w-[70vw] max-w-xl h-[50vh] rounded-full blur-[100px] mix-blend-screen"
          style={{
            background: "rgb(0, 255, 255)",
            bottom: "5%",
            right: "-15%",
            opacity: 0.15,
          }}
        />
      </div>

      {/* Overlay premium (grid + vignette sutil) */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06)_0%,transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.55] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.72)_78%,rgba(0,0,0,0.95)_100%)]" />
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
          className="btn-animated-gradient-wholesale inline-block px-8 sm:px-10 py-3.5 sm:py-4 font-semibold uppercase tracking-widest text-sm rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(0,255,255)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label="Aplicar para ser mayorista"
        >
          <span>Aplicar para ser mayorista</span>
        </Link>
      </div>

      {/* Scroll indicator: ancla al bottom del hero, sin estilo botón */}
      <motion.button
        type="button"
        onClick={scrollToBeneficios}
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.65, ease: premiumEasing, delay: 0.05 }}
        whileHover={
          reducedMotion
            ? undefined
            : {
                y: -4,
              }
        }
        className="scroll-indicator absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/60 hover:text-white/90 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded"
        aria-label="Deslizá para ver más"
      >
        <span className="text-[10px] uppercase tracking-[0.2em]">Deslizá para ver más</span>
        <svg
          className="w-6 h-6 animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.button>
    </motion.section>
  );
}
