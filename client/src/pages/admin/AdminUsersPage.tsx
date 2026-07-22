import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { assignUserRole, listAllUsers, setUserStatus } from '@/repositories/admin-users.repository';
import { logAudit } from '@/lib/security';

const ROLE_OPTIONS = ['applicant', 'employer', 'advisor', 'admin', 'super_admin'] as const;

export function AdminUsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => listAllUsers(),
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const onAssignRole = async (userId: string, roleSlug: string) => {
    setError(null);
    setBusyId(userId);
    try {
      await assignUserRole(userId, roleSlug);
      logAudit({ action: 'assign_user_role', detail: `${userId} → ${roleSlug}` });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign role.');
    } finally {
      setBusyId(null);
    }
  };

  const onSetStatus = async (userId: string, status: 'active' | 'suspended') => {
    setError(null);
    setBusyId(userId);
    try {
      await setUserStatus(userId, status);
      logAudit({ action: 'user_status', detail: `${userId} → ${status}` });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user status.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardShell title={t('admin.usersTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">{t('admin.usersTitle')}</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">{t('admin.usersDesc')}</p>
      {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted">{t('common.loading')}</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-3xl border border-border/70 bg-white/85 dark:border-border-dark dark:bg-slate-900/55">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 text-xs font-semibold tracking-wide text-ink-muted uppercase dark:border-border-dark">
              <tr>
                <th className="px-4 py-3">{t('common.email')}</th>
                <th className="px-4 py-3">{t('common.name')}</th>
                <th className="px-4 py-3">{t('admin.accountType')}</th>
                <th className="px-4 py-3">{t('common.status')}</th>
                <th className="px-4 py-3">{t('admin.roles')}</th>
                <th className="px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-border-dark">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.fullName || '—'}</td>
                  <td className="px-4 py-3 capitalize">{user.accountType}</td>
                  <td className="px-4 py-3 capitalize">{user.status}</td>
                  <td className="px-4 py-3">{user.roles.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        className="h-8 rounded-lg border border-border bg-[var(--bg)] px-2 text-xs dark:border-border-dark"
                        disabled={busyId === user.id}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) void onAssignRole(user.id, e.target.value);
                          e.target.value = '';
                        }}
                      >
                        <option value="">{t('admin.assignRole')}</option>
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      {user.status === 'suspended' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === user.id}
                          onClick={() => void onSetStatus(user.id, 'active')}
                        >
                          {t('admin.reactivate')}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busyId === user.id}
                          onClick={() => void onSetStatus(user.id, 'suspended')}
                        >
                          {t('admin.suspend')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
