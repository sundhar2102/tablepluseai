import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute — redirects to login if not authenticated.
 * ProtectedRoute + role check — redirects to /unauthorized if wrong role.
 */

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show nothing while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="spinner w-10 h-10 border-[3px]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to appropriate login based on path
    const loginPath = location.pathname.startsWith('/owner')
      ? '/owner/login'
      : location.pathname.startsWith('/admin')
        ? '/admin/login'
        : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
