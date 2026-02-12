import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

const SITE_URL = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const EMAIL_REDIRECT_TO = `${SITE_URL}/auth/callback`;

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resending, setResending] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendMessage('');
    setSubmitting(true);
    try {
      const data = await signUp(email, password, {
        userMetadata: { full_name: fullName || null },
        emailRedirectTo: EMAIL_REDIRECT_TO,
      });
      if (data.session) {
        navigate('/', { replace: true });
        return;
      }
      setConfirmSent(true);
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendMessage('');
    setResending(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: EMAIL_REDIRECT_TO },
      });
      if (resendError) throw resendError;
      setResendMessage('Email reenviado. Revisá tu bandeja y SPAM.');
    } catch (err) {
      setResendMessage(err.message || 'No se pudo reenviar.');
    } finally {
      setResending(false);
    }
  };

  if (confirmSent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-0.5 bg-[rgb(0,255,255)] mb-8 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-heading tracking-wider mb-6">Revisá tu email</h1>
          <p className="text-white/80 leading-relaxed mb-8">
            Te enviamos un email para confirmar tu cuenta. Revisá tu bandeja de entrada y también <strong>SPAM / Promociones</strong>.
          </p>
          {resendMessage && (
            <p className={`text-sm mb-6 ${resendMessage.startsWith('Email') ? 'text-[rgb(0,255,255)]' : 'text-red-300'}`}>
              {resendMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="border border-[rgb(0,255,255)] text-white py-3 px-6 tracking-widest text-sm uppercase hover:bg-[rgb(0,255,255)]/10 disabled:opacity-50 transition-all mb-8"
          >
            {resending ? 'Enviando...' : 'Reenviar email'}
          </button>
          <p className="text-white/60 text-sm">
            <Link to="/login" className="text-[rgb(0,255,255)] hover:underline">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="w-16 h-0.5 bg-[rgb(0,255,255)] mb-8 mx-auto" />
        <h1 className="text-3xl sm:text-4xl font-heading tracking-wider text-center mb-2">Crear cuenta</h1>
        <p className="text-white/60 text-center text-sm mb-10">Unite a SOLUTION</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded border border-red-500/50 bg-red-500/10 text-red-200 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="fullName" className="block text-sm tracking-wide text-white/80 mb-2">
              Nombre (opcional)
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none transition-colors"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm tracking-wide text-white/80 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm tracking-wide text-white/80 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none transition-colors"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-[rgb(0,255,255)] text-white py-3 px-6 tracking-widest text-sm uppercase hover:bg-[rgb(0,255,255)]/10 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="mt-8 text-center text-white/60 text-sm">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-[rgb(0,255,255)] hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
