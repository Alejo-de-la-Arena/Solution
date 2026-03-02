/**
 * Sección de imágenes grandes (2 columnas). Sin assets locales en repo: placeholders con gradient + overlay.
 * Para usar imágenes reales, reemplazar el contenido de cada card por <img> con src apropiado.
 */
export default function WholesaleImages() {
  return (
    <section className="bg-black text-white py-16 md:py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
            <div
              className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
            <div className="absolute bottom-4 left-4 text-white/50 text-xs tracking-[0.2em] uppercase">
              SOLUTION
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10">
            <div
              className="absolute inset-0 bg-gradient-to-bl from-neutral-800 via-neutral-900 to-black"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
            <div className="absolute bottom-4 left-4 text-white/50 text-xs tracking-[0.2em] uppercase">
              SOLUTION
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
