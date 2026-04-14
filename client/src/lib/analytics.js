import { supabase } from "./supabaseClient";

const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|ia_archiver|sogou|exabot|mj12bot|ahrefsbot|semrushbot|dotbot|petalbot|bytespider|gptbot|headless|phantom|puppeteer|selenium|webdriver|prerender|lighthouse|pagespeed|pingdom|uptimerobot/i;

function isBot() {
    try {
        if (navigator.webdriver) return true;
    } catch { /* ignore */ }
    return BOT_RE.test(navigator.userAgent || "");
}

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

function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hasTrackedToday(storageKey, uniqueId) {
    const key = `sol_t:${storageKey}:${todayKey()}`;
    try {
        const stored = JSON.parse(localStorage.getItem(key) || "{}");
        if (stored[uniqueId]) return true;
        stored[uniqueId] = 1;
        localStorage.setItem(key, JSON.stringify(stored));
        for (const k of Object.keys(localStorage)) {
            if (k.startsWith("sol_t:") && k !== key) localStorage.removeItem(k);
        }
        return false;
    } catch {
        return false;
    }
}

function baseContext() {
    return {
        visitor_id: getOrSetUUID("sol_visitor_id"),
        session_id: getSessionId(),
        device: getDevice(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null,
        ...getUTM(),
    };
}

export async function trackPageView(path, title) {
    if (isBot()) return;

    const ctx = baseContext();

    if (hasTrackedToday("pv", `${ctx.visitor_id}:${path}`)) {
        // Aun si ya tracked el page_view, armar engagement (por si recarga o vuelve)
        armEngagementDetector();
        return;
    }

    supabase
        .from("analytics_events")
        .insert({
            ...ctx,
            event_name: "page_view",
            path,
            title: title || document.title,
        })
        .then(res => {
            if (res?.error) console.error('[analytics] page_view error:', res.error);
            else console.log('[analytics] page_view inserted');
        });

    armEngagementDetector();
}

let engagementArmed = false;
function armEngagementDetector() {
    console.log('[analytics] armEngagementDetector called, armed?', engagementArmed);
    if (engagementArmed) return;
    engagementArmed = true;

    const ctx = baseContext();
    const dayKey = `sol_engaged:${todayKey()}`;

    try {
        const seen = JSON.parse(localStorage.getItem(dayKey) || "{}");
        if (seen[ctx.visitor_id]) {
            console.log('[analytics] already engaged today, skipping');
            return;
        }
    } catch { /* ignore */ }

    let fired = false;
    const fire = () => {
        if (fired) return;
        fired = true;
        console.log('[analytics] ENGAGED firing');
        cleanup();

        try {
            const seen = JSON.parse(localStorage.getItem(dayKey) || "{}");
            seen[ctx.visitor_id] = 1;
            localStorage.setItem(dayKey, JSON.stringify(seen));
            for (const k of Object.keys(localStorage)) {
                if (k.startsWith("sol_engaged:") && k !== dayKey) localStorage.removeItem(k);
            }
        } catch { /* ignore */ }

        supabase
            .from("analytics_events")
            .insert({
                ...baseContext(),
                event_name: "engaged",
                path: window.location.pathname,
            })
            .then(res => {
                if (res?.error) console.error('[analytics] engaged error:', res.error);
                else console.log('[analytics] engaged inserted');
            });
    };

    const events = ["scroll", "click", "touchstart", "keydown", "pointerdown"];
    const opts = { passive: true, once: false };
    events.forEach(ev => window.addEventListener(ev, fire, opts));
    console.log('[analytics] engagement listeners attached');

    let visibleMs = 0;
    let lastTick = Date.now();
    const VISIBILITY_THRESHOLD = 10000;
    const interval = setInterval(() => {
        const now = Date.now();
        if (document.visibilityState === "visible") {
            visibleMs += now - lastTick;
            if (visibleMs >= VISIBILITY_THRESHOLD) fire();
        }
        lastTick = now;
    }, 1000);

    const cleanup = () => {
        events.forEach(ev => window.removeEventListener(ev, fire, opts));
        clearInterval(interval);
    };
}