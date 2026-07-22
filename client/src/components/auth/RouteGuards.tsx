import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useRbac } from '@/hooks/useRbac';
import {
  canAccessAdmin,
  canAccessEmployer,
  canAccessStaff,
  canAccessSuperAdmin,
} from '@/lib/security';
import { safeRedirect } from '@/lib/safe-redirect';

function GuardLoading() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('app.loading')}</p>
    </div>
  );
}

export function ProtectedRoute() {
  const { t } = useTranslation();
  const { loading, isAuthenticated, isEmailVerified } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('app.checkingSession')}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/login?redirect=${encodeURIComponent(from)}`} replace state={{ from }} />
    );
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}

/** Staff + admin + super_admin — pipeline / operational admin pages. */
export function AdminRoute() {
  const { user, loading } = useAuth();
  const { data: rbac, isLoading: rbacLoading } = useRbac(user?.id);

  if (loading || rbacLoading) return <GuardLoading />;
  if (!canAccessAdmin(user, rbac ?? null)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

/** Advisor / staff only (also allows admin/super_admin). */
export function StaffRoute() {
  const { user, loading } = useAuth();
  const { data: rbac, isLoading: rbacLoading } = useRbac(user?.id);

  if (loading || rbacLoading) return <GuardLoading />;
  if (!canAccessStaff(user, rbac ?? null)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

/** Super Admin control plane. */
export function SuperAdminRoute() {
  const { user, loading } = useAuth();
  const { data: rbac, isLoading: rbacLoading } = useRbac(user?.id);

  if (loading || rbacLoading) return <GuardLoading />;
  if (!canAccessSuperAdmin(user, rbac ?? null)) {
    return <Navigate to="/admin/applications" replace />;
  }
  return <Outlet />;
}

export function EmployerRoute() {
  const { user, loading } = useAuth();
  const { data: rbac, isLoading: rbacLoading } = useRbac(user?.id);

  if (loading || rbacLoading) return <GuardLoading />;
  if (!canAccessEmployer(user, rbac ?? null)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

export function GuestRoute() {
  const { t } = useTranslation();
  const { loading, isAuthenticated, isEmailVerified } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('app.loading')}</p>
      </div>
    );
  }

  const fromState =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : null;

  const redirect = safeRedirect(params.get('redirect') || fromState);

  if (isAuthenticated && isEmailVerified) {
    return <Navigate to={redirect} replace />;
  }

  if (isAuthenticated && !isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
}
