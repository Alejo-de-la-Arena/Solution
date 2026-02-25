import { supabase } from "./supabaseClient";

export async function getSummaryToday() {
    const { data, error } = await supabase.rpc("analytics_summary_today");
    if (error) throw error;
    // data viene como array con 1 fila
    return data?.[0] || { sessions_today: 0, visitors_today: 0 };
}

export async function getTopPages7d(limit = 10) {
    const { data, error } = await supabase.rpc("analytics_top_pages_7d", { limit_n: limit });
    if (error) throw error;
    return data || [];
}

export async function getRecentActivity(limit = 25) {
    const { data, error } = await supabase.rpc("analytics_recent_activity", { limit_n: limit });
    if (error) throw error;
    return data || [];
}

export async function getSessionsLast7d() {
    const { data, error } = await supabase.rpc("analytics_sessions_last_7d");
    if (error) throw error;
    return data || [];
}

export async function getRecentVisitors(limit = 20) {
    const { data, error } = await supabase.rpc("analytics_recent_visitors", {
        limit_n: limit,
    });
    if (error) throw error;
    return data || [];
}

export async function getVisitorTimeline(visitorId, limit = 50) {
    const { data, error } = await supabase.rpc("analytics_visitor_timeline", {
        visitor_uuid: visitorId,
        limit_n: limit,
    });
    if (error) throw error;
    return data || [];
}