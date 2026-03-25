import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { AnimatePresence, motion } from "motion/react";
import { useScrollMotion } from "../../hooks/useScrollMotion";

export default function WholesaleAccess() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const { ref, reducedMotion, premiumEasing } = useScrollMotion();

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
    <section
      ref={ref}
      className="relative bg-black text-white py-12 md:py-16 px-4 border-t border-white/10 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[55vw] h-[35vh] rounded-full blur-[90px] bg-[rgb(0,255,255)] opacity-10" />
        <div className="absolute -bottom-28 left-[-10%] w-[60vw] h-[35vh] rounded-full blur-[120px] bg-[rgb(255,0,255)] opacity-8" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto text-center">
        <p className="text-white/60 text-sm mb-3">¿Ya sos mayorista?</p>

        <motion.button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          whileHover={
            reducedMotion
              ? undefined
              : {
                  y: -2,
                  boxShadow: "0 0 28px rgba(0,255,255,0.12)",
                }
          }
          transition={{ duration: 0.25, ease: premiumEasing }}
          className="border border-white/30 px-6 py-2 text-sm uppercase tracking-widest text-white/90 hover:bg-white/5 transition-colors rounded-xl"
        >
          {expanded ? "Ocultar" : "Iniciá sesión"}
        </motion.button>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              transition={{ duration: 0.5, ease: premiumEasing }}
              className="mt-8 bg-white/5 border border-white/10 rounded-[28px] p-6 md:p-7 text-left backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="font-heading text-lg font-semibold tracking-wider text-white">
                  Acceso Mayorista
                </h3>
                <span
                  className="h-px w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-70"
                  aria-hidden
                />
              </div>

              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <label
                    htmlFor="wholesale-email"
                    className="block text-xs uppercase tracking-widest text-white/60 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="wholesale-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-2 focus:ring-[rgb(0,255,255)]/20 transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="wholesale-password"
                    className="block text-xs uppercase tracking-widest text-white/60 mb-1"
                  >
                    Contraseña
                  </label>
                  <input
                    id="wholesale-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none focus:ring-2 focus:ring-[rgb(0,255,255)]/20 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-animated-gradient-wholesale text-white font-heading text-sm font-semibold uppercase tracking-widest py-3.5 rounded-xl hover:shadow-[0_0_40px_rgba(255,0,255,0.20)] disabled:opacity-60 disabled:cursor-not-allowed transition-[box-shadow,transform] duration-300"
                >
                  {loading ? "Ingresando..." : "Ingresar"}
                </button>

                {msg ? <p className="text-sm text-[rgb(255,215,0)] leading-relaxed">{msg}</p> : null}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
