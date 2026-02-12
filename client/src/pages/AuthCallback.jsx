import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function AuthCallback() {
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();
  const cleanupRef = useRef(null);

  useEffect(() => {
    const ensureProfile = async (user) => {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email ?? undefined,
          full_name: user.user_metadata?.full_name ?? null,
          role: 'retail',
          wholesale_status: 'none',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    };

    const hashParams = new URLSearchParams(window.location.hash?.slice(1) || '');
    const queryParams = new URLSearchParams(window.location.search);
    const errorParam = queryParams.get('error') || hashParams.get('error');
    const code = queryParams.get('code');

    if (errorParam) {
      setStatus('error');
      return;
    }

    let timeoutId;
    let sub;

    const done = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (sub?.unsubscribe) sub.unsubscribe();
    };

    const doRedirect = (user) => {
      ensureProfile(user).then(() => navigate('/', { replace: true }));
    };

    (async () => {
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus('error');
          return;
        }
        if (data?.user) {
          doRedirect(data.user);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        doRedirect(session.user);
        return;
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
        if (event === 'SIGNED_IN' && s?.user) {
          doRedirect(s.user);
        }
      });
      sub = subscription;

      timeoutId = setTimeout(() => {
        setStatus('error');
      }, 4000);
    })().catch(() => setStatus('error'));

    cleanupRef.current = done;
    return () => {
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-0.5 bg-red-500/80 mb-8 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-heading tracking-wider mb-6">No pudimos confirmar tu cuenta</h1>
          <p className="text-white/70 mb-10">
            El enlace pudo haber expirado o ya fue usado. Probá iniciar sesión o registrarte de nuevo.
          </p>
          <Link
            to="/login"
            className="inline-block border border-[rgb(0,255,255)] text-white py-3 px-8 tracking-widest text-sm uppercase hover:bg-[rgb(0,255,255)]/10 transition-all"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-[rgb(0,255,255)] rounded-full animate-spin mx-auto mb-6" />
        <p className="text-white/70">Confirmando tu cuenta...</p>
      </div>
    </div>
  );
}
