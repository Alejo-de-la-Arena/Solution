/**
 * Fuente de verdad: planes mayoristas (Starter / Pro / Elite) y precios por producto.
 * Compatibilidad: plan 'A' -> starter, 'B' -> pro (legacy). Elite solo como 'elite'.
 */

export const PLAN_KEYS = ["starter", "pro", "elite"];

/** Normaliza plan desde DB (puede venir A, B, starter, pro, elite). */
export function normalizePlan(plan) {
  if (!plan) return "starter";
  const p = String(plan).toLowerCase();
  if (p === "a") return "starter";
  if (p === "b") return "pro";
  if (PLAN_KEYS.includes(p)) return p;
  return "starter";
}

/** Etiqueta para UI. */
export function planLabel(plan) {
  const n = normalizePlan(plan);
  if (n === "starter") return "Plan Starter";
  if (n === "pro") return "Plan Pro";
  if (n === "elite") return "Plan Elite";
  return "Plan Starter";
}

/** Descripción corta para emails/UI (con % y rango). */
export function planShortDescription(plan) {
  const n = normalizePlan(plan);
  if (n === "starter") return "Starter (20%, 10-15 u/pedido)";
  if (n === "pro") return "Pro (25%, 16-25 u/pedido)";
  if (n === "elite") return "Elite (30%, +25 u/pedido)";
  return "Starter (20%, 10-15 u/pedido)";
}

/**
 * Tabla de precios mayoristas por slug de producto.
 * Valores exactos: minorista | Starter (20%) | Pro (25%) | Elite (30%)
 */
export const WHOLESALE_PRICE_TABLE = {
  "red-desire": { retail: 49999, starter: 39999, pro: 37499, elite: 34999 },
  "yellow-bloom": { retail: 49999, starter: 39999, pro: 37499, elite: 34999 },
  "black-code": { retail: 55000, starter: 44000, pro: 41250, elite: 38500 },
  "white-ice": { retail: 47000, starter: 37600, pro: 35250, elite: 32900 },
  "deep-blue": { retail: 47000, starter: 37600, pro: 35250, elite: 32900 },
};

/**
 * Precio por plan para un producto. product debe tener .slug (o .name para fallback).
 * Si no está en tabla: aplica descuento sobre price_retail (20/25/30%).
 */
export function priceForPlanFromTable(product, plan) {
  const normalized = normalizePlan(plan);
  const slug = (product?.slug || "").toLowerCase().replace(/\s+/g, "-");
  const row = WHOLESALE_PRICE_TABLE[slug];
  if (row && row[normalized] != null) return Number(row[normalized]);
  const retail = Number(product?.price_retail ?? 0) || row?.retail || 0;
  if (retail <= 0) return 0;
  const discount = { starter: 0.2, pro: 0.25, elite: 0.3 }[normalized] ?? 0.2;
  return Math.round(retail * (1 - discount));
}

/** Config para landing: beneficios y requisitos por plan. ELITE = 30% (no 35%). */
export const WHOLESALE_PLANS_LANDING = [
  {
    key: "starter",
    tag: "STARTER",
    tagBg: "rgb(0, 255, 255)",
    borderColor: "rgb(0, 255, 255)",
    title: "Plan Starter",
    discount: "20%",
    unitsRange: "10 a 15 unidades por pedido",
    description: "Este es el plan de entrada. Ideal para quienes quieren comenzar a probar la marca.",
    benefits: [
      "20% de descuento mayorista",
      "Compras sin mínimo una vez activado el plan",
      "Acceso a catálogo digital profesional",
      "Fichas técnicas completas (notas + storytelling)",
    ],
    requirement: "Mantener una compra mínima acumulada de 30 unidades cada 2 meses",
  },
  {
    key: "pro",
    tag: "PRO",
    tagBg: "rgb(255, 0, 255)",
    borderColor: "rgb(255, 0, 255)",
    title: "Plan Pro",
    discount: "25%",
    unitsRange: "16 a 25 unidades por pedido",
    description: "",
    benefits: [
      "25% de descuento mayorista",
      "Compras sin mínimo una vez dentro del programa",
      "Material promocional profesional (imágenes + videos listos para usar)",
      "Catálogo + fichas técnicas completas",
      "Asesoramiento comercial básico",
      "Prioridad en reposiciones de stock",
    ],
    requirement: "Mantener una compra mínima acumulada de 30 unidades cada 2 meses",
  },
  {
    key: "elite",
    tag: "ELITE",
    tagBg: "rgb(255, 215, 0)",
    borderColor: "rgb(255, 215, 0)",
    title: "Plan Elite",
    discount: "30%",
    unitsRange: "+25 unidades por pedido",
    description: "Es una alianza comercial.",
    benefits: [
      "30% de descuento mayorista",
      "Compras sin mínimo",
      "Acceso anticipado a nuevos lanzamientos",
      "Material exclusivo (creativos premium, contenido antes que el público general)",
      "Soporte comercial personalizado",
      "Posibilidad de zona protegida (según volumen)",
      "Participación en campañas colaborativas",
      "Acceso a promociones especiales para fechas clave",
      "Prioridad total de stock",
      "Dropshipping habilitado: Vendé productos sin invertir en stock extra. Recibís el pedido, nos enviás los datos del cliente y nosotros despachamos directamente al consumidor final con packaging oficial Solution. Además, podés dejar almacenado el stock inicial en nuestro depósito y nos encargamos de la gestión logística, armado y envío de cada pedido.",
    ],
    requirement: "Mantener una compra mínima acumulada de 30 unidades cada 2 meses",
  },
];

/** Tabla para mostrar en landing: filas [modelo, minorista, starter, pro, elite]. */
export const WHOLESALE_TABLE_ROWS = [
  { model: "Red Desire", slug: "red-desire" },
  { model: "Yellow Bloom", slug: "yellow-bloom" },
  { model: "Black Code", slug: "black-code" },
  { model: "White Ice", slug: "white-ice" },
  { model: "Deep Blue", slug: "deep-blue" },
];
