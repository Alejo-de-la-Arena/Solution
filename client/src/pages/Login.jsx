import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="w-16 h-0.5 bg-[rgb(0,255,255)] mb-8 mx-auto" />
        <h1 className="text-3xl sm:text-4xl font-heading tracking-wider text-center mb-2">Iniciar sesión</h1>
        <p className="text-white/60 text-center text-sm mb-10">Accedé a tu cuenta SOLUTION</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded border border-red-500/50 bg-red-500/10 text-red-200 text-sm">
              {error}
            </div>
          )}
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
              className="w-full bg-white/5 border border-white/20 rounded px-4 py-3 text-white placeholder-white/40 focus:border-[rgb(0,255,255)] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-[rgb(0,255,255)] text-white py-3 px-6 tracking-widest text-sm uppercase hover:bg-[rgb(0,255,255)]/10 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-8 text-center text-white/60 text-sm">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="text-[rgb(0,255,255)] hover:underline">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  );
}
