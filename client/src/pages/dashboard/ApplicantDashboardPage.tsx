import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  formatCvPrice,
  getCvPreparationPrice,
  getCvOrderFromPayments,
} from '@/data/cv-services';
import { getUserApplicationStats } from '@/data/applications';
import { useApplicationsForUser } from '@/hooks/queries/useApplicationsQueries';
import { useUnreadMessageCount } from '@/hooks/queries/useMessagingQueries';
import {
  buildApplicantProgress,
  VISA_TRACKER_STEPS,
  visaProgressPercent,
} from '@/data/recruitment-pipeline';
import { useApplicantDocuments } from '@/hooks/queries/useDocumentsQueries';
import { computeProfileCompletion } from '@/lib/profile-completion';

export function ApplicantDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const fullName =
    typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : user?.email?.split('@')[0] || 'Applicant';

  const hasCv = user?.user_metadata?.has_cv;
  const needsCvOffer = hasCv === 'no' || hasCv === false;
  const countryOfResidence =
    typeof user?.user_metadata?.country_of_residence === 'string'
      ? user.user_metadata.country_of_residence
      : undefined;
  const price = useMemo(() => getCvPreparationPrice(countryOfResidence), [countryOfResidence]);
  const { data: cvOrder = null } = useQuery({
    queryKey: ['cv-order', user?.id],
    queryFn: () => getCvOrderFromPayments(user!.id),
    enabled: Boolean(user?.id),
  });
  const { data: userApps = [], isLoading: appsLoading } = useApplicationsForUser(user?.id);
  const { data: applicantDocs = [] } = useApplicantDocuments(user?.id);
  const stats = getUserApplicationStats(userApps);
  const { data: unreadMessages = 0 } = useUnreadMessageCount(user?.id);
  const messages = unreadMessages;
  const recentApps = userApps.slice(0, 3);
  const profileCompletion = useMemo(
    () =>
      computeProfileCompletion({
        user,
        documents: applicantDocs,
        applicationCount: userApps.length,
        cvPaid: cvOrder?.status === 'completed',
      }).percent,
    [user, applicantDocs, userApps.length, cvOrder?.status],
  );
  const progress = user ? buildApplicantProgress(user, userApps, applicantDocs) : null;
  const latestVisaPct = progress?.latest ? visaProgressPercent(progress.latest.id, userApps) : 0;
  const latestVisa = progress?.latest ? progress.latest.visaTracker : null;

  return (
    <DashboardShell title={t('dashboard.applicantTitle')} adminLink>
      <div className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
          {t('dashboard.welcome')}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-ink sm:text-4xl dark:text-ink-dark">
          {fullName}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-muted dark:text-ink-muted-dark">
          {t('dashboard.trackProgress')}
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {appsLoading ? (
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark sm:col-span-2 xl:col-span-4">
            {t('common.loading')}
          </p>
        ) : null}
        {[
          [t('dashboard.profileCompletion'), `${profileCompletion}%`],
          [t('dashboard.applicationsSubmitted'), String(stats.submitted)],
          [t('dashboard.applicationsApproved'), String(stats.approved)],
          [t('dashboard.interviewsScheduled'), String(stats.interviews)],
          [t('dashboard.pendingReview'), String(stats.pendingReview)],
          [t('dashboard.messages'), String(messages)],
          [t('dashboard.documents'), String(stats.documents)],
          [
            t('dashboard.cvStatus'),
            needsCvOffer
              ? cvOrder?.status?.replace('_', ' ') || 'Payment required'
              : 'On file',
          ],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-3xl border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
          >
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark">
              {label}
            </p>
            <p className="mt-2 font-heading text-2xl font-bold capitalize text-ink dark:text-ink-dark">
              {value}
            </p>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55">
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark">
          {t('dashboard.quickLinks')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button href="/dashboard/saved-jobs" variant="outline" size="sm" className="rounded-xl">
            {t('nav.savedJobs')}
          </Button>
          <Button href="/dashboard/messages" variant="outline" size="sm" className="rounded-xl">
            {t('nav.messages')}
          </Button>
          <Button href="/dashboard/calendar" variant="outline" size="sm" className="rounded-xl">
            {t('nav.calendar')}
          </Button>
          <Button href="/dashboard/applications" variant="outline" size="sm" className="rounded-xl">
            {t('nav.applications')}
          </Button>
          <Button href="/dashboard/documents" variant="outline" size="sm" className="rounded-xl">
            {t('nav.documents')}
          </Button>
          <Button href="/dashboard/settings" variant="outline" size="sm" className="rounded-xl">
            {t('nav.settings')}
          </Button>
        </div>
      </section>

      {needsCvOffer && (!cvOrder || cvOrder.status === 'none' || cvOrder.status === 'offered') ? (
        <section className="mb-6 overflow-hidden rounded-3xl border border-accent/40 bg-gradient-to-br from-brand/15 via-white to-accent/15 p-6 shadow-lg dark:border-accent/30 dark:from-brand/25 dark:via-surface-elevated-dark dark:to-accent/10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
                {t('dashboard.cvPrepRequired')}
              </p>
              <h2 className="mt-2 font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                You registered without a CV — prepare a professional CV for {formatCvPrice(price)}
              </h2>
              <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                Charged in your Country of Residence currency ({price.countryName}
                {price.countryName === 'Kenya' ? ' · KES 3,000 base' : ''}).
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Button href="/dashboard/cv-payment" className="rounded-2xl">
                {t('dashboard.pay')} {formatCvPrice(price)}
              </Button>
              <Button href="/dashboard/cv-preparation" variant="outline" className="rounded-2xl">
                {t('dashboard.viewCvDetails')}
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {cvOrder && (cvOrder.status === 'pending_payment' || cvOrder.status === 'in_progress') ? (
        <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                CV order in progress
              </h2>
              <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                Status:{' '}
                {cvOrder.status === 'pending_payment' ? 'Awaiting payment' : 'Being prepared'}
              </p>
            </div>
            <Button
              href={
                cvOrder.status === 'pending_payment'
                  ? '/dashboard/cv-payment'
                  : '/dashboard/cv-status'
              }
              className="rounded-2xl"
            >
              View status
            </Button>
          </div>
        </section>
      ) : null}

      {progress ? (
        <section className="mb-6 rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                {t('dashboard.myProgress')}
              </h2>
              <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                Full recruitment pipeline from account creation through employment.
              </p>
            </div>
            <Button href="/dashboard/documents" variant="outline" size="sm" className="rounded-xl">
              {t('nav.documents')}
            </Button>
          </div>
          <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {progress.steps.map((step) => (
              <li
                key={step.label}
                className="flex items-center gap-2 rounded-2xl border border-border/60 px-3 py-2.5 text-sm dark:border-border-dark"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {step.done ? '✔' : '○'}
                </span>
                <span className="font-medium text-ink dark:text-ink-dark">{step.label}</span>
              </li>
            ))}
          </ol>

          {latestVisa ? (
            <div className="mt-6 rounded-2xl border border-border/60 p-4 dark:border-border-dark">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-ink dark:text-ink-dark">Visa Status</span>
                <span className="text-ink-muted dark:text-ink-muted-dark">{latestVisaPct}%</span>
              </div>
              <div className="mb-3 flex gap-1">
                {VISA_TRACKER_STEPS.map((step) => (
                  <div
                    key={step}
                    className={`h-2.5 flex-1 rounded-sm ${
                      latestVisa[step] ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    title={step}
                  />
                ))}
              </div>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                {VISA_TRACKER_STEPS.filter((step) => latestVisa[step]).join(' · ') ||
                  'No visa milestones completed yet'}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
              {t('dashboard.recentApplications')}
            </h2>
            <Link
              to="/dashboard/applications"
              className="text-sm font-semibold text-brand hover:underline dark:text-brand-light"
            >
              {t('common.viewAll')}
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted dark:text-ink-muted-dark">
              {t('dashboard.noApplications')}{' '}
              <Link to="/jobs" className="font-semibold text-brand hover:underline">
                {t('common.browseJobs')}
              </Link>
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentApps.map((app) => (
                <li key={app.id} className="rounded-2xl border border-border/60 px-4 py-3 dark:border-border-dark">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink dark:text-ink-dark">{app.jobTitle}</p>
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                        {app.country} · {app.applicationNumber} · {app.currentStage}
                      </p>
                    </div>
                    <Button href={`/dashboard/applications/${app.id}`} size="sm" variant="outline">
                      {t('common.details')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
          <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
            {t('dashboard.documentVisaProgress')}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-ink-muted dark:text-ink-muted-dark">
            <li>Passport — {stats.documents > 0 ? 'Uploaded with applications' : 'Pending upload'}</li>
            <li>CV — {needsCvOffer ? (cvOrder ? 'In preparation / paid' : 'Payment required') : 'On file'}</li>
            <li>Medical — Starts after interview stage</li>
            <li>Police Clearance — Starts after medical stage</li>
            <li>Visa Progress — {latestVisaPct}% on latest application</li>
            <li>Payment Status — CV {cvOrder ? cvOrder.status.replace('_', ' ') : 'not started'}</li>
          </ul>
          <Button href="/dashboard/documents" variant="outline" className="mt-5 w-full rounded-2xl">
            {t('dashboard.openDocumentsVault')}
          </Button>
          <Button href="/jobs" className="mt-3 w-full rounded-2xl">
            {t('dashboard.applyForJob')}
          </Button>
        </section>
      </div>
    </DashboardShell>
  );
}
