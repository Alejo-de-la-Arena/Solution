import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Rutas públicas que redirigen a home si ya está logueado (ej: /login, /register).
 */
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    const from = location.state?.from?.pathname ?? '/';
    return <Navigate to={from} replace />;
  }

  return children;
}
