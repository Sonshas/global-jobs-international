import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import {
  useAllCampaigns,
  useCreateCampaignMutation,
  useDeleteCampaignMutation,
  useUpdateCampaignMutation,
} from '@/hooks/queries/useCampaignsQueries';

export function AdminCampaignsPage() {
  const { t } = useTranslation();
  const { data: campaigns = [], isLoading } = useAllCampaigns();
  const createMutation = useCreateCampaignMutation();
  const updateMutation = useUpdateCampaignMutation();
  const deleteMutation = useDeleteCampaignMutation();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!title.trim()) {
      setFormError(t('admin.campaignTitleRequired'));
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        summary: summary.trim() || undefined,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        isActive: true,
      });
      setTitle('');
      setSummary('');
      setStartsAt('');
      setEndsAt('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t('admin.unableCreateCampaign'));
    }
  };

  return (
    <DashboardShell title={t('admin.campaignsTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">{t('admin.campaignsTitle')}</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">{t('admin.campaignsDesc')}</p>

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55 sm:grid-cols-2"
      >
        <label htmlFor="campaign-title" className="sr-only">
          {t('admin.campaignTitlePlaceholder')}
        </label>
        <input
          id="campaign-title"
          className="h-11 rounded-xl border border-border bg-[var(--bg)] px-3 text-sm dark:border-border-dark"
          placeholder={t('admin.campaignTitlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <label htmlFor="campaign-summary" className="sr-only">
          {t('admin.campaignSummaryPlaceholder')}
        </label>
        <input
          id="campaign-summary"
          className="h-11 rounded-xl border border-border bg-[var(--bg)] px-3 text-sm dark:border-border-dark"
          placeholder={t('admin.campaignSummaryPlaceholder')}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <label htmlFor="campaign-starts-at" className="sr-only">
          {t('admin.campaignStartsAt')}
        </label>
        <input
          id="campaign-starts-at"
          className="h-11 rounded-xl border border-border bg-[var(--bg)] px-3 text-sm dark:border-border-dark"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <label htmlFor="campaign-ends-at" className="sr-only">
          {t('admin.campaignEndsAt')}
        </label>
        <input
          id="campaign-ends-at"
          className="h-11 rounded-xl border border-border bg-[var(--bg)] px-3 text-sm dark:border-border-dark"
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
        />
        <div className="sm:col-span-2">
          {formError ? <p className="mb-2 text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
          <Button type="submit" className="rounded-2xl" disabled={createMutation.isPending}>
            {t('admin.createCampaign')}
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted">{t('common.loading')}</p>
      ) : campaigns.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">{t('admin.noCampaignsYet')}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {campaigns.map((campaign) => (
            <li
              key={campaign.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 p-4 dark:border-border-dark"
            >
              <div>
                <p className="font-semibold text-ink dark:text-ink-dark">{campaign.title}</p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  {campaign.summary || t('admin.noSummary')} ·{' '}
                  {campaign.startsAt ? new Date(campaign.startsAt).toLocaleDateString() : t('admin.noStartDate')}
                  {campaign.endsAt ? ` — ${new Date(campaign.endsAt).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={campaign.isActive ? 'secondary' : 'outline'}
                  onClick={() =>
                    void updateMutation.mutateAsync({ id: campaign.id, patch: { isActive: !campaign.isActive } })
                  }
                >
                  {campaign.isActive ? t('admin.deactivate') : t('admin.activate')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void deleteMutation.mutateAsync(campaign.id)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
