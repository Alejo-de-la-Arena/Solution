import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Solo role === 'admin'. Redirige a /login o / según corresponda.
 */
export function RoleRoute({ children, role = 'admin' }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/acceso" replace />;
  if (profile?.role !== role) return <Navigate to="/" replace />;

  return children;
}
