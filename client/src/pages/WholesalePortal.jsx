import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getWholesaleProducts,
  priceForPlan,
  saveWholesaleOrder,
  getMyWholesaleOrders,
  getOrderItems,
} from "../services/wholesaleOrders";
import { normalizePlan, planLabel, WHOLESALE_PLANS_LANDING, WHOLESALE_PRICE_TABLE } from "../data/wholesalePlans";

import { WHATSAPP_NUMBER } from "../lib/contact";

function formatPrice(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

const PLAN_COLORS = {
  starter: "rgb(255, 215, 0)",
  pro: "rgb(255, 0, 255)",
  elite: "rgb(0, 255, 255)",
};

function getRetailPrice(product) {
  const slug = (product?.slug || "").toLowerCase().replace(/\s+/g, "-");
  const row = WHOLESALE_PRICE_TABLE[slug];
  if (row) return row.retail;
  return Number(product?.price_retail ?? 0) || 0;
}

function buildWhatsAppText(items, products, plan, totalUnits, totalAmount) {
  const lines = [
    "Pedido mayorista SOLUTION",
    `Plan: ${planLabel(plan)}`,
    '',
    ...items
      .filter((i) => i.quantity > 0)
      .map((i) => {
        const p = products.find((x) => x.id === i.product_id);
        const name = p?.name || i.product_id;
        return `• ${name}: ${i.quantity} u x ${formatPrice(i.unit_price)}`;
      }),
    '',
    `Total unidades: ${totalUnits}`,
    `Total estimado: ${formatPrice(totalAmount)}`,
  ];
  return lines.join('\n');
}

export default function WholesalePortal() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderItemsById, setOrderItemsById] = useState({});

  const plan = normalizePlan(profile?.wholesale_plan);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getWholesaleProducts();
        if (!cancelled) {
          setProducts(list);
          setQuantities(
            list.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
          );
        }
      } catch (e) {
        if (!cancelled) setMessage({ type: 'error', text: e.message || 'Error al cargar productos' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    (async () => {
      setOrdersLoading(true);
      try {
        const list = await getMyWholesaleOrders(user.id);
        if (!cancelled) setOrders(list);
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const setQty = (productId, value) => {
    const n = Math.max(0, parseInt(value, 10) || 0);
    setQuantities((prev) => ({ ...prev, [productId]: n }));
  };

  const items = products.map((p) => ({
    product_id: p.id,
    quantity: quantities[p.id] || 0,
    unit_price: priceForPlan(p, plan),
  }));
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const handleSave = async () => {
    const toSave = items.filter((i) => i.quantity > 0);
    if (toSave.length === 0) {
      setMessage({ type: 'error', text: 'Agregá al menos un producto' });
      return;
    }
    setSaveLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await saveWholesaleOrder(
        user.id,
        { full_name: profile?.full_name, email: user?.email },
        plan,
        toSave
      );
      setMessage({ type: 'success', text: 'Pedido guardado correctamente' });

      const list = await getMyWholesaleOrders(user.id);
      setOrders(list);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Error al guardar' });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="w-16 h-0.5 bg-[rgb(0,255,255)] mb-6" />
        <h1 className="text-3xl sm:text-4xl font-heading tracking-wider mb-2">Portal mayorista</h1>
        <p className="text-white/70 mb-10">
          Tu plan: <strong>{planLabel(plan)}</strong>
        </p>

        {/* 3 planes: solo el asignado activo, el resto bloqueado */}
        <div className="grid gap-4 md:grid-cols-3 mb-12">
          {WHOLESALE_PLANS_LANDING.map((p) => {
            const isActive = p.key === plan;
            return (
              <div
                key={p.key}
                className={`border rounded-lg p-4 ${
                  isActive
                    ? "border-[rgb(0,255,255)] bg-white/5"
                    : "border-white/15 bg-white/[0.02] opacity-50 pointer-events-none"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-heading tracking-wider">{p.title}</h2>
                  {!isActive && (
                    <span className="text-xs uppercase text-white/50 border border-white/20 px-2 py-0.5 rounded">
                      No disponible
                    </span>
                  )}
                  {isActive && (
                    <span className="text-xs uppercase text-[rgb(0,255,255)]">Activo</span>
                  )}
                </div>
                <p className="text-white/60 text-sm">{p.discount} · {p.unitsRange}</p>
              </div>
            );
          })}
        </div>

        {/* Listado productos */}
        <div className="border border-white/20 rounded-lg overflow-hidden mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/20 bg-white/5">
                <th className="px-4 py-3 text-sm font-medium text-white/80">Producto</th>
                <th className="px-4 py-3 text-sm font-medium text-white/80 text-right">Precio</th>
                <th className="px-4 py-3 text-sm font-medium text-white/80 text-right w-28">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-white/50 text-sm">
                    No hay productos cargados.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="border-b border-white/10">
                    <td className="px-4 py-3 text-white">{p.name}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white/40 line-through text-xs mr-2">
                        {formatPrice(getRetailPrice(p))}
                      </span>
                      <span style={{ color: PLAN_COLORS[plan] || "#fff", fontWeight: 600 }}>
                        {formatPrice(priceForPlan(p, plan))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setQty(p.id, (quantities[p.id] || 0) - 1)}
                          className="w-8 h-8 rounded border border-white/30 flex items-center justify-center hover:bg-white/10 text-sm"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          value={quantities[p.id] || 0}
                          onChange={(e) => setQty(p.id, e.target.value)}
                          className="w-14 bg-white/5 border border-white/20 rounded px-2 py-1 text-center text-white text-sm focus:border-[rgb(0,255,255)] focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setQty(p.id, (quantities[p.id] || 0) + 1)}
                          className="w-8 h-8 rounded border border-white/30 flex items-center justify-center hover:bg-white/10 text-sm"
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen + acciones */}
        <div className="border border-white/20 rounded-lg p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-white/70 text-sm">Total unidades</p>
              <p className="text-xl font-heading text-white">{totalUnits}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm">Total estimado</p>
              <p className="text-xl font-heading text-[rgb(0,255,255)]">{formatPrice(totalAmount)}</p>
            </div>
          </div>
          {message.text && (
            <p
              className={`mt-4 text-sm ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'
                }`}
            >
              {message.text}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saveLoading || totalUnits === 0}
              onClick={handleSave}
              className="border border-[rgb(0,255,255)] text-white px-6 py-2 text-sm uppercase tracking-widest hover:bg-[rgb(0,255,255)]/10 disabled:opacity-50"
            >
              {saveLoading ? 'Guardando...' : 'Guardar pedido'}
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                buildWhatsAppText(items, products, plan, totalUnits, totalAmount)
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-emerald-500/60 text-emerald-400 px-6 py-2 text-sm uppercase tracking-widest hover:bg-emerald-500/10"
            >
              Enviar por WhatsApp
            </a>
          </div>
        </div>

        <div className="border border-white/20 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-heading tracking-wider mb-4">Mis pedidos guardados</h2>

          {ordersLoading ? (
            <p className="text-white/50 text-sm">Cargando…</p>
          ) : orders.length === 0 ? (
            <p className="text-white/50 text-sm">Todavía no tenés pedidos guardados.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="border border-white/10 rounded-lg p-4 bg-white/[0.02]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-white/70">
                      <span className="text-white">#{String(o.id).slice(0, 8)}</span> ·{" "}
                      {new Date(o.created_at).toLocaleString("es-AR")} · {o.status}
                      {o.wholesale_plan ? ` · ${planLabel(o.wholesale_plan)}` : ""}
                    </div>

                    <div className="text-sm text-[rgb(0,255,255)]">
                      {formatPrice(Number(o.total || 0))}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      className="text-xs uppercase tracking-widest border border-white/20 px-3 py-2 hover:bg-white/5"
                      onClick={async () => {
                        const next = expandedOrderId === o.id ? null : o.id;
                        setExpandedOrderId(next);

                        if (next && !orderItemsById[o.id]) {
                          const items = await getOrderItems(o.id);
                          setOrderItemsById((prev) => ({ ...prev, [o.id]: items }));
                        }
                      }}
                    >
                      {expandedOrderId === o.id ? "Ocultar items" : "Ver items"}
                    </button>
                  </div>

                  {expandedOrderId === o.id && (
                    <div className="mt-3 text-xs text-white/70 space-y-1">
                      {(orderItemsById[o.id] ?? []).map((it) => {
                        const p = products.find((x) => x.id === it.product_id);
                        return (
                          <div key={it.id} className="flex justify-between border-t border-white/5 pt-2">
                            <span>{p?.name ?? it.product_id}</span>
                            <span>{it.quantity} u × {formatPrice(Number(it.unit_price))}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <Link to="/" className="text-[rgb(0,255,255)] hover:underline text-sm tracking-widest">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
