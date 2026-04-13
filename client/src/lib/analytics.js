import { supabase } from "./supabaseClient";

function getOrSetUUID(key) {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
}

function getSessionId() {
    const key = "sol_session_id";
    const tsKey = "sol_session_ts";
    const now = Date.now();
    const last = Number(sessionStorage.getItem(tsKey) || 0);

    if (!sessionStorage.getItem(key) || now - last > 30 * 60 * 1000) {
        sessionStorage.setItem(key, crypto.randomUUID());
    }
    sessionStorage.setItem(tsKey, String(now));
    return sessionStorage.getItem(key);
}

function getDevice() {
    return window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
}

function getUTM() {
    const sp = new URLSearchParams(window.location.search);
    return {
        utm_source: sp.get("utm_source"),
        utm_medium: sp.get("utm_medium"),
        utm_campaign: sp.get("utm_campaign"),
    };
}

const _trackedThisSession = new Set();

export async function trackPageView(path, title) {
    const visitor_id = getOrSetUUID("sol_visitor_id");
    const session_id = getSessionId();

    const dedupKey = `${visitor_id}:${session_id}:${path}`;
    if (_trackedThisSession.has(dedupKey)) return;
    _trackedThisSession.add(dedupKey);

    const payload = {
        visitor_id,
        session_id,
        event_name: "page_view",
        path,
        title: title || document.title,
        referrer: document.referrer || null,
        device: getDevice(),
        user_agent: navigator.userAgent,
        ...getUTM(),
    };

    supabase
        .from("analytics_events")
        .insert(payload)
        .then(() => { })
        .catch(() => { });
}
