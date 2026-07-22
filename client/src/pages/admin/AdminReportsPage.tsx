import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { getAdminReports } from '@/data/admin-reports';

export function AdminReportsPage() {
  const { t } = useTranslation();
  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => getAdminReports(),
  });

  if (isLoading || !reports) {
    return (
      <DashboardShell title={t('admin.reportsTitle')} adminLink>
        <p className="text-sm text-ink-muted">{t('common.loading')}</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={t('admin.reportsTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('admin.reportsTitle')}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [t('admin.revenueEst'), reports.revenue],
          [t('admin.interviewSuccess'), reports.interviewSuccessRate],
          [t('admin.visaSuccess'), reports.visaSuccessRate],
          [t('admin.travelSuccess'), reports.travelSuccessRate],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55">
            <p className="text-xs font-semibold uppercase text-ink-muted">{label}</p>
            <div className="mt-2">
              <AnimatedCounter value={Number(value)} suffix={String(label).includes('success') ? '%' : ''} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ReportList title={t('admin.applicationsByCountry')} rows={reports.applicationsByCountry} />
        <ReportList title={t('admin.applicationsByMonth')} rows={reports.applicationsByMonth} />
        <ReportList title={t('admin.topEmployers')} rows={reports.topEmployers} />
        <ReportList title={t('admin.topJobs')} rows={reports.topJobs} />
      </div>
    </DashboardShell>
  );
}

function ReportList({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <section className="rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map(([name, count]) => (
          <li key={name} className="flex justify-between gap-3">
            <span>{name}</span>
            <span className="font-semibold">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
