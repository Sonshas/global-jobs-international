import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { listAuditLog } from '@/lib/security';

export function AdminAuditPage() {
  const { t } = useTranslation();
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin', 'audit-log'],
    queryFn: () => listAuditLog(200),
    refetchInterval: 30_000,
  });

  return (
    <DashboardShell title={t('admin.auditTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">{t('admin.auditTitle')}</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">{t('admin.auditDesc')}</p>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted">{t('common.loading')}</p>
      ) : entries.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">{t('admin.noAuditEntries')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-border/70 bg-white/85 dark:border-border-dark dark:bg-slate-900/55">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 text-xs font-semibold tracking-wide text-ink-muted uppercase dark:border-border-dark">
              <tr>
                <th className="px-4 py-3">{t('common.date')}</th>
                <th className="px-4 py-3">{t('admin.action')}</th>
                <th className="px-4 py-3">{t('common.details')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-border-dark">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 capitalize">{entry.action}</td>
                  <td className="px-4 py-3 text-ink-muted dark:text-ink-muted-dark">
                    {entry.description || '—'}
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
