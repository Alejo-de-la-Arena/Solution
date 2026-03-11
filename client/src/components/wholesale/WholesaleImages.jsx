/**
 * Sección de imágenes grandes (2 columnas). Sin assets locales en repo: placeholders con gradient + overlay.
 * Para usar imágenes reales, reemplazar el contenido de cada card por <img> con src apropiado.
 */
export default function WholesaleImages() {
  return (
    <section className="bg-black text-white py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="wholesale-image-card relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(255,0,255,0.2)]">
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
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-white/60 text-xs font-heading tracking-[0.25em] uppercase">
                SOLUTION
              </span>
            </div>
          </div>
          <div className="wholesale-image-card relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-[0_0_40px_-10px_rgba(0,255,255,0.15)]">
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
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <span className="text-white/60 text-xs font-heading tracking-[0.25em] uppercase">
                SOLUTION
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
