import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import type { EmployerAccountStatus } from '@/data/employer';
import {
  useEmployerProfilesList,
  useSetEmployerAccountStatusMutation,
} from '@/hooks/queries/useEmployerQueries';
import { logAudit } from '@/lib/security';

export function AdminEmployersPage() {
  const { t } = useTranslation();
  const { data: employers = [], isLoading } = useEmployerProfilesList();
  const setStatusMutation = useSetEmployerAccountStatusMutation();

  const setStatus = (userId: string, status: EmployerAccountStatus) => {
    void setStatusMutation
      .mutateAsync({ userId, status })
      .then(() => {
        logAudit({ action: 'employer_status', detail: `${userId} → ${status}` });
      });
  };

  return (
    <DashboardShell title={t('admin.employersTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('admin.employersTitle')}
      </h1>
      <p className="mt-2 text-sm text-ink-muted">{t('admin.employersInactiveHint')}</p>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted">{t('common.loading')}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {employers.length === 0 ? (
            <li className="text-sm text-ink-muted">{t('admin.noEmployerProfiles')}</li>
          ) : (
            employers.map((employer) => (
              <li
                key={employer.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 p-4 dark:border-border-dark"
              >
                <div>
                  <p className="font-semibold">{employer.companyName}</p>
                  <p className="text-xs text-ink-muted">
                    {employer.country} · {employer.industry} · {t('admin.statusLabel')}{' '}
                    {employer.accountStatus || t('admin.legacyApproved')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={() => setStatus(employer.userId, 'approved')}>
                    {t('common.approve')}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setStatus(employer.userId, 'rejected')}>
                    {t('common.reject')}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setStatus(employer.userId, 'suspended')}>
                    {t('admin.suspend')}
                  </Button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </DashboardShell>
  );
}
