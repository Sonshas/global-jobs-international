import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { getSuperAdminStats } from '@/data/admin-analytics';
import {
  calendarTypeLabel,
  eventsForDay,
  listRecruitmentCalendarEvents,
  monthMatrix,
  type CalendarEventType,
} from '@/data/recruitment-calendar';
import {
  addApplicantNote,
  buildApplicant360,
  listApplicantsFor360,
} from '@/data/applicant-360';
import { useApplicantDocuments } from '@/hooks/queries/useDocumentsQueries';
import { VISA_TRACKER_STEPS } from '@/data/recruitment-pipeline';
import { useAuth } from '@/hooks/useAuth';
import { SystemHealthCard } from '@/components/admin/SystemHealthCard';

const typeColors: Record<CalendarEventType, string> = {
  interview: 'bg-sky-500',
  medical: 'bg-emerald-500',
  passport: 'bg-amber-500',
  visa: 'bg-violet-500',
  flight: 'bg-rose-500',
  deadline: 'bg-slate-500',
  meeting: 'bg-brand',
};

type Tab = 'overview' | 'calendar' | 'applicants';

export function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'super-stats'],
    queryFn: () => getSuperAdminStats(),
  });
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin', 'calendar-events'],
    queryFn: () => listRecruitmentCalendarEvents(),
  });
  const { data: applicants = [], isLoading: applicantsLoading } = useQuery({
    queryKey: ['admin', 'applicants-360'],
    queryFn: () => listApplicantsFor360(),
  });
  const refreshLive = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] });
  };
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [notesTick, setNotesTick] = useState(0);
  const selected = applicants.find((app) => app.id === selectedAppId) ?? applicants[0] ?? null;
  const { data: selectedDocs = [] } = useApplicantDocuments(selected?.userId);
  const { data: profile360 = null } = useQuery({
    queryKey: ['admin', 'applicant-360', selected?.id, notesTick],
    queryFn: () => buildApplicant360(selected!, selectedDocs),
    enabled: Boolean(selected),
  });

  const now = new Date();
  const [monthCursor, setMonthCursor] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });
  const [selectedDay, setSelectedDay] = useState(now.toISOString().slice(0, 10));
  const cells = monthMatrix(monthCursor.year, monthCursor.month);
  const dayEvents = eventsForDay(selectedDay, events);

  const adminLoading = statsLoading || eventsLoading || applicantsLoading;

  const maxWeek = Math.max(1, ...(stats?.weeklyApplications ?? [0]));
  const maxPipe = Math.max(1, ...(stats?.pipelineBreakdown.map((item) => item.value) ?? [0]));

  if (adminLoading && !stats) {
    return (
      <DashboardShell title={t('admin.superAdminTitle')} adminLink>
        <p className="text-sm text-ink-muted">{t('common.loading')}</p>
      </DashboardShell>
    );
  }

  if (!stats) {
    return (
      <DashboardShell title={t('admin.superAdminTitle')} adminLink>
        <p className="text-sm text-ink-muted">{t('admin.noApplicationsAdmin')}</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={t('admin.superAdminTitle')} adminLink>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
            {t('admin.controlCenter')}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
            {t('admin.superTitle')}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted dark:text-ink-muted-dark">
            {t('admin.superAdminDesc')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/admin/applications" variant="outline" className="rounded-2xl">
            {t('admin.pipelineActions')}
          </Button>
          <Button type="button" className="rounded-2xl" onClick={refreshLive}>
            {t('admin.refreshLive')}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['overview', t('admin.analytics')],
            ['calendar', t('admin.calendar')],
            ['applicants', t('admin.applicant360')],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              tab === id
                ? 'border-brand bg-brand text-white'
                : 'border-border bg-white text-ink dark:border-border-dark dark:bg-slate-900 dark:text-ink-dark'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                [t('admin.statTotalApplicants'), stats.totalApplicants],
                [t('admin.statTotalEmployers'), stats.totalEmployers],
                [t('admin.statTotalJobs'), stats.totalJobs],
                [t('dashboard.activeJobs'), stats.activeJobs],
                [t('admin.statCountriesHiring'), stats.countriesHiring],
                [t('admin.statApplicationsToday'), stats.applicationsToday],
                [t('admin.statApplicationsThisWeek'), stats.applicationsThisWeek],
                [t('dashboard.shortlisted'), stats.shortlisted],
                [t('dashboard.interviewsScheduled'), stats.interviewsScheduled],
                [t('admin.statVisaProcessing'), stats.visaProcessing],
                [t('admin.statWorkPermits'), stats.workPermits],
                [t('admin.statFlightBookings'), stats.flightBookings],
                [t('admin.statArrivals'), stats.arrivals],
                [t('admin.statRejected'), stats.rejected],
                [t('admin.statRevenueUsd'), stats.revenue],
                [t('admin.statCvServiceRevenue'), stats.cvServiceRevenue],
                [t('admin.statOtherServiceRevenue'), stats.otherServiceRevenue],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-border/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
              >
                <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark">
                  {label}
                </p>
                <div className="mt-2">
                  <AnimatedCounter value={value} format={value >= 10000 ? 'compact' : 'standard'} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
              <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                {t('admin.applicationsLast7Days')}
              </h2>
              <div className="mt-6 flex h-48 items-end gap-2">
                {stats.weeklyApplications.map((value, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-brand to-accent transition-all"
                      style={{ height: `${Math.max(8, (value / maxWeek) * 100)}%` }}
                      title={t('admin.applicationsCount', { count: value })}
                    />
                    <span className="text-[10px] font-semibold text-ink-muted">D{index + 1}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
              <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                {t('admin.pipelineBreakdown')}
              </h2>
              <ul className="mt-5 space-y-3">
                {stats.pipelineBreakdown.map((item) => (
                  <li key={item.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-ink dark:text-ink-dark">{item.label}</span>
                      <span className="text-ink-muted">{item.value}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${(item.value / maxPipe) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <SystemHealthCard />

          <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
            <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
              {t('admin.moreTools')}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button href="/admin/users" variant="outline" size="sm" className="rounded-xl">
                {t('admin.manageUsers')}
              </Button>
              <Button href="/admin/countries" variant="outline" size="sm" className="rounded-xl">
                {t('admin.manageCountries')}
              </Button>
              <Button href="/admin/campaigns" variant="outline" size="sm" className="rounded-xl">
                {t('admin.manageCampaigns')}
              </Button>
              <Button href="/admin/payments" variant="outline" size="sm" className="rounded-xl">
                {t('admin.viewAllPayments')}
              </Button>
              <Button href="/admin/audit" variant="outline" size="sm" className="rounded-xl">
                {t('admin.viewAuditLog')}
              </Button>
              <Button href="/admin/support" variant="outline" size="sm" className="rounded-xl">
                {t('dashboard.supportInbox')}
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {tab === 'calendar' ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                {new Date(monthCursor.year, monthCursor.month).toLocaleString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    setMonthCursor((prev) => {
                      const d = new Date(prev.year, prev.month - 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })
                  }
                >
                  {t('common.previous')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    setMonthCursor((prev) => {
                      const d = new Date(prev.year, prev.month + 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })
                  }
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold tracking-wide text-ink-muted uppercase">
              {[
                t('admin.weekdaySun'),
                t('admin.weekdayMon'),
                t('admin.weekdayTue'),
                t('admin.weekdayWed'),
                t('admin.weekdayThu'),
                t('admin.weekdayFri'),
                t('admin.weekdaySat'),
              ].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                const count = cell.date
                  ? events.filter((event) => event.date === cell.date).length
                  : 0;
                const active = cell.date === selectedDay;
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!cell.date}
                    onClick={() => cell.date && setSelectedDay(cell.date)}
                    className={`min-h-16 rounded-2xl border p-2 text-left text-sm ${
                      !cell.date
                        ? 'border-transparent'
                        : active
                          ? 'border-brand bg-brand/10'
                          : 'border-border/60 hover:border-brand/40 dark:border-border-dark'
                    }`}
                  >
                    {cell.day ? (
                      <>
                        <span className="font-semibold text-ink dark:text-ink-dark">{cell.day}</span>
                        {count > 0 ? (
                          <span className="mt-1 block text-[10px] font-bold text-brand dark:text-brand-light">
                            {t('admin.eventCount', { count })}
                          </span>
                        ) : null}
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55">
            <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
              {selectedDay}
            </h2>
            <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
              {t('admin.calendarEventsHint')}
            </p>
            <ul className="mt-4 space-y-3">
              {dayEvents.length === 0 ? (
                <li className="text-sm text-ink-muted">{t('admin.noEventsDay')}</li>
              ) : (
                dayEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-2xl border border-border/60 px-3 py-3 dark:border-border-dark"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${typeColors[event.type]}`}
                      />
                      <div>
                        <p className="text-xs font-bold tracking-wide text-ink-muted uppercase">
                          {calendarTypeLabel(event.type)}
                        </p>
                        <p className="font-semibold text-ink dark:text-ink-dark">{event.title}</p>
                        {event.meta ? (
                          <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                            {event.meta}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </div>
      ) : null}

      {tab === 'applicants' ? (
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="overflow-hidden rounded-3xl border border-border bg-white dark:border-border-dark dark:bg-surface-elevated-dark">
            <ul className="max-h-[70vh] divide-y divide-border/60 overflow-y-auto dark:divide-border-dark">
              {applicants.length === 0 ? (
                <li className="p-6 text-sm text-ink-muted">{t('dashboard.noApplicantsYet')}</li>
              ) : (
                applicants.map((app) => (
                  <li key={app.id}>
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left hover:bg-brand/5 ${
                        selected?.id === app.id ? 'bg-brand/10' : ''
                      }`}
                      onClick={() => setSelectedAppId(app.id)}
                    >
                      <p className="font-semibold text-ink dark:text-ink-dark">
                        {app.profile.fullName}
                      </p>
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                        {app.jobTitle} · {app.country} · {app.applicationNumber}
                      </p>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {profile360 ? (
            <section className="rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand font-heading text-2xl font-bold text-white">
                  {profile360.application.profile.fullName
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-heading text-2xl font-bold text-ink dark:text-ink-dark">
                    {profile360.application.profile.fullName}
                  </h2>
                  <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                    {profile360.application.applicationNumber} ·{' '}
                    {profile360.application.currentStage}
                  </p>
                </div>
                <Button
                  href={`/dashboard/applications/${profile360.application.id}`}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  {t('admin.openApplication')}
                </Button>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  [t('common.email'), profile360.application.profile.email],
                  [t('common.phone'), profile360.application.profile.phone],
                  [t('admin.nationalityResidence'), profile360.application.profile.countryOfResidence],
                  [t('admin.currentCountryFocus'), profile360.application.country],
                  [t('admin.appliedJob'), profile360.application.jobTitle],
                  [t('common.employer'), profile360.application.employer],
                  [t('common.status'), profile360.application.status],
                  [t('admin.passportOnFile'), profile360.documents.find((d) => d.kind === 'passport')?.status || 'pending'],
                  [t('dashboard.cvStatus'), profile360.documents.find((d) => d.kind === 'cv')?.status || 'pending'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-950/40">
                    <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold capitalize text-ink dark:text-ink-dark">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-heading font-semibold text-ink dark:text-ink-dark">{t('common.timeline')}</h3>
                  <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
                    {profile360.timeline.map((event) => (
                      <li key={event.id} className="rounded-xl border border-border/50 px-3 py-2 dark:border-border-dark">
                        {new Date(event.at).toLocaleDateString()} — {event.label} ({event.status})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-ink dark:text-ink-dark">
                    {t('dashboard.visaStatus')} · {profile360.visaPercent}%
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {VISA_TRACKER_STEPS.map((step) => (
                      <li key={step} className="flex justify-between">
                        <span>{step}</span>
                        <span>{profile360.visa[step] ? '✔' : '○'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-heading font-semibold text-ink dark:text-ink-dark">{t('dashboard.documents')}</h3>
                  <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-ink-muted">
                    {profile360.documents.map((doc) => (
                      <li key={doc.kind}>
                        {doc.kind.replace(/_/g, ' ')} — {doc.status}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-ink dark:text-ink-dark">{t('dashboard.messages')}</h3>
                  <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto text-sm text-ink-muted">
                    {profile360.messages.length === 0 ? (
                      <li>{t('admin.noMessagesYet')}</li>
                    ) : (
                      profile360.messages.map((msg) => (
                        <li key={msg.id}>
                          <span className="font-medium text-ink dark:text-ink-dark">{msg.title}</span>
                          <span className="block text-xs text-ink-muted">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="font-heading font-semibold text-ink dark:text-ink-dark">{t('nav.payments')}</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {profile360.payments.map((payment) => (
                      <li key={payment.label} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/40">
                        <span>{payment.label}</span>
                        <span className="font-semibold capitalize">
                          {payment.amount} · {payment.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-ink dark:text-ink-dark">{t('common.notes')}</h3>
                  <ul className="mt-3 max-h-28 space-y-2 overflow-y-auto text-sm text-ink-muted">
                    {profile360.notes.length === 0 ? (
                      <li>{t('admin.noNotesYet')}</li>
                    ) : (
                      profile360.notes.map((item) => (
                        <li key={item.id}>
                          {item.body}{' '}
                          <span className="text-xs">({new Date(item.createdAt).toLocaleString()})</span>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="h-10 flex-1 rounded-xl border border-border bg-[var(--bg)] px-3 text-sm dark:border-border-dark"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t('admin.addNotePlaceholder')}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        if (!selected || !note.trim()) return;
                        void addApplicantNote(selected.id, note, user?.id).then(() => {
                          setNote('');
                          setNotesTick((v) => v + 1);
                        });
                      }}
                    >
                      {t('common.save')}
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <p className="text-sm text-ink-muted">{t('admin.selectApplicant360')}</p>
          )}
        </div>
      ) : null}

      <p className="mt-8 text-xs text-ink-muted dark:text-ink-muted-dark">
        {t('admin.alsoAvailable')}{' '}
        <Link to="/admin/applications" className="font-semibold text-brand hover:underline">
          {t('admin.pipelineConsoleLink')}
        </Link>
      </p>
    </DashboardShell>
  );
}
