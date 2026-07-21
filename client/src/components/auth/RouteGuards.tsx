import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute() {
  const { loading, isAuthenticated, isEmailVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Checking your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const { loading, isAuthenticated, isEmailVerified } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Loading…</p>
      </div>
    );
  }

  if (isAuthenticated && isEmailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}
