// client/src/pages/SetPassword.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function parseHashTokens() {
    const hash = window.location.hash?.startsWith("#")
        ? window.location.hash.slice(1)
        : "";

    const params = new URLSearchParams(hash);

    const access_token = params.get("access_token") || "";
    const refresh_token = params.get("refresh_token") || "";
    const type = params.get("type") || ""; // "invite" o "recovery" etc.

    return { access_token, refresh_token, type };
}

export default function SetPassword() {
    const navigate = useNavigate();

    const [phase, setPhase] = useState("boot"); // boot | ready | saving | done | error
    const [errorMsg, setErrorMsg] = useState("");

    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");

    const tokens = useMemo(() => parseHashTokens(), []);

    useEffect(() => {
        let cancelled = false;

        async function boot() {
            setErrorMsg("");

            // 1) Si ya hay sesión, no dependemos del hash (por si el user refrescó)
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session) {
                if (!cancelled) setPhase("ready");
                return;
            }

            // 2) Si no hay sesión, el invite viene en el HASH (access_token/refresh_token)
            if (!tokens.access_token || !tokens.refresh_token) {
                if (!cancelled) {
                    setPhase("error");
                    setErrorMsg(
                        "Link inválido o expirado. Pedí al administrador que reenvíe la invitación."
                    );
                }
                return;
            }

            const { error } = await supabase.auth.setSession({
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
            });

            if (error) {
                if (!cancelled) {
                    setPhase("error");
                    setErrorMsg(
                        error.message ||
                        "No se pudo validar el link. Pedí al administrador que reenvíe la invitación."
                    );
                }
                return;
            }

            // Limpieza estética: si querés que no queden tokens en la URL
            try {
                window.history.replaceState({}, document.title, "/set-password");
            } catch { }

            if (!cancelled) setPhase("ready");
        }

        boot();
        return () => {
            cancelled = true;
        };
    }, [tokens.access_token, tokens.refresh_token]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        if (password.length < 8) {
            setErrorMsg("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (password !== password2) {
            setErrorMsg("Las contraseñas no coinciden.");
            return;
        }

        setPhase("saving");

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setPhase("ready");
            setErrorMsg(error.message || "No se pudo actualizar la contraseña.");
            return;
        }

        // IMPORTANT: el flujo que querés es “seteo contraseña” -> “login normal”
        // Entonces cerramos sesión y lo mandamos a /programa-mayorista (WholesaleAccess).
        await supabase.auth.signOut();

        setPhase("done");
        navigate("/programa-mayorista?password_set=1", { replace: true });
    };

    return (
        <section className="bg-black text-white py-16 md:py-24 px-4">
            <div className="max-w-xl mx-auto">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8">
                    <h1 className="text-xl md:text-2xl font-semibold tracking-wider">
                        Crear contraseña
                    </h1>

                    {phase === "boot" ? (
                        <p className="mt-4 text-white/70">Validando invitación…</p>
                    ) : null}

                    {phase === "error" ? (
                        <p className="mt-4 text-amber-300">{errorMsg}</p>
                    ) : null}

                    {phase === "ready" || phase === "saving" ? (
                        <form className="mt-6 space-y-5" onSubmit={onSubmit}>
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                                    Nueva contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white focus:border-[rgb(0,255,255)] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                                    Repetir contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password2}
                                    onChange={(e) => setPassword2(e.target.value)}
                                    className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white focus:border-[rgb(0,255,255)] focus:outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={phase === "saving"}
                                className="w-full bg-white text-black font-semibold uppercase tracking-widest text-xs py-4 rounded disabled:opacity-60"
                            >
                                {phase === "saving" ? "Guardando…" : "Guardar contraseña"}
                            </button>

                            {errorMsg ? (
                                <p className="text-sm text-amber-300">{errorMsg}</p>
                            ) : null}
                        </form>
                    ) : null}
                </div>
            </div>
        </section>
    );
}