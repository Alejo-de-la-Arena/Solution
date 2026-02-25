import { useEffect, useMemo, useState } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";

import {
    getSummaryToday,
    getTopPages7d,
    getSessionsLast7d,
    getRecentVisitors,
    getVisitorTimeline,
} from "../../lib/adminAnalytics";

import "./adminUsuarios.css";

function timeAgo(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 10) return "recién";
    if (s < 60) return `hace ${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m}m`;
    const h = Math.floor(m / 60);
    return `hace ${h}h`;
}

function humanPath(path) {
    if (!path) return "Página";
    if (path === "/") return "Inicio";
    if (path.startsWith("/tienda")) return "Tienda";
    if (path.startsWith("/acceso")) return "Acceso";
    if (path.startsWith("/checkout")) return "Checkout";
    if (path.startsWith("/programa-mayorista")) return "Programa mayorista";
    if (path.startsWith("/aplicar-mayorista")) return "Aplicar mayorista";
    if (path.startsWith("/producto/")) {
        const slug = path.replace("/producto/", "");
        const nice = slug.replaceAll("-", " ");
        return `Producto: ${nice}`;
    }
    return path;
}

function humanReferrer(ref) {
    if (!ref) return "—";
    try {
        const u = new URL(ref);
        const host = u.hostname.replace("www.", "");
        if (host.includes("instagram")) return "Instagram";
        if (host.includes("facebook")) return "Facebook";
        if (host.includes("google")) return "Google";
        return host;
    } catch {
        return ref;
    }
}

function maskVisitor(visitorId) {
    // “Usuario #xxxx” estable pero no técnico: últimos 4 del uuid
    const s = String(visitorId || "");
    const last = s.slice(-4).toUpperCase();
    return `Usuario #${last || "—"}`;
}

export default function AdminUsuarios() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [sessionsToday, setSessionsToday] = useState(0);
    const [visitorsToday, setVisitorsToday] = useState(0);
    const [topPages, setTopPages] = useState([]);
    const [chartData, setChartData] = useState([]);

    const [recentVisitors, setRecentVisitors] = useState([]);
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

    const updatedLabel = useMemo(() => {
        if (!lastUpdatedAt) return "";
        return `Actualizado ${timeAgo(Date.now() - lastUpdatedAt)}`;
    }, [lastUpdatedAt]);

    useEffect(() => {
        let mounted = true;

        async function run() {
            try {
                setLoading(true);
                setError("");

                const [summary, top, chart, visitors] = await Promise.all([
                    getSummaryToday(),
                    getTopPages7d(10),
                    getSessionsLast7d(),
                    getRecentVisitors(20),
                ]);

                if (!mounted) return;

                setSessionsToday(Number(summary.sessions_today || 0));
                setVisitorsToday(Number(summary.visitors_today || 0));
                setTopPages(top);
                setChartData(chart);
                setRecentVisitors(visitors);
                setLastUpdatedAt(Date.now());
            } catch (e) {
                if (!mounted) return;
                setError(e?.message || "Error cargando usuarios");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        run();
        return () => {
            mounted = false;
        };
    }, []);

    async function openVisitor(visitor) {
        setSelectedVisitor(visitor);
        setTimeline([]);
        setTimelineLoading(true);

        try {
            const data = await getVisitorTimeline(visitor.visitor_id, 80);
            setTimeline(data);
        } catch (e) {
            // si falla, mostramos vacío (no rompemos)
            setTimeline([e]);
        } finally {
            setTimelineLoading(false);
        }
    }

    function closeDrawer() {
        setSelectedVisitor(null);
        setTimeline([]);
    }

    return (
        <div className="admin-users">
            <div className="admin-users__header">
                <div>
                    <h1 className="admin-users__title">Usuarios</h1>
                    <p className="admin-users__subtitle">
                        Tráfico y actividad.
                    </p>
                </div>
                <div className="admin-users__updated">{loading ? "Cargando…" : updatedLabel}</div>
            </div>

            {error ? (
                <div className="admin-section" style={{ borderColor: "rgba(255,77,79,0.6)" }}>
                    {error}
                </div>
            ) : null}

            {/* Chart */}
            <div className="admin-section">
                <h3 className="admin-section__title">Sesiones (últimos 7 días)</h3>
                {loading ? (
                    <div>…</div>
                ) : (
                    <div style={{ width: "100%", height: 240 }}>
                        <ResponsiveContainer>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }} />
                                <YAxis tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="sessions" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Metrics */}
            <div className="admin-cards-2">
                <div className="admin-metric">
                    <div className="admin-metric__label">Sesiones hoy</div>
                    <div className="admin-metric__value">{loading ? "…" : sessionsToday}</div>
                </div>

                <div className="admin-metric">
                    <div className="admin-metric__label">Visitantes únicos hoy</div>
                    <div className="admin-metric__value">{loading ? "…" : visitorsToday}</div>
                </div>
            </div>

            <div className="admin-grid-2">
                {/* Top pages */}
                <div className="admin-section">
                    <h3 className="admin-section__title">Top páginas (7 días)</h3>

                    {loading ? (
                        <div>…</div>
                    ) : topPages.length ? (
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {topPages.map((p) => (
                                <li key={p.path} style={{ marginBottom: 8 }}>
                                    <span style={{ fontWeight: 700 }}>{humanPath(p.path)}</span>
                                    <span style={{ opacity: 0.6 }}> — {p.views}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div style={{ opacity: 0.7 }}>Sin datos todavía</div>
                    )}
                </div>

                {/* Recent visitors (cards) */}
                <div className="admin-section">
                    <h3 className="admin-section__title">Usuarios recientes</h3>

                    {loading ? (
                        <div>…</div>
                    ) : recentVisitors.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                            {recentVisitors.map((u) => (
                                <div
                                    key={u.visitor_id}
                                    className="user-card"
                                    onClick={() => openVisitor(u)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <div className="user-card__top">
                                        <div className="user-chip">{maskVisitor(u.visitor_id)}</div>
                                        <div className="user-chip">{u.device || "-"}</div>
                                    </div>

                                    <div className="user-card__title">{humanPath(u.last_path)}</div>

                                    <div className="user-card__meta">
                                        <span>Origen: {humanReferrer(u.referrer)}</span>
                                        <span>Sesiones: {u.sessions}</span>
                                        <span>Páginas: {u.pageviews}</span>
                                        <span>
                                            Última vez: {new Date(u.last_seen).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ opacity: 0.7 }}>Sin actividad todavía</div>
                    )}
                </div>
            </div>

            {/* Drawer timeline */}
            {selectedVisitor ? (
                <div className="drawer">
                    <div className="drawer__header">
                        <div>
                            <div className="drawer__title">{maskVisitor(selectedVisitor.visitor_id)}</div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                                Origen: {humanReferrer(selectedVisitor.referrer)} · {selectedVisitor.device || "-"}
                            </div>
                        </div>
                        <button className="drawer__close" onClick={closeDrawer}>
                            Cerrar
                        </button>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
                        Sesiones (7 días): {selectedVisitor.sessions} · Páginas vistas: {selectedVisitor.pageviews}
                    </div>

                    <h4 style={{ margin: "12px 0", fontWeight: 800 }}>
                        Actividad (últimos eventos)
                    </h4>

                    {timelineLoading ? (
                        <div>…</div>
                    ) : timeline.length ? (
                        timeline.map((e, idx) => (
                            <div key={`${e.created_at}-${idx}`} className="timeline-item">
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                                        {new Date(e.created_at).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: 12, opacity: 0.7 }}>{e.device || "-"}</div>
                                </div>
                                <div style={{ marginTop: 6, fontWeight: 800 }}>
                                    {humanPath(e.path)}
                                </div>
                                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                                    Origen: {humanReferrer(e.referrer)}
                                </div>

                                {/* técnico escondido */}
                                <details style={{ marginTop: 8 }}>
                                    <summary style={{ cursor: "pointer", fontSize: 12, opacity: 0.6 }}>
                                        Ver detalles técnicos
                                    </summary>
                                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                                        session {String(e.session_id).slice(0, 8)}
                                    </div>
                                </details>
                            </div>
                        ))
                    ) : (
                        <div style={{ opacity: 0.7 }}>Sin eventos todavía</div>
                    )}
                </div>
            ) : null}
        </div>
    );
}