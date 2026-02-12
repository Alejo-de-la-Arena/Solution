import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Solo wholesale_status === 'approved' o role === 'admin'.
 * Redirige a / si no cumple; si no está logueado, a /login.
 */
export function WholesaleRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/acceso" replace />;
  const isWholesale = profile?.role === 'wholesale' && profile?.wholesale_status === 'approved';
  if (!isWholesale && profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
