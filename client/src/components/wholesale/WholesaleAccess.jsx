import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function WholesaleAccess() {
  const navigate = useNavigate();
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

      // Mensaje más útil (sin inventar)
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

    // 1) Tenemos sesión: chequeamos profile para decidir si puede entrar al portal
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
      // Cortamos acceso al portal y cerramos sesión para evitar estados raros
      await supabase.auth.signOut();
      setMsg("Tu cuenta no está aprobada como mayorista todavía. Si te aprobaron, revisá el email de activación.");
      return;
    }

    navigate("/mayorista", { replace: true });
  };

  return (
    <section className="bg-black text-white py-16 md:py-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="border border-white/10 rounded-lg p-6 md:p-8 mb-12">
          <p className="text-white/70 text-sm md:text-base leading-relaxed">
            <strong className="text-white/90">Importante:</strong> Ambos tipos de revendedor tienen acceso al mismo descuento del
            40% sobre precios al público. La diferencia radica en el período de vigencia del acceso, los beneficios adicionales y
            los requisitos de permanencia. Nuestro equipo está disponible para ayudarte a elegir el programa que mejor se adapte a
            tus necesidades.
          </p>
        </div>

        <div className="border-t border-white/10 my-12" />

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 md:p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg className="w-6 h-6 text-white/90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="font-heading text-xl md:text-2xl font-semibold tracking-wider text-white">
              Acceso Mayorista
            </h3>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label htmlFor="wholesale-email" className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                Email
              </label>
              <input
                id="wholesale-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="wholesale-password" className="block text-xs uppercase tracking-widest text-white/60 mb-2">
                Contraseña
              </label>
              <input
                id="wholesale-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-body text-sm font-semibold uppercase tracking-widest py-4 rounded hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            {msg ? <p className="text-sm text-amber-300">{msg}</p> : null}
          </form>

          <div className="mt-6 border-t border-white/10 pt-6 text-center">
            <p className="text-white/60 text-sm mb-3">¿Querés registrarte como mayorista en Solution?</p>
            <Link
              to="/aplicar-mayorista"
              className="inline-flex items-center justify-center px-5 py-3 rounded bg-[rgb(0,255,255)] text-black font-semibold uppercase tracking-widest text-xs hover:opacity-90"
            >
              Aplicá aquí
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}