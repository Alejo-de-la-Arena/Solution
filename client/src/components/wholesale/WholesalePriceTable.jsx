import { WHOLESALE_PRICE_TABLE, WHOLESALE_TABLE_ROWS } from "../../data/wholesalePlans";
import { motion } from "motion/react";
import { useScrollMotion } from "../../hooks/useScrollMotion";

function formatPrice(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function WholesalePriceTable() {
  const { ref, premiumEasing } = useScrollMotion();

  return (
    <section
      ref={ref}
      className="section-precios-bg bg-black text-white py-12 md:py-20 px-4"
    >
      <div className="relative z-10 max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: premiumEasing }}
          className="font-heading text-2xl md:text-3xl font-semibold tracking-wider text-center mb-6"
        >
          Precios mayoristas
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: premiumEasing, delay: 0.05 }}
          className="text-white/60 text-center text-sm mb-8"
        >
          Valores de referencia por plan (ARS).
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: premiumEasing }}
          className="section-precios-panel overflow-x-auto border border-white/20 rounded-[28px] p-[1px]"
          style={{ padding: 1 }}
        >
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="border-b border-white/20 bg-white/5">
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-white/70">Modelo</th>
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-white/70 text-right">Precio minorista</th>
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-white/70 text-right">Starter (10-15 u / 20%)</th>
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-white/70 text-right">Pro (16-25 u / 25%)</th>
                <th className="px-4 py-3 text-xs uppercase tracking-widest text-white/70 text-right">Elite (25 u+ / 30%)</th>
              </tr>
            </thead>
            <tbody>
              {WHOLESALE_TABLE_ROWS.map(({ model, slug }) => {
                const row = WHOLESALE_PRICE_TABLE[slug];
                if (!row) return null;
                return (
                  <tr
                    key={slug}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-white">{model}</td>
                    <td className="px-4 py-3 text-right text-white/90">${formatPrice(row.retail)}</td>
                    <td className="px-4 py-3 text-right text-[rgb(255,215,0)]">${formatPrice(row.starter)}</td>
                    <td className="px-4 py-3 text-right text-[rgb(255,0,255)]">${formatPrice(row.pro)}</td>
                    <td className="px-4 py-3 text-right text-[rgb(0,255,255)]">${formatPrice(row.elite)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
