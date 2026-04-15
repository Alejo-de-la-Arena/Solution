/**
 * Meta Pixel helpers — wrapper seguro sobre window.fbq.
 * Si fbq no está cargado (ad-blocker, etc.) no rompe nada.
 *
 * Cada evento incluye:
 *  - value y currency siempre que aplique (Meta los exige para Purchase, ViewContent, etc.)
 *  - eventID único para dedup futuro con Conversions API
 *
 * Guards estrictos: si falta data crítica, NO disparamos el evento.
 * Mejor un evento perdido que uno con value=0 (que Meta marcaría como error).
 */

function fbq(eventType, eventName, params, options) {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    if (import.meta.env.DEV) {
        console.log("[fbq]", eventType, eventName, params, options);
    }
    if (options) {
        window.fbq(eventType, eventName, params, options);
    } else if (params) {
        window.fbq(eventType, eventName, params);
    } else {
        window.fbq(eventType, eventName);
    }
}

function newEventId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function trackPageView() {
    fbq("track", "PageView", undefined, { eventID: newEventId("pv") });
}

export function trackViewContent({ name, id, price, currency = "ARS" }) {
    if (!id) return;
    fbq("track", "ViewContent", {
        content_name: name,
        content_ids: [String(id)],
        content_type: "product",
        value: Number(price) || 0,
        currency,
    }, { eventID: newEventId(`vc_${id}`) });
}

export function trackAddToCart({ name, id, price, currency = "ARS", quantity = 1 }) {
    if (!id) return;
    fbq("track", "AddToCart", {
        content_name: name,
        content_ids: [String(id)],
        content_type: "product",
        value: (Number(price) || 0) * quantity,
        currency,
        contents: [{ id: String(id), quantity }],
    }, { eventID: newEventId(`atc_${id}`) });
}

export function trackInitiateCheckout({ items, totalValue, currency = "ARS" }) {
    if (!items || items.length === 0) return;
    if (!totalValue || Number(totalValue) <= 0) return;
    fbq("track", "InitiateCheckout", {
        content_ids: items.map((i) => String(i.id)),
        contents: items.map((i) => ({ id: String(i.id), quantity: i.quantity })),
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        value: Number(totalValue),
        currency,
    }, { eventID: newEventId("ic") });
}

/**
 * IMPORTANTE: disparar SOLO en confirmación de orden exitosa.
 * eventID = `purchase_${orderId}` permite a Meta deduplicar si el usuario recarga.
 */
export function trackPurchase({ orderId, totalValue, items, currency = "ARS" }) {
    if (!orderId) return;
    if (!items || items.length === 0) return;
    if (!totalValue || Number(totalValue) <= 0) return;

    fbq("track", "Purchase", {
        content_ids: items.map((i) => String(i.id)),
        contents: items.map((i) => ({ id: String(i.id), quantity: i.quantity })),
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        value: Number(totalValue),
        currency,
        order_id: String(orderId),
    }, { eventID: `purchase_${orderId}` });
}