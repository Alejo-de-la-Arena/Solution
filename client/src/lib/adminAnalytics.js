import { supabase } from "./supabaseClient";

function cleanPath(path) {
    if (!path) return "/";
    const idx = path.indexOf("?");
    return idx === -1 ? path : (path.slice(0, idx) || "/");
}

/** YYYY-MM-DD en la zona horaria del navegador (alineado con "hoy" del resumen). */
function localDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function startOfDayISO(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.toISOString();
}

function startOfTodayISO() {
    return startOfDayISO(new Date());
}

function startOfTomorrowISO() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function daysAgoISO(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

/** Días calendario locales desde hoy hacia atrás (incluye hoy): [oldest, ..., today]. */
function localDateRangeKeys(numDays) {
    const keys = [];
    for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(12, 0, 0, 0);
        keys.push(localDateKey(d));
    }
    return keys;
}

export async function getSummaryToday() {
    const { data, error } = await supabase
        .from("analytics_events")
        .select("visitor_id")
        .gte("created_at", startOfTodayISO())
        .lt("created_at", startOfTomorrowISO())
        .eq("event_name", "page_view");

    if (error) throw error;

    const visitors = new Set();
    for (const r of data || []) visitors.add(r.visitor_id);

    return { visitors_today: visitors.size };
}

export async function getTopPages7d(limit = 10) {
    const { data, error } = await supabase
        .from("analytics_events")
        .select("path, visitor_id")
        .gte("created_at", daysAgoISO(7))
        .eq("event_name", "page_view");

    if (error) throw error;

    const map = {};
    for (const r of data || []) {
        const p = cleanPath(r.path);
        if (!map[p]) map[p] = new Set();
        map[p].add(r.visitor_id);
    }

    return Object.entries(map)
        .map(([path, vis]) => ({ path, views: vis.size }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
}

export async function getVisitorsLastNDays(days = 7) {
    const { data, error } = await supabase
        .from("analytics_events")
        .select("created_at, visitor_id")
        .gte("created_at", daysAgoISO(days))
        .eq("event_name", "page_view");

    if (error) throw error;

    const map = {};
    for (const r of data || []) {
        const day = localDateKey(new Date(r.created_at));
        if (!map[day]) map[day] = new Set();
        map[day].add(r.visitor_id);
    }

    const range = localDateRangeKeys(days);
    return range.map((day) => ({
        day,
        visitors: map[day] ? map[day].size : 0,
    }));
}

export async function getRecentVisitors(limit = 20) {
    const { data, error } = await supabase
        .from("analytics_events")
        .select("visitor_id, session_id, path, referrer, device, created_at")
        .gte("created_at", daysAgoISO(7))
        .eq("event_name", "page_view")
        .order("created_at", { ascending: false })
        .limit(5000);

    if (error) throw error;

    const map = {};
    for (const r of data || []) {
        const vid = r.visitor_id;
        if (!map[vid]) {
            map[vid] = {
                visitor_id: vid,
                last_path: cleanPath(r.path),
                referrer: r.referrer,
                device: r.device,
                last_seen: r.created_at,
                _sessions: new Set(),
                pageviews: 0,
            };
        }
        map[vid]._sessions.add(r.session_id);
        map[vid].pageviews++;
    }

    return Object.values(map)
        .map(({ _sessions, ...rest }) => ({ ...rest, sessions: _sessions.size }))
        .sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))
        .slice(0, limit);
}

export async function getVisitorTimeline(visitorId, limit = 50) {
    const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("visitor_id", visitorId)
        .eq("event_name", "page_view")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) throw error;

    return (data || []).map(r => ({ ...r, path: cleanPath(r.path) }));
}
