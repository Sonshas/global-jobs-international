import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { EmployerJobStatus } from '@/data/employer';
import { useAdminJobActions, useAdminJobs, useCreateAdminJobMutation, useUpdateAdminJobMutation } from '@/hooks/queries/useJobsQueries';
import { logAudit } from '@/lib/security';

export function AdminJobsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const adminUserId = user?.id;
  const { data: jobs = [], isLoading } = useAdminJobs();
  const createMutation = useCreateAdminJobMutation(adminUserId);
  const updateMutation = useUpdateAdminJobMutation();
  const { setStatus, archive, duplicate, remove } = useAdminJobActions(adminUserId);
  const [title, setTitle] = useState('Factory Worker');
  const [company, setCompany] = useState('GJI Verified Employer');
  const [country, setCountry] = useState('Canada');

  const create = () => {
    void createMutation
      .mutateAsync({
        title,
        companyName: company,
        country,
        countryCode: 'ca',
        city: 'Toronto',
        salaryMonthly: 3800,
        currency: 'CAD',
        salaryLabel: 'CAD 3,800/month',
        jobType: 'Full-time',
        experience: '1+ years',
        education: 'High school',
        accommodation: true,
        visaSponsorship: true,
        medicalInsurance: true,
        transport: false,
        workingHours: '40 hours / week',
        contractDuration: '24 months',
        requirements: ['Passport', 'CV'],
        benefits: ['Visa sponsorship', 'Accommodation'],
        description: `Admin-posted role: ${title} in ${country}.`,
        applicationDeadline: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        maxApplicants: 50,
        status: 'Open',
        category: 'Manufacturing',
      })
      .then(() => {
        logAudit({ action: 'admin_job_created', detail: title });
      });
  };

  return (
    <DashboardShell title={t('admin.jobsTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">{t('admin.jobsTitle')}</h1>
      <p className="mt-2 text-sm text-ink-muted">{t('admin.jobsManageDesc')}</p>

      <section className="mt-8 rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold">{t('admin.quickCreate')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="quick-create-title" className="sr-only">
              {t('admin.jobTitlePlaceholder')}
            </label>
            <input
              id="quick-create-title"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm dark:border-border-dark"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('admin.jobTitlePlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="quick-create-company" className="sr-only">
              {t('admin.employerPlaceholder')}
            </label>
            <input
              id="quick-create-company"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm dark:border-border-dark"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t('admin.employerPlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="quick-create-country" className="sr-only">
              {t('admin.countryPlaceholder')}
            </label>
            <input
              id="quick-create-country"
              className="w-full rounded-xl border border-border px-3 py-2 text-sm dark:border-border-dark"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t('admin.countryPlaceholder')}
            />
          </div>
        </div>
        <Button type="button" className="mt-4 rounded-2xl" onClick={create} disabled={createMutation.isPending}>
          {t('dashboard.createJob')}
        </Button>
      </section>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted">{t('app.loading')}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {jobs.map((job) => (
            <li key={job.id} className="rounded-2xl border border-border/70 p-4 dark:border-border-dark">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-xs text-ink-muted">
                    {job.companyName} · {job.country} · {job.status}
                    {job.archived ? ` · ${t('admin.archivedSuffix')}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void setStatus.mutateAsync({ id: job.id, status: 'Open' as EmployerJobStatus })}>{t('dashboard.openJob')}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void setStatus.mutateAsync({ id: job.id, status: 'Closed' as EmployerJobStatus })}>{t('dashboard.closeJob')}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void duplicate.mutateAsync(job.id)}>{t('admin.duplicate')}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void archive.mutateAsync({ id: job.id, archived: !job.archived })}>{t('admin.archive')}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void updateMutation.mutateAsync({ id: job.id, patch: { applicationDeadline: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) } })}>{t('admin.setDeadline')}</Button>
                  <Button href={`/jobs/${job.id}`} size="sm">{t('common.preview')}</Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => void remove.mutateAsync(job.id)}>{t('common.delete')}</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
