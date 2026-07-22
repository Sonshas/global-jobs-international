import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  EMPLOYER_COUNTRIES,
  EMPLOYER_INDUSTRIES,
  fileToDataUrl,
  getEmployerStats,
  isEmployerAccountActive,
  listEmployerApplications,
  type EmployerJob,
  type EmployerJobStatus,
  type EmployerProfile,
  type HiringStatus,
} from '@/data/employer';
import type { JobApplication } from '@/data/applications';
import {
  employerRejectPatch,
  employerReviewPatch,
  employerShortlistPatch,
} from '@/data/applications';
import { useUpdateApplicationMutation } from '@/hooks/queries/useApplicationsQueries';
import { useEmployerProfile, useUpsertEmployerProfileMutation } from '@/hooks/queries/useEmployerQueries';
import {
  useCreateEmployerJobMutation,
  useDeleteJobMutation,
  useEmployerJobs,
  useUpdateEmployerJobMutation,
} from '@/hooks/queries/useJobsQueries';
import { queryKeys } from '@/repositories/query-keys';
import { REQUIRED_EVERY_COUNTRY_JOBS } from '@/data/jobs-catalog';
import {
  useCreateInterviewMutation,
  useInterviewsForEmployer,
} from '@/hooks/queries/useInterviewsQueries';
import { resolveInterviewContext } from '@/repositories/interviews.repository';
import { listMyPaymentRecords } from '@/repositories/payments.repository';
import { useGetOrCreateSupportConversationMutation } from '@/hooks/queries/useMessagingQueries';
import { useNavigate } from 'react-router-dom';

type Tab = 'overview' | 'profile' | 'jobs' | 'create' | 'applicants' | 'interviews' | 'billing';

const currencies = ['USD', 'CAD', 'AUD', 'GBP', 'EUR', 'AED', 'QAR', 'SAR', 'NZD', 'JPY', 'SGD', 'CHF', 'NOK', 'SEK', 'DKK', 'PLN', 'KWD', 'BHD', 'OMR'];

export function EmployerDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || '';
  const [tab, setTab] = useState<Tab>('overview');
  const getOrCreateSupportConversation = useGetOrCreateSupportConversationMutation();
  const openSupportChat = () => {
    if (!userId) return;
    void getOrCreateSupportConversation.mutateAsync({ employerUserId: userId }).then((conversation) => {
      navigate(`/dashboard/messages?conversationId=${conversation.id}`);
    });
  };
  const { data: profile = null, isLoading: profileLoading } = useEmployerProfile(userId || undefined);
  const { data: jobs = [], isLoading: jobsLoading } = useEmployerJobs(userId || undefined);
  const { data: stats = null, isLoading: statsLoading } = useQuery({
    queryKey: [...queryKeys.jobs.employer(userId), 'stats'],
    queryFn: () => getEmployerStats(userId),
    enabled: Boolean(userId),
  });
  const { data: employerApps = [], isLoading: appsLoading } = useQuery({
    queryKey: [...queryKeys.jobs.employer(userId), 'applications'],
    queryFn: () => listEmployerApplications(userId),
    enabled: Boolean(userId),
  });
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const dataLoading = profileLoading || jobsLoading || statsLoading || appsLoading;

  if (!userId) return null;

  return (
    <DashboardShell title={t('dashboard.employerTitle')} adminLink>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
            {t('dashboard.employerWorkspace')}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
            {profile?.companyName || t('dashboard.companyDashboard')}
          </h1>
          <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">
            {t('dashboard.employerManageDesc')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {profile?.verified ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold tracking-wide text-emerald-800 uppercase dark:bg-emerald-500/15 dark:text-emerald-300">
              {t('dashboard.verifiedEmployer')}
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold tracking-wide text-amber-800 uppercase dark:bg-amber-500/15 dark:text-amber-300">
              {t('dashboard.pendingVerification')}
            </span>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={getOrCreateSupportConversation.isPending}
            onClick={openSupportChat}
          >
            {t('dashboard.messageSupport')}
          </Button>
        </div>
      </div>

      {profile && !isEmployerAccountActive(profile) ? (
        <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {t('dashboard.pendingApprovalDetail', { status: profile.accountStatus || 'pending' })}
        </section>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['overview', t('dashboard.overview')],
            ['profile', t('dashboard.companyProfile')],
            ['jobs', t('dashboard.tabJobs')],
            ['applicants', t('dashboard.applicants')],
            ['interviews', t('dashboard.interviews')],
            ['billing', t('dashboard.billing')],
            ['create', editingJobId ? t('dashboard.editJob') : t('dashboard.createJob')],
          ] as const
        ).map(([id, label]) => {
          const createBlocked = id === 'create' && !editingJobId && profile && !isEmployerAccountActive(profile);
          return (
            <button
              key={id}
              type="button"
              disabled={Boolean(createBlocked)}
              title={createBlocked ? t('dashboard.pendingApprovalDetail', { status: profile?.accountStatus || 'pending' }) : undefined}
              onClick={() => {
                if (createBlocked) return;
                if (id === 'create') setEditingJobId(null);
                setTab(id);
              }}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                createBlocked
                  ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                  : tab === id
                    ? 'border-brand bg-brand text-white'
                    : 'border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {dataLoading && tab === 'overview' ? (
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
      ) : null}

      {tab === 'overview' && stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [t('dashboard.activeJobs'), stats.activeJobs],
            [t('dashboard.closedJobs'), stats.closedJobs],
            [t('dashboard.applicants'), stats.applicants],
            [t('dashboard.shortlisted'), stats.shortlisted],
            [t('dashboard.interviews'), stats.interviews],
            [t('dashboard.hired'), stats.hired],
            [t('dashboard.messages'), stats.messages],
            [t('dashboard.views'), stats.views],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
            >
              <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</p>
              <p className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">{value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'profile' ? (
        <EmployerProfileForm
          key={profile?.updatedAt ?? 'new-profile'}
          userId={userId}
          profile={profile}
          onSaved={() => setTab('overview')}
        />
      ) : null}

      {tab === 'jobs' ? (
        <EmployerJobsList
          jobs={jobs}
          userId={userId}
          onEdit={(job) => {
            setEditingJobId(job.id);
            setTab('create');
          }}
        />
      ) : null}

      {tab === 'applicants' ? (
        <EmployerApplicantsPanel apps={employerApps} employerUserId={userId} />
      ) : null}

      {tab === 'interviews' ? (
        <EmployerInterviewsPanel userId={userId} apps={employerApps} />
      ) : null}

      {tab === 'billing' ? <EmployerBillingPanel profile={profile} /> : null}

      {tab === 'create' ? (
        <EmployerJobForm
          userId={userId}
          profile={profile}
          jobId={editingJobId}
          jobs={jobs}
          onSaved={() => {
            setEditingJobId(null);
            setTab('jobs');
          }}
        />
      ) : null}
    </DashboardShell>
  );
}

function EmployerApplicantsPanel({ apps, employerUserId }: { apps: JobApplication[]; employerUserId: string }) {
  const { t } = useTranslation();
  const updateMutation = useUpdateApplicationMutation();
  const queryClient = useQueryClient();

  const applyPatch = async (app: JobApplication, patch: Parameters<typeof updateMutation.mutateAsync>[0]['patch']) => {
    await updateMutation.mutateAsync({ id: app.id, patch });
    await queryClient.invalidateQueries({
      queryKey: [...queryKeys.jobs.employer(employerUserId), 'applications'],
    });
  };
  const buckets = [
    {
      title: t('dashboard.applicants'),
      items: apps,
    },
    {
      title: t('dashboard.shortlisted'),
      items: apps.filter(
        (app) =>
          app.status === 'approved' ||
          app.currentStage === 'Shortlisted' ||
          app.stageStatuses.Shortlisted === 'completed',
      ),
    },
    {
      title: t('dashboard.interviewed'),
      items: apps.filter(
        (app) =>
          app.currentStage === 'Interview' ||
          app.stageStatuses.Interview === 'completed' ||
          app.stageStatuses.Interview === 'in_progress',
      ),
    },
    {
      title: t('dashboard.accepted'),
      items: apps.filter(
        (app) =>
          app.currentStage === 'Employment Started' ||
          app.stageStatuses['Employment Started'] === 'completed',
      ),
    },
    {
      title: t('dashboard.rejectedApplicants'),
      items: apps.filter((app) => app.status === 'rejected'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        {t('dashboard.employerMessagingNotice')}
      </div>
      {buckets.map((bucket) => (
        <section
          key={bucket.title}
          className="rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55"
        >
          <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
            {bucket.title}{' '}
            <span className="text-ink-muted dark:text-ink-muted-dark">({bucket.items.length})</span>
          </h2>
          {bucket.items.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted dark:text-ink-muted-dark">{t('dashboard.noApplicantsYet')}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60 dark:divide-border-dark">
              {bucket.items.map((app) => (
                <li
                  key={`${bucket.title}-${app.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-ink dark:text-ink-dark">
                      {app.profile.fullName}
                    </p>
                    <p className="text-ink-muted dark:text-ink-muted-dark">
                      {app.jobTitle} · {app.country} · {app.applicationNumber}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {app.currentStage}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateMutation.isPending}
                      onClick={() => void applyPatch(app, employerReviewPatch(app))}
                    >
                      {t('dashboard.employerReview')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={updateMutation.isPending}
                      onClick={() => void applyPatch(app, employerShortlistPatch(app))}
                    >
                      {t('dashboard.shortlisted')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={updateMutation.isPending}
                      onClick={() => void applyPatch(app, employerRejectPatch(app))}
                    >
                      {t('common.reject')}
                    </Button>
                    <Button
                      href={`/dashboard/messages?applicationId=${app.id}`}
                      size="sm"
                      variant="ghost"
                    >
                      {t('dashboard.messageApplicant')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function EmployerInterviewsPanel({ userId, apps }: { userId: string; apps: JobApplication[] }) {
  const { t } = useTranslation();
  const { data: interviews = [], isLoading } = useInterviewsForEmployer(userId);
  const createInterview = useCreateInterviewMutation();
  const [applicationId, setApplicationId] = useState('');
  const [startAt, setStartAt] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const applicationById = useMemo(() => new Map(apps.map((app) => [app.id, app])), [apps]);

  const onSchedule = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!applicationId || !startAt) {
      setFormError(t('dashboard.selectApplicationAndTime'));
      return;
    }
    try {
      const context = await resolveInterviewContext(applicationId);
      if (!context) throw new Error('Could not resolve application context.');
      const scheduledStartAt = new Date(startAt).toISOString();
      const scheduledEndAt = new Date(new Date(scheduledStartAt).getTime() + 60 * 60 * 1000).toISOString();
      await createInterview.mutateAsync({
        applicationId: context.applicationId,
        jobId: context.jobId,
        applicantId: context.applicantId,
        employerId: context.employerId,
        scheduledBy: userId,
        scheduledStartAt,
        scheduledEndAt,
        mode: 'video',
        status: 'scheduled',
        meetingUrl: meetingUrl || null,
      });
      setApplicationId('');
      setStartAt('');
      setMeetingUrl('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('dashboard.unableToScheduleInterview'));
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.scheduleInterview')}
        </h2>
        <form onSubmit={onSchedule} className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label={t('dashboard.applicant')}>
            <select
              className={inputClass}
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
            >
              <option value="">{t('common.select')}</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.profile.fullName} — {app.jobTitle}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('dashboard.dateTime')}>
            <input
              className={inputClass}
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </Field>
          <Field label={t('dashboard.meetingUrlOptional')}>
            <input
              className={inputClass}
              type="url"
              placeholder="https://meet.google.com/…"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </Field>
          <div className="md:col-span-3">
            {formError ? <p className="mb-3 text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
            <Button type="submit" className="rounded-2xl" disabled={createInterview.isPending}>
              {t('dashboard.scheduleInterview')}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.upcomingInterviews')}
        </h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
        ) : interviews.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted dark:text-ink-muted-dark">{t('dashboard.noInterviewsYet')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 dark:divide-border-dark">
            {interviews.map((interview) => {
              const app = applicationById.get(interview.applicationId);
              return (
                <li key={interview.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-ink dark:text-ink-dark">
                      {app?.profile.fullName || t('dashboard.applicant')}
                    </p>
                    <p className="text-ink-muted dark:text-ink-muted-dark">
                      {new Date(interview.scheduledStartAt).toLocaleString()} · {interview.status}
                    </p>
                  </div>
                  {interview.meetingUrl ? (
                    <a
                      href={interview.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-brand hover:underline dark:text-brand-light"
                    >
                      {t('dashboard.joinMeeting')}
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmployerBillingPanel({ profile }: { profile: EmployerProfile | null }) {
  const { t } = useTranslation();
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['employer', 'billing', 'payments'],
    queryFn: () => listMyPaymentRecords(),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.subscriptionPlan')}
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold capitalize text-brand dark:text-brand-light">
            {profile?.subscriptionPlan || 'free'}
          </span>
          <span className="text-sm text-ink-muted dark:text-ink-muted-dark capitalize">
            {profile?.subscriptionStatus || 'none'}
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-muted dark:text-ink-muted-dark">
          {t('dashboard.subscriptionUpgradeNote')}
        </p>
      </section>

      <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.paymentHistory')}
        </h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
        ) : payments.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">{t('dashboard.noPayments')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 dark:divide-border-dark">
            {payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-ink dark:text-ink-dark">{payment.name}</p>
                  <p className="text-ink-muted dark:text-ink-muted-dark">{payment.invoiceNumber}</p>
                </div>
                <span className="font-semibold capitalize">
                  {payment.currencySymbol} {payment.amount.toLocaleString()} · {payment.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EmployerProfileForm({
  userId,
  profile,
  onSaved,
}: {
  userId: string;
  profile: EmployerProfile | null;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    companyName: profile?.companyName || '',
    description: profile?.description || '',
    website: profile?.website || '',
    address: profile?.address || '',
    country: profile?.country || 'United Arab Emirates',
    industry: profile?.industry || 'Recruitment',
    employees: profile?.employees || '11-50',
    hiringStatus: (profile?.hiringStatus || 'hiring') as HiringStatus,
    logoDataUrl: profile?.logoDataUrl || '',
    coverDataUrl: profile?.coverDataUrl || '',
  });
  const [message, setMessage] = useState<string | null>(null);

  const upsertProfile = useUpsertEmployerProfileMutation(userId);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await upsertProfile.mutateAsync(form);
    setMessage(t('dashboard.companyProfileSaved'));
    onSaved();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
    >
      {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('dashboard.companyName')}>
          <input
            className={inputClass}
            required
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          />
        </Field>
        <Field label={t('dashboard.website')}>
          <input
            className={inputClass}
            type="url"
            placeholder="https://"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          />
        </Field>
        <Field label={t('common.country')}>
          <select
            className={inputClass}
            value={form.country}
            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
          >
            {EMPLOYER_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('dashboard.industry')}>
          <select
            className={inputClass}
            value={form.industry}
            onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
          >
            {EMPLOYER_INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('dashboard.numberOfEmployees')}>
          <select
            className={inputClass}
            value={form.employees}
            onChange={(e) => setForm((f) => ({ ...f, employees: e.target.value }))}
          >
            {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('dashboard.hiringStatus')}>
          <select
            className={inputClass}
            value={form.hiringStatus}
            onChange={(e) => setForm((f) => ({ ...f, hiringStatus: e.target.value as HiringStatus }))}
          >
            <option value="hiring">{t('dashboard.activelyHiring')}</option>
            <option value="paused">{t('dashboard.hiringPaused')}</option>
            <option value="not_hiring">{t('dashboard.notHiring')}</option>
          </select>
        </Field>
      </div>
      <Field label={t('dashboard.companyAddress')}>
        <input
          className={inputClass}
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        />
      </Field>
      <Field label={t('dashboard.companyDescription')}>
        <textarea
          className={`${inputClass} min-h-28 py-3`}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('dashboard.uploadLogo')}>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const dataUrl = await fileToDataUrl(file);
              setForm((f) => ({ ...f, logoDataUrl: dataUrl }));
            }}
          />
          {form.logoDataUrl ? (
            <img
              src={form.logoDataUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="mt-3 h-16 w-16 rounded-xl object-cover"
            />
          ) : null}
        </Field>
        <Field label={t('dashboard.uploadCover')}>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const dataUrl = await fileToDataUrl(file);
              setForm((f) => ({ ...f, coverDataUrl: dataUrl }));
            }}
          />
          {form.coverDataUrl ? (
            <img
              src={form.coverDataUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="mt-3 h-20 w-full rounded-xl object-cover"
            />
          ) : null}
        </Field>
      </div>
      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
        {t('dashboard.verificationAdminOnlyNote')}
      </p>
      <Button type="submit" className="rounded-2xl">
        {t('dashboard.saveCompanyProfile')}
      </Button>
    </form>
  );
}

function EmployerJobsList({
  jobs,
  userId,
  onEdit,
}: {
  jobs: EmployerJob[];
  userId: string;
  onEdit: (job: EmployerJob) => void;
}) {
  const { t } = useTranslation();
  const updateJob = useUpdateEmployerJobMutation(userId);
  const deleteJob = useDeleteJobMutation();
  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('dashboard.noEmployerJobs')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <article
          key={job.id}
          className="rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-heading text-lg font-semibold">{job.title}</h3>
              <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                {job.city}, {job.country} · {job.salaryLabel} · {job.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => onEdit(job)}>
                {t('common.edit')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  void updateJob.mutateAsync({
                    jobId: job.id,
                    patch: { status: job.status === 'Open' ? 'Closed' : 'Open' },
                  });
                }}
              >
                {job.status === 'Open' ? t('dashboard.closeJob') : t('dashboard.openJob')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  void deleteJob.mutateAsync(job.id);
                }}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmployerJobForm({
  userId,
  profile,
  jobId,
  jobs,
  onSaved,
}: {
  userId: string;
  profile: EmployerProfile | null;
  jobId: string | null;
  jobs: EmployerJob[];
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const existing = jobId ? jobs.find((job) => job.id === jobId) : null;
  const createJob = useCreateEmployerJobMutation(userId);
  const updateJob = useUpdateEmployerJobMutation(userId);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: existing?.title || 'Factory Worker',
    country: existing?.country || profile?.country || 'Canada',
    countryCode: existing?.countryCode || 'ca',
    city: existing?.city || '',
    salaryMonthly: existing?.salaryMonthly || 3800,
    currency: existing?.currency || 'CAD',
    jobType: existing?.jobType || 'Full-time',
    experience: existing?.experience || '1+ years',
    education: existing?.education || 'High school',
    accommodation: existing?.accommodation ?? true,
    visaSponsorship: existing?.visaSponsorship ?? true,
    medicalInsurance: existing?.medicalInsurance ?? true,
    transport: existing?.transport ?? false,
    workingHours: existing?.workingHours || '40–48 hours / week',
    contractDuration: existing?.contractDuration || '24 months',
    requirementsText: existing?.requirements.join('\n') || 'Valid passport\nRelevant experience',
    benefitsText: existing?.benefits.join('\n') || 'Visa sponsorship\nAccommodation',
    description: existing?.description || '',
    applicationDeadline: existing?.applicationDeadline || '2026-09-30',
    maxApplicants: existing?.maxApplicants || 20,
    status: (existing?.status || 'Open') as EmployerJobStatus,
    category: existing?.category || 'General',
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const payload = {
      title: form.title,
      country: form.country,
      countryCode: form.countryCode,
      city: form.city,
      salaryMonthly: Number(form.salaryMonthly),
      currency: form.currency,
      salaryLabel: `${form.currency} ${Number(form.salaryMonthly).toLocaleString()}/month`,
      jobType: form.jobType,
      experience: form.experience,
      education: form.education,
      accommodation: form.accommodation,
      visaSponsorship: form.visaSponsorship,
      medicalInsurance: form.medicalInsurance,
      transport: form.transport,
      workingHours: form.workingHours,
      contractDuration: form.contractDuration,
      requirements: form.requirementsText.split('\n').map((line) => line.trim()).filter(Boolean),
      benefits: form.benefitsText.split('\n').map((line) => line.trim()).filter(Boolean),
      description: form.description,
      applicationDeadline: form.applicationDeadline,
      maxApplicants: Number(form.maxApplicants),
      status: form.status,
      category: form.category,
      companyName: profile?.companyName,
    };

    try {
      if (jobId) {
        await updateJob.mutateAsync({ jobId, patch: payload });
      } else {
        await createJob.mutateAsync(payload);
      }
      onSaved();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('dashboard.unableCreateJob'));
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
    >
      {formError ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {formError}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('common.job')}>
          <select
            className={inputClass}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          >
            {REQUIRED_EVERY_COUNTRY_JOBS.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('common.country')}>
          <select
            className={inputClass}
            value={form.country}
            onChange={(e) => {
              const country = e.target.value;
              const code =
                EMPLOYER_COUNTRIES.find((item) => item === country)
                  ?.slice(0, 2)
                  .toLowerCase() || 'xx';
              // Prefer known codes for major destinations
              const known: Record<string, string> = {
                'United States': 'us',
                Canada: 'ca',
                Australia: 'au',
                'United Kingdom': 'gb',
                Ireland: 'ie',
                Germany: 'de',
                France: 'fr',
                Italy: 'it',
                Spain: 'es',
                Netherlands: 'nl',
                Belgium: 'be',
                Norway: 'no',
                Sweden: 'se',
                Denmark: 'dk',
                Finland: 'fi',
                'New Zealand': 'nz',
                Japan: 'jp',
                'South Korea': 'kr',
                Singapore: 'sg',
                'United Arab Emirates': 'ae',
                Qatar: 'qa',
                'Saudi Arabia': 'sa',
                Oman: 'om',
                Bahrain: 'bh',
                Kuwait: 'kw',
                Poland: 'pl',
                Austria: 'at',
                Switzerland: 'ch',
              };
              setForm((f) => ({ ...f, country, countryCode: known[country] || code }));
            }}
          >
            {EMPLOYER_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('common.city')}>
          <input className={inputClass} required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
        </Field>
        <Field label={t('jobs.currency')}>
          <select className={inputClass} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('dashboard.salaryMonthly')}>
          <input
            className={inputClass}
            type="number"
            min={0}
            value={form.salaryMonthly}
            onChange={(e) => setForm((f) => ({ ...f, salaryMonthly: Number(e.target.value) }))}
          />
        </Field>
        <Field label={t('dashboard.jobType')}>
          <select className={inputClass} value={form.jobType} onChange={(e) => setForm((f) => ({ ...f, jobType: e.target.value }))}>
            {['Full-time', 'Part-time', 'Contract', 'Seasonal'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('jobs.experience')}>
          <input className={inputClass} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} />
        </Field>
        <Field label={t('jobs.education')}>
          <input className={inputClass} value={form.education} onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} />
        </Field>
        <Field label={t('jobs.workingHours')}>
          <input className={inputClass} value={form.workingHours} onChange={(e) => setForm((f) => ({ ...f, workingHours: e.target.value }))} />
        </Field>
        <Field label={t('dashboard.contractDuration')}>
          <input className={inputClass} value={form.contractDuration} onChange={(e) => setForm((f) => ({ ...f, contractDuration: e.target.value }))} />
        </Field>
        <Field label={t('dashboard.applicationDeadline')}>
          <input
            className={inputClass}
            type="date"
            value={form.applicationDeadline}
            onChange={(e) => setForm((f) => ({ ...f, applicationDeadline: e.target.value }))}
          />
        </Field>
        <Field label={t('dashboard.maximumApplicants')}>
          <input
            className={inputClass}
            type="number"
            min={1}
            value={form.maxApplicants}
            onChange={(e) => setForm((f) => ({ ...f, maxApplicants: Number(e.target.value) }))}
          />
        </Field>
        <Field label={t('common.status')}>
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as EmployerJobStatus }))}
          >
            <option value="Open">{t('dashboard.openJob')}</option>
            <option value="Closed">{t('dashboard.closeJob')}</option>
            <option value="Draft">{t('common.draft')}</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ['accommodation', t('dashboard.accommodationIncluded')],
            ['visaSponsorship', t('dashboard.visaSponsorshipLabel')],
            ['medicalInsurance', t('jobs.medicalInsurance')],
            ['transport', t('dashboard.transportLabel')],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 rounded-2xl border border-border px-3 py-3 text-sm dark:border-border-dark">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>

      <Field label={t('dashboard.requirementsPerLine')}>
        <textarea
          className={`${inputClass} min-h-24 py-3`}
          value={form.requirementsText}
          onChange={(e) => setForm((f) => ({ ...f, requirementsText: e.target.value }))}
        />
      </Field>
      <Field label={t('dashboard.benefitsPerLine')}>
        <textarea
          className={`${inputClass} min-h-24 py-3`}
          value={form.benefitsText}
          onChange={(e) => setForm((f) => ({ ...f, benefitsText: e.target.value }))}
        />
      </Field>
      <Field label={t('dashboard.jobDescription')}>
        <textarea
          className={`${inputClass} min-h-28 py-3`}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </Field>

      <Button type="submit" className="rounded-2xl">
        {jobId ? t('dashboard.updateJob') : t('dashboard.publishJob')}
      </Button>
    </form>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-border bg-[var(--bg)] px-3 text-sm font-medium text-ink outline-none focus:border-brand dark:border-border-dark dark:text-ink-dark';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-ink dark:text-ink-dark">{label}</span>
      {children}
    </label>
  );
}
