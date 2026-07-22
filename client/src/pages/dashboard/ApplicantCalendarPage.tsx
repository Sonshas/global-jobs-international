import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';
import { useInterviewsForApplicant } from '@/hooks/queries/useInterviewsQueries';
import { resolveJobFromAllSources } from '@/repositories/jobs.repository';

const modeLabel: Record<string, string> = {
  video: 'Video call',
  phone: 'Phone call',
  in_person: 'In person',
  async: 'Async / recorded',
};

export function ApplicantCalendarPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: interviews = [], isLoading } = useInterviewsForApplicant(user?.id);

  const jobIds = useMemo(() => [...new Set(interviews.map((interview) => interview.jobId))], [interviews]);
  const { data: jobsById = {} } = useQuery({
    queryKey: ['calendar', 'jobs', jobIds],
    queryFn: async () => {
      const entries = await Promise.all(
        jobIds.map(async (id) => [id, await resolveJobFromAllSources(id).catch(() => null)] as const),
      );
      return Object.fromEntries(entries);
    },
    enabled: jobIds.length > 0,
  });

  const upcoming = useMemo(
    () =>
      [...interviews].sort(
        (a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime(),
      ),
    [interviews],
  );

  return (
    <DashboardShell title={t('nav.calendar')} adminLink>
      <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
        {t('dashboard.calendarEyebrow')}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('dashboard.upcomingInterviews')}
      </h1>
      <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">{t('dashboard.calendarDesc')}</p>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
      ) : upcoming.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('dashboard.noInterviewsScheduled')}</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {upcoming.map((interview) => {
            const job = jobsById[interview.jobId];
            const start = new Date(interview.scheduledStartAt);
            return (
              <article
                key={interview.id}
                className="rounded-3xl border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
                      {start.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}
                      {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <h2 className="mt-1 font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                      {job?.title ?? t('dashboard.interviewForApplication')}
                    </h2>
                    <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                      {job ? `${job.employer} · ${job.city}, ${job.country}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {modeLabel[interview.mode] ?? interview.mode}
                    </span>
                    <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold capitalize text-brand dark:text-brand-light">
                      {interview.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {interview.meetingUrl ? (
                  <a
                    href={interview.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm font-semibold text-brand hover:underline dark:text-brand-light"
                  >
                    {t('dashboard.joinMeeting')}
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
