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

// ── Atribución: persistencia de fbclid / _fbc / _fbp ─────────────────────
const ATTR_FBCLID = 'meta_attr_fbclid';
const ATTR_FBCLID_TS = 'meta_attr_fbclid_ts';
const ATTR_FBC = 'meta_attr_fbc';
const ATTR_FBP = 'meta_attr_fbp';

function _getCookie(name) {
    try {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + escaped + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : null;
    } catch { return null; }
}

function _setCookieLax(name, value, days) {
    try {
        const exp = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp}; path=/; SameSite=Lax`;
    } catch { /* ignore */ }
}

/**
 * Captura fbclid de la URL actual y _fbc/_fbp de las cookies, y los guarda en
 * localStorage como respaldo.
 * Llamar en cada cambio de ruta (usePageTracking) y antes de cualquier redirect externo.
 */
export function captureAttributionData() {
    if (typeof window === 'undefined') return;
    try {
        const url = new URL(window.location.href);
        const fbclid = url.searchParams.get('fbclid');
        if (fbclid) {
            localStorage.setItem(ATTR_FBCLID, fbclid);
            localStorage.setItem(ATTR_FBCLID_TS, String(Date.now()));
        }
        const fbc = _getCookie('_fbc');
        if (fbc) localStorage.setItem(ATTR_FBC, fbc);
        const fbp = _getCookie('_fbp');
        if (fbp) localStorage.setItem(ATTR_FBP, fbp);
    } catch { /* ignore */ }
}

/**
 * Restaura las cookies _fbc y _fbp desde localStorage si fueron eliminadas
 * (iOS ITP, navegación incógnito, etc.).
 * Llamar ANTES de disparar cualquier evento Purchase.
 */
export function restoreAttributionCookies() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
        if (!_getCookie('_fbc')) {
            const saved = localStorage.getItem(ATTR_FBC);
            if (saved) {
                _setCookieLax('_fbc', saved, 90);
            } else {
                const fbclid = localStorage.getItem(ATTR_FBCLID);
                const ts = localStorage.getItem(ATTR_FBCLID_TS);
                if (fbclid && ts) _setCookieLax('_fbc', `fb.1.${ts}.${fbclid}`, 90);
            }
        }
        if (!_getCookie('_fbp')) {
            const saved = localStorage.getItem(ATTR_FBP);
            if (saved) _setCookieLax('_fbp', saved, 90);
        }
    } catch { /* ignore */ }
}

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