import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { JobApplication } from '@/data/applications';
import { useApplicationsList } from '@/hooks/queries/useApplicationsQueries';
import { searchApplicants, type ApplicantSearchFilters } from '@/data/applicant-search';
import { queryKeys } from '@/repositories/query-keys';
import {
  adminAdvancePipeline,
  ensureApplicationTimeline,
  getTimeline,
} from '@/data/recruitment-pipeline';
import { useApplicantDocuments } from '@/hooks/queries/useDocumentsQueries';

type PipelineAction = Parameters<typeof adminAdvancePipeline>[1];

function usePipelineActions() {
  const { t } = useTranslation();
  return useMemo(
    (): Array<{ id: PipelineAction; label: string }> => [
      { id: 'approve', label: t('admin.actionApprove') },
      { id: 'reject', label: t('admin.actionReject') },
      { id: 'request_passport', label: t('admin.actionRequestPassport') },
      { id: 'request_cv', label: t('admin.actionRequestCv') },
      { id: 'request_medical', label: t('admin.actionRequestMedical') },
      { id: 'request_police', label: t('admin.actionRequestPolice') },
      { id: 'documents_received', label: t('admin.actionDocumentsReceived') },
      { id: 'schedule_interview', label: t('admin.actionScheduleInterview') },
      { id: 'mark_interview_passed', label: t('admin.actionInterviewPassed') },
      { id: 'start_visa', label: t('admin.actionStartVisa') },
      { id: 'upload_work_permit', label: t('admin.actionUploadWorkPermit') },
      { id: 'upload_flight', label: t('admin.actionUploadFlight') },
      { id: 'mark_travelled', label: t('admin.actionMarkTravelled') },
      { id: 'mark_employed', label: t('admin.actionMarkEmployed') },
    ],
    [t],
  );
}

export function AdminApplicationsPage() {
  const { t } = useTranslation();
  const ACTIONS = usePipelineActions();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: allApps = [], isLoading } = useApplicationsList();
  const [filters, setFilters] = useState<ApplicantSearchFilters>({});
  const [filteredApps, setFilteredApps] = useState<JobApplication[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [interviewAt, setInterviewAt] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);

  const apps = filteredApps ?? allApps;
  const selected = useMemo(
    () => apps.find((app) => app.id === selectedId) ?? apps[0] ?? null,
    [apps, selectedId],
  );

  const filterLabels = useMemo(
    () =>
      ({
        name: t('common.name'),
        email: t('common.email'),
        phone: t('common.phone'),
        country: t('common.country'),
        employer: t('common.employer'),
        job: t('common.job'),
        status: t('common.status'),
        visaStage: t('admin.visaStage'),
      }) as const,
    [t],
  );

  const refresh = async () => {
    setSearching(true);
    try {
      const hasFilters = Object.values(filters).some((v) => v);
      if (hasFilters) {
        setFilteredApps(await searchApplicants(filters));
      } else {
        setFilteredApps(null);
        await queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
      }
    } finally {
      setSearching(false);
    }
  };

  const runAction = async (app: JobApplication, action: PipelineAction) => {
    const composedNote =
      action === 'schedule_interview'
        ? [
            interviewAt ? new Date(interviewAt).toISOString() : null,
            meetingUrl.trim() || null,
            note.trim() || null,
          ]
            .filter(Boolean)
            .join(' ')
        : note.trim() || undefined;

    await adminAdvancePipeline(app, action, composedNote || undefined);
    setNote('');
    if (action === 'schedule_interview') {
      setInterviewAt('');
      setMeetingUrl('');
    }
    setMessage(
      t('admin.actionApplied', {
        action: action.replace(/_/g, ' '),
        applicationNumber: app.applicationNumber,
      }),
    );
    setFilteredApps(null);
    await queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.documents.forUser(app.userId) });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'calendar-events'] });
  };

  const timeline = selected ? ensureApplicationTimeline(selected) : [];
  const { data: docs = [] } = useApplicantDocuments(selected?.userId);

  return (
    <DashboardShell title={t('admin.pipelineTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('admin.pipelineTitle')}
      </h1>
      <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">
        {t('admin.signedInAs', { email: user?.email ?? '' })}
      </p>

      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {message}
        </p>
      ) : null}

      <section className="mt-6 grid gap-3 rounded-3xl border border-border/70 bg-white/85 p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-border-dark dark:bg-slate-900/55">
        {(Object.keys(filterLabels) as Array<keyof typeof filterLabels>).map((key) => (
          <label key={key} className="text-xs font-semibold uppercase text-ink-muted">
            {filterLabels[key]}
            <input
              className="mt-1 h-10 w-full rounded-xl border border-border px-3 text-sm font-normal normal-case dark:border-border-dark"
              value={filters[key] || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value || undefined }))}
            />
          </label>
        ))}
        <div className="flex items-end gap-2 sm:col-span-2">
          <Button type="button" className="rounded-xl" onClick={() => void refresh()} disabled={searching}>
            {searching ? t('common.loading') : t('admin.searchApplicants')}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              setFilters({});
              setFilteredApps(null);
              void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
            }}
          >
            {t('common.clear')}
          </Button>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-x-auto rounded-3xl border border-border bg-white dark:border-border-dark dark:bg-surface-elevated-dark">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs tracking-wide text-ink-muted uppercase dark:border-border-dark">
              <tr>
                <th className="px-4 py-3">{t('admin.tableApplicant')}</th>
                <th className="px-4 py-3">{t('common.country')}</th>
                <th className="px-4 py-3">{t('common.employer')}</th>
                <th className="px-4 py-3">{t('common.job')}</th>
                <th className="px-4 py-3">{t('common.status')}</th>
                <th className="px-4 py-3">{t('dashboard.cvStatus')}</th>
                <th className="px-4 py-3">{t('common.date')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-ink-muted">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-ink-muted">
                    {t('admin.noApplicationsAdmin')}
                  </td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr
                    key={app.id}
                    className={`cursor-pointer border-b border-border/60 dark:border-border-dark ${
                      selectedId === app.id ? 'bg-brand/5' : ''
                    }`}
                    onClick={() => {
                      setSelectedId(app.id);
                      setMessage('');
                    }}
                  >
                    <td className="px-4 py-3 font-medium">{app.profile.fullName}</td>
                    <td className="px-4 py-3">{app.country}</td>
                    <td className="px-4 py-3">{app.employer}</td>
                    <td className="px-4 py-3">{app.jobTitle}</td>
                    <td className="px-4 py-3 capitalize">{app.status.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      {app.cvRequired
                        ? app.cvPaid
                          ? t('admin.cvPaid')
                          : t('admin.cvRequiredCol')
                        : t('dashboard.onFile')}
                    </td>
                    <td className="px-4 py-3">{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-3xl border border-border bg-white p-5 dark:border-border-dark dark:bg-surface-elevated-dark">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold tracking-wide text-brand uppercase">
                  {selected.applicationNumber}
                </p>
                <h2 className="mt-1 font-heading text-xl font-semibold">{selected.jobTitle}</h2>
                <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                  {selected.profile.fullName} · {selected.employer} · {selected.currentStage}
                </p>
              </div>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">{t('admin.interviewAtLabel')}</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-border bg-[var(--bg)] px-3 py-2 text-sm dark:border-border-dark"
                  value={interviewAt}
                  onChange={(e) => setInterviewAt(e.target.value)}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">{t('admin.meetingUrlLabel')}</span>
                <input
                  type="url"
                  className="w-full rounded-xl border border-border bg-[var(--bg)] px-3 py-2 text-sm dark:border-border-dark"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.example.com/…"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-medium">{t('admin.noteInterviewLabel')}</span>
                <textarea
                  className="min-h-[72px] w-full rounded-xl border border-border bg-[var(--bg)] px-3 py-2 text-sm dark:border-border-dark"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('admin.notePlaceholder')}
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((action) => (
                  <Button
                    key={action.id}
                    type="button"
                    size="sm"
                    variant={action.id === 'reject' ? 'secondary' : 'outline'}
                    className="rounded-xl"
                    onClick={() => void runAction(selected, action.id)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {t('dashboard.documentVault')}
                </p>
                <ul className="max-h-36 space-y-1 overflow-y-auto text-xs text-ink-muted dark:text-ink-muted-dark">
                  {docs.map((doc) => (
                    <li key={doc.kind}>
                      {doc.kind.replace(/_/g, ' ')} — {doc.status}
                      {doc.fileName ? ` (${doc.fileName})` : ''}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  {t('common.timeline')}
                </p>
                <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
                  {(timeline.length ? timeline : getTimeline(selected.id, apps)).map((event) => (
                    <li key={event.id} className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/40">
                      <span className="font-semibold">{event.label}</span>
                      <span className="text-ink-muted"> · {event.status}</span>
                      <div className="text-ink-muted">{new Date(event.at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                href={`/dashboard/applications/${selected.id}`}
                variant="ghost"
                className="w-full rounded-2xl"
              >
                {t('admin.openApplicantView')}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{t('admin.selectApplicationManage')}</p>
          )}
        </aside>
      </div>
    </DashboardShell>
  );
}
