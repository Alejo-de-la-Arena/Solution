import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function WholesaleAccess() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const trimmedEmail = email.trim();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (authError) {
      setLoading(false);
      const m = authError.message?.toLowerCase() || "";
      if (m.includes("invalid login credentials")) {
        setMsg("Email o contraseña incorrectos.");
        return;
      }
      if (m.includes("email not confirmed")) {
        setMsg("Tu cuenta todavía no fue activada. Revisá tu email de activación.");
        return;
      }
      setMsg(authError.message);
      return;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      setLoading(false);
      setMsg("No se pudo obtener el usuario de la sesión. Reintentá.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, wholesale_status")
      .eq("id", userId)
      .single();

    setLoading(false);

    if (profileError) {
      setMsg("No se pudo validar tu acceso. Reintentá en unos segundos.");
      return;
    }

    const isAdmin = profile?.role === "admin";
    const isWholesaleApproved = profile?.role === "wholesale" && profile?.wholesale_status === "approved";

    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    if (!isWholesaleApproved) {
      await supabase.auth.signOut();
      setMsg("Tu cuenta no está aprobada como mayorista todavía. Si te aprobaron, revisá el email de activación.");
      return;
    }

    navigate("/mayorista", { replace: true });
  };

  return (
    <section className="bg-black text-white py-12 md:py-16 px-4 border-t border-white/10">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-white/60 text-sm mb-3">¿Ya sos mayorista?</p>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="border border-white/30 px-6 py-2 text-sm uppercase tracking-widest text-white/90 hover:bg-white/5 transition-colors"
        >
          {expanded ? "Ocultar" : "Iniciá sesión"}
        </button>

        {expanded && (
          <div className="mt-8 bg-white/5 border border-white/10 rounded-lg p-6 text-left">
            <h3 className="font-heading text-lg font-semibold tracking-wider text-white mb-4">
              Acceso Mayorista
            </h3>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div>
                <label htmlFor="wholesale-email" className="block text-xs uppercase tracking-widest text-white/60 mb-1">
                  Email
                </label>
                <input
                  id="wholesale-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="wholesale-password" className="block text-xs uppercase tracking-widest text-white/60 mb-1">
                  Contraseña
                </label>
                <input
                  id="wholesale-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-body text-sm font-semibold uppercase tracking-widest py-3 rounded hover:bg-white/90 disabled:opacity-60"
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
              {msg ? <p className="text-sm text-amber-300">{msg}</p> : null}
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
