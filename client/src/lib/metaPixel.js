/**
 * Meta Pixel helpers — wrapper seguro sobre window.fbq.
 * Si fbq no está cargado (ad-blocker, etc.) no rompe nada.
 */

function fbq(...args) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq(...args);
    }
}

export function trackPageView() {
    fbq("track", "PageView");
}

export function trackViewContent({ name, id, price, currency = "ARS" }) {
    fbq("track", "ViewContent", {
        content_name: name,
        content_ids: [id],
        content_type: "product",
        value: price,
        currency,
    });
}

export function trackInitiateCheckout({ items, totalValue, currency = "ARS" }) {
    fbq("track", "InitiateCheckout", {
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        value: totalValue,
        currency,
    });
}

export function trackPurchase({ orderId, totalValue, items, currency = "ARS" }) {
    fbq("track", "Purchase", {
        content_ids: items.map((i) => i.id),
        contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        value: totalValue,
        currency,
        order_id: orderId,
    });
}
