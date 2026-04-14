import { supabase } from "./supabaseClient";

function cleanPath(path) {
    if (!path) return "/";
    const idx = path.indexOf("?");
    return idx === -1 ? path : (path.slice(0, idx) || "/");
}

export async function getSummaryToday() {
    const { data, error } = await supabase.rpc("analytics_summary_today");
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return {
        visitors_today: row?.visitors_today ?? 0,
        pageviews_today: row?.pageviews_today ?? 0,
    };
}

export async function getVisitorsLastNDays(days = 7) {
    const { data, error } = await supabase.rpc("analytics_visitors_last_n_days", { days });
    if (error) throw error;
    return (data || []).map(r => ({
        day: typeof r.day === "string" ? r.day : new Date(r.day).toISOString().slice(0, 10),
        visitors: Number(r.visitors) || 0,
    }));
}

export async function getTopPages7d(limit = 10) {
    const { data, error } = await supabase.rpc("analytics_top_pages", { days: 7, lim: limit });
    if (error) throw error;
    return (data || []).map(r => ({
        path: cleanPath(r.path),
        views: Number(r.views) || 0,
    }));
}

export async function getRecentVisitors(limit = 20) {
    // Solo visitors con 'engaged' reciente — humanos de verdad
    const { data: engagedRows, error: e1 } = await supabase
        .from("analytics_events")
        .select("visitor_id, created_at")
        .eq("event_name", "engaged")
        .eq("is_bot", false)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(limit * 3);

    if (e1) throw e1;

    const uniqueVisitors = [];
    const seen = new Set();
    for (const r of engagedRows || []) {
        if (seen.has(r.visitor_id)) continue;
        seen.add(r.visitor_id);
        uniqueVisitors.push(r.visitor_id);
        if (uniqueVisitors.length >= limit) break;
    }

    if (uniqueVisitors.length === 0) return [];

    // Traer detalles del último page_view de cada uno
    const { data: pvRows, error: e2 } = await supabase
        .from("analytics_events")
        .select("visitor_id, session_id, path, referrer, device, created_at")
        .in("visitor_id", uniqueVisitors)
        .eq("event_name", "page_view")
        .eq("is_bot", false)
        .order("created_at", { ascending: false });

    if (e2) throw e2;

    const byVisitor = {};
    for (const r of pvRows || []) {
        if (!byVisitor[r.visitor_id]) {
            byVisitor[r.visitor_id] = {
                visitor_id: r.visitor_id,
                last_path: cleanPath(r.path),
                referrer: r.referrer,
                device: r.device,
                last_seen: r.created_at,
                _sessions: new Set(),
                pageviews: 0,
            };
        }
        byVisitor[r.visitor_id]._sessions.add(r.session_id);
        byVisitor[r.visitor_id].pageviews++;
    }

    return uniqueVisitors
        .map(vid => byVisitor[vid])
        .filter(Boolean)
        .map(({ _sessions, ...rest }) => ({ ...rest, sessions: _sessions.size }));
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