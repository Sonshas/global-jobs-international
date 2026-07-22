import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { type StageStatus } from '@/data/applications';
import { useApplication } from '@/hooks/queries/useApplicationsQueries';
import {
  ensureApplicationTimeline,
  VISA_TRACKER_STEPS,
  visaProgressPercent,
  type TimelineEvent,
} from '@/data/recruitment-pipeline';
import { useApplicantDocuments } from '@/hooks/queries/useDocumentsQueries';

const stageStyles: Record<StageStatus | 'waiting', string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  waiting: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function ApplicationDetailPage() {
  const { t } = useTranslation();
  const { applicationId } = useParams();
  const { user } = useAuth();
  const { data: app, isLoading } = useApplication(applicationId);
  const { data: applicantDocs = [] } = useApplicantDocuments(user?.id);

  if (isLoading) {
    return (
      <DashboardShell title={t('dashboard.applicationDetails')} adminLink>
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('app.loading')}</p>
      </DashboardShell>
    );
  }

  if (!app) return <Navigate to="/dashboard/applications" replace />;
  if (user?.id && app.userId !== user.id) {
    return <Navigate to="/dashboard/applications" replace />;
  }

  const timeline = ensureApplicationTimeline(app);
  const visa = app.visaTracker;
  const visaPct = visaProgressPercent(app.id, [app]);
  const yesNo = (value: boolean) => (value ? t('common.yes') : t('common.no'));

  return (
    <DashboardShell title={t('dashboard.applicationDetails')} adminLink>
      <Link
        to="/dashboard/applications"
        className="text-sm font-semibold text-brand hover:underline dark:text-brand-light"
      >
        {t('dashboard.allApplications')}
      </Link>

      <div className="mt-6 rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55">
        <p className="text-xs font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
          {app.applicationNumber}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
          {app.jobTitle}
        </h1>
        <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">
          {app.employer} · {app.city}, {app.country}
        </p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label={t('common.status')} value={app.status.replace('_', ' ')} />
          <Info label={t('dashboard.currentStage')} value={app.currentStage} />
          <Info label={t('common.salary')} value={app.salaryLabel} />
          <Info label={t('common.applicant')} value={app.profile.fullName} />
          <Info label={t('common.email')} value={app.profile.email} />
          <Info label={t('common.phone')} value={app.profile.phone} />
          <Info
            label={t('dashboard.documents')}
            value={t('dashboard.documentsOnApplication', { count: app.documents.length })}
          />
          <Info label={t('jobs.visaSponsorship')} value={yesNo(app.visaSponsorship)} />
          <Info label={t('jobs.accommodation')} value={yesNo(app.accommodation)} />
        </dl>

        <h2 className="mt-8 font-heading text-xl font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.visaStatus')}
        </h2>
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-muted dark:text-ink-muted-dark">{t('dashboard.progress')}</span>
            <span className="font-semibold text-ink dark:text-ink-dark">{visaPct}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
              style={{ width: `${visaPct}%` }}
            />
          </div>
          <ol className="mt-4 space-y-2">
            {VISA_TRACKER_STEPS.map((step) => (
              <li
                key={step}
                className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-2.5 text-sm dark:border-border-dark"
              >
                <span className="font-medium text-ink dark:text-ink-dark">{step}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    visa[step]
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {visa[step] ? t('dashboard.done') : t('dashboard.waiting')}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <h2 className="mt-8 font-heading text-xl font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.applicantTimeline')}
        </h2>
        <ol className="mt-4 space-y-3">
          {timeline.map((event) => (
            <TimelineRow key={event.id} event={event} />
          ))}
        </ol>

        <h2 className="mt-8 font-heading text-xl font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.documents')}
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {applicantDocs.map((doc) => (
            <li
              key={doc.kind}
              className="rounded-2xl border border-border/60 px-4 py-3 text-sm dark:border-border-dark"
            >
              <span className="font-semibold capitalize text-ink dark:text-ink-dark">
                {doc.kind.replace(/_/g, ' ')}
              </span>
              <span className="ml-2 text-ink-muted dark:text-ink-muted-dark">{doc.status}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            href={`/dashboard/messages?applicationId=${app.id}`}
            variant="outline"
            className="rounded-2xl sm:flex-1"
          >
            {t('dashboard.messageEmployer')}
          </Button>
          <Button href="/dashboard/documents" variant="outline" className="rounded-2xl sm:flex-1">
            {t('dashboard.manageDocuments')}
          </Button>
          <Button href={`/jobs/${app.jobId}`} variant="outline" className="rounded-2xl sm:flex-1">
            {t('dashboard.viewJob')}
          </Button>
          <Button href="/dashboard" className="rounded-2xl sm:flex-1">
            {t('nav.dashboard')}
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const { t } = useTranslation();
  const date = new Date(event.at);
  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 dark:border-border-dark">
      <div>
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark">
          {date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className="mt-1 font-medium text-ink dark:text-ink-dark">{event.label}</p>
        {event.note ? (
          <p className="mt-1 text-xs text-ink-muted dark:text-ink-muted-dark">{event.note}</p>
        ) : null}
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${stageStyles[event.status]}`}
      >
        {event.status === 'waiting' ? t('dashboard.waiting') : event.status.replace('_', ' ')}
      </span>
    </li>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-950/40">
      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 font-semibold capitalize text-ink dark:text-ink-dark">{value}</dd>
    </div>
  );
}
