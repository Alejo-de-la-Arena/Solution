/**
 * Sección de imágenes grandes (2 columnas). Sin assets locales en repo: placeholders con gradient + overlay.
 * Para usar imágenes reales, reemplazar el contenido de cada card por <img> con src apropiado.
 */
import { motion } from "motion/react";
import { useScrollMotion } from "../../hooks/useScrollMotion";

export default function WholesaleImages() {
  const { ref, reducedMotion, premiumEasing } = useScrollMotion();

  return (
    <section ref={ref} className="bg-black text-white py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: premiumEasing, delay: 0.04 }}
            whileHover={
              reducedMotion
                ? undefined
                : {
                    y: -8,
                  }
            }
            className="relative aspect-[4/3] rounded-[28px] overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(255,0,255,0.25)]"
          >
            <div
              className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
              aria-hidden
            />
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background:
                  "radial-gradient(circle at 20% 10%, rgba(255,0,255,0.25) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(0,255,255,0.18) 0%, transparent 48%)",
                opacity: 0.6,
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-white/60 text-xs font-heading tracking-[0.25em] uppercase">
                SOLUTION
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.65, ease: premiumEasing, delay: 0.08 }}
            whileHover={
              reducedMotion
                ? undefined
                : {
                    y: -8,
                  }
            }
            className="relative aspect-[4/3] rounded-[28px] overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(0,255,255,0.2)]"
          >
            <div
              className="absolute inset-0 bg-gradient-to-bl from-neutral-800 via-neutral-900 to-black"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
              aria-hidden
            />
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
              aria-hidden
            />
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden
              style={{
                background:
                  "radial-gradient(circle at 20% 10%, rgba(0,255,255,0.22) 0%, transparent 42%), radial-gradient(circle at 90% 80%, rgba(255,0,255,0.16) 0%, transparent 50%)",
                opacity: 0.6,
              }}
            />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-white/60 text-xs font-heading tracking-[0.25em] uppercase">
                SOLUTION
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
