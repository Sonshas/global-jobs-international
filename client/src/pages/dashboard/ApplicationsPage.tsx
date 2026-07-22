import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { relativeTime } from '@/data/applications';
import { useApplicationsForUser } from '@/hooks/queries/useApplicationsQueries';

export function ApplicationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: apps = [], isLoading } = useApplicationsForUser(user?.id);

  return (
    <DashboardShell title={t('nav.applications')} adminLink>
      <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
        {t('dashboard.applicationsTitle')}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('dashboard.applicationTracking')}
      </h1>
      <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">
        {t('dashboard.trackApplicationsDesc')}
      </p>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
      ) : apps.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
            {t('dashboard.noApplicationsSubmitted')}
          </p>
          <Button href="/jobs" className="mt-4 rounded-2xl">
            {t('common.browseJobs')}
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {apps.map((app) => (
            <article
              key={app.id}
              className="rounded-3xl border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                    {app.jobTitle}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                    {app.country} · {app.applicationNumber}
                  </p>
                  <p className="mt-2 text-sm font-semibold capitalize text-brand dark:text-brand-light">
                    {app.status.replace('_', ' ')} · {app.currentStage}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">
                    {t('dashboard.submittedAgo', { time: relativeTime(app.createdAt) })}
                  </p>
                </div>
                <Button href={`/dashboard/applications/${app.id}`} className="rounded-2xl">
                  {t('dashboard.viewDetails')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm">
        <Link to="/dashboard" className="font-semibold text-brand hover:underline dark:text-brand-light">
          {t('dashboard.backToDashboardLink')}
        </Link>
      </p>
    </DashboardShell>
  );
}
