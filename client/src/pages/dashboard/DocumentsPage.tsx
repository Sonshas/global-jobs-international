import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  documentKindLabel,
  type ApplicantDocumentKind,
  type DocumentReviewStatus,
} from '@/data/recruitment-pipeline';
import {
  useApplicantDocuments,
  useDocumentDownloadMutation,
  useUploadApplicantDocumentMutation,
} from '@/hooks/queries/useDocumentsQueries';

const statusStyles: Record<DocumentReviewStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  uploaded: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

export function DocumentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id || '';
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<ApplicantDocumentKind | null>(null);
  const { data: docs = [], isLoading, isError, refetch } = useApplicantDocuments(userId || undefined);
  const uploadMutation = useUploadApplicantDocumentMutation(userId || undefined);
  const downloadMutation = useDocumentDownloadMutation();

  const onUpload = async (kind: ApplicantDocumentKind, file: File | null) => {
    if (!userId || !file) return;
    setUploadError(null);
    setUploadingKind(kind);
    try {
      await uploadMutation.mutateAsync({ kind, file });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('common.errorGeneric'));
    } finally {
      setUploadingKind(null);
    }
  };

  const onDownload = async (documentId: string) => {
    setUploadError(null);
    try {
      const url = await downloadMutation.mutateAsync(documentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : t('common.errorGeneric'));
    }
  };

  const busy = uploadMutation.isPending || downloadMutation.isPending;

  return (
    <DashboardShell title={t('nav.documents')} adminLink>
      <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
        {t('dashboard.documentVault')}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('dashboard.documentsTitle')}
      </h1>
      <p className="mt-2 max-w-2xl text-ink-muted dark:text-ink-muted-dark">
        {t('dashboard.documentsUploadDesc')}
      </p>
      {isError ? (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {t('dashboard.documentsLoadError')}{' '}
          <button type="button" className="font-semibold underline" onClick={() => void refetch()}>
            {t('common.retry')}
          </button>
        </p>
      ) : null}
      {uploadError ? (
        <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {uploadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted dark:text-ink-muted-dark">{t('app.loading')}</p>
      ) : (
        <div className="mt-8 grid gap-4">
          {docs.map((doc) => (
            <div
              key={doc.kind}
              className="flex flex-col gap-4 rounded-[1.5rem] border border-border/70 bg-white/85 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-border-dark dark:bg-slate-900/55"
            >
              <div>
                <p className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {documentKindLabel(doc.kind)}
                </p>
                <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {doc.fileName
                    ? `${doc.fileName}${doc.uploadedAt ? ` · ${new Date(doc.uploadedAt).toLocaleDateString()}` : ''}`
                    : t('dashboard.notUploadedYet')}
                </p>
                {doc.adminNote ? (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{doc.adminNote}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[doc.status]}`}
                >
                  {doc.status}
                </span>
                {doc.documentId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={busy}
                    onClick={() => void onDownload(doc.documentId!)}
                  >
                    {t('common.download')}
                  </Button>
                ) : null}
                <label className="cursor-pointer">
                  <span className="inline-flex rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white">
                    {uploadingKind === doc.kind ? t('common.uploading') : t('common.upload')}
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={busy}
                    onChange={(e) => void onUpload(doc.kind, e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button href="/dashboard" variant="secondary" className="rounded-2xl">
          {t('dashboard.backToDashboardLink')}
        </Button>
        <Button href="/dashboard/applications" className="rounded-2xl">
          {t('dashboard.applicationsTitle')}
        </Button>
      </div>
    </DashboardShell>
  );
}
