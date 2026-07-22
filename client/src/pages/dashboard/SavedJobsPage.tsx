import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useSavedJobs, useToggleSavedJobMutation } from '@/hooks/queries/useSavedJobsQueries';

export function SavedJobsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: savedJobs = [], isLoading } = useSavedJobs(user?.id);
  const toggleMutation = useToggleSavedJobMutation(user?.id);

  return (
    <DashboardShell title={t('nav.savedJobs')} adminLink>
      <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
        {t('dashboard.savedJobsEyebrow')}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('nav.savedJobs')}
      </h1>
      <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">{t('dashboard.savedJobsDesc')}</p>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
      ) : savedJobs.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('dashboard.noSavedJobs')}</p>
          <Button href="/jobs" className="mt-4 rounded-2xl">
            {t('common.browseJobs')}
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {savedJobs.map((entry) => (
            <article
              key={entry.id}
              className="rounded-3xl border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                    {entry.job?.title ?? t('dashboard.jobNoLongerAvailable')}
                  </h2>
                  {entry.job ? (
                    <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                      {entry.job.employer} · {entry.job.city}, {entry.job.country}
                    </p>
                  ) : null}
                  {entry.job ? (
                    <p className="mt-2 text-sm font-semibold text-brand dark:text-brand-light">
                      {entry.job.salaryLabel}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.job ? (
                    <Button href={`/jobs/${entry.job.id}`} variant="outline" className="rounded-2xl">
                      {t('common.details')}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-2xl"
                    disabled={toggleMutation.isPending}
                    onClick={() => void toggleMutation.mutateAsync(entry.jobId)}
                  >
                    {t('dashboard.removeSavedJob')}
                  </Button>
                </div>
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
