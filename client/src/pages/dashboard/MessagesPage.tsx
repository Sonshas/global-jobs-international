import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  useApplicationParticipants,
  useConversations,
  useGetOrCreateConversationMutation,
  useMarkConversationReadMutation,
  useMessages,
  useMessagesRealtime,
  useSendMessageMutation,
} from '@/hooks/queries/useMessagingQueries';
import { useApplicantDocuments, useDocumentDownloadMutation } from '@/hooks/queries/useDocumentsQueries';
import type { Conversation } from '@/repositories/messaging.repository';

function counterpartName(conversation: Conversation, userId: string | undefined): string {
  if (conversation.kind === 'support') {
    return conversation.employerUserId === userId ? 'Global Jobs Support' : conversation.employerName || 'Employer';
  }
  return conversation.applicantUserId === userId ? conversation.employerName || 'Employer' : conversation.applicantName || 'Applicant';
}

export function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const [params, setParams] = useSearchParams();
  const applicationId = params.get('applicationId') ?? undefined;
  const [selectedId, setSelectedId] = useState<string | null>(params.get('conversationId'));
  const [draft, setDraft] = useState('');
  const [attachmentId, setAttachmentId] = useState('');
  const downloadMutation = useDocumentDownloadMutation();

  const { data: conversations = [], isLoading: conversationsLoading } = useConversations(userId);
  const { data: participants } = useApplicationParticipants(
    applicationId && !conversations.some((c) => c.applicationId === applicationId)
      ? applicationId
      : undefined,
  );
  const getOrCreateMutation = useGetOrCreateConversationMutation();

  useEffect(() => {
    if (!applicationId) return;
    const existing = conversations.find((c) => c.applicationId === applicationId);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    if (!participants) return;
    void getOrCreateMutation
      .mutateAsync({
        applicationId: participants.applicationId,
        applicantUserId: participants.applicantUserId,
        employerUserId: participants.employerUserId,
        employerId: participants.employerId,
        jobId: participants.jobId,
      })
      .then((conversation) => {
        setSelectedId(conversation.id);
        setParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('applicationId');
          next.set('conversationId', conversation.id);
          return next;
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, participants, conversations]);

  const selected = useMemo<Conversation | null>(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const { data: messages = [], isLoading: messagesLoading } = useMessages(selected?.id);
  useMessagesRealtime(selected?.id, userId);
  const sendMutation = useSendMessageMutation(userId);
  const markReadMutation = useMarkConversationReadMutation(userId);
  const isApplicantParty = Boolean(selected && userId && selected.applicantUserId === userId);
  const { data: myDocuments = [] } = useApplicantDocuments(isApplicantParty ? userId : undefined);
  const attachableDocuments = myDocuments.filter((doc) => doc.documentId);

  useEffect(() => {
    if (selected?.id && userId) {
      void markReadMutation.mutateAsync(selected.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, userId]);

  const onSend = async () => {
    if (!selected || (!draft.trim() && !attachmentId) || !userId) return;
    await sendMutation.mutateAsync({
      conversationId: selected.id,
      body: draft,
      attachmentDocumentId: attachmentId || null,
    });
    setDraft('');
    setAttachmentId('');
  };

  return (
    <DashboardShell title={t('nav.messages')} adminLink>
      <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
        {t('dashboard.messagesEyebrow')}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('nav.messages')}
      </h1>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
        <aside className="overflow-hidden rounded-3xl border border-border/70 bg-white/85 dark:border-border-dark dark:bg-slate-900/55">
          <div className="border-b border-border/60 px-4 py-3 dark:border-border-dark">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {t('dashboard.inbox')}
            </p>
          </div>
          {conversationsLoading ? (
            <p className="px-4 py-6 text-sm text-ink-muted dark:text-ink-muted-dark">
              {t('common.loading')}
            </p>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-muted dark:text-ink-muted-dark">
              {t('dashboard.noConversations')}
            </p>
          ) : (
            <ul className="max-h-[520px] divide-y divide-border/60 overflow-y-auto dark:divide-border-dark">
              {conversations.map((conversation) => {
                const counterpart = counterpartName(conversation, userId);
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      className={`w-full px-4 py-3 text-left text-sm transition ${
                        selectedId === conversation.id ? 'bg-brand/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                      onClick={() => {
                        setSelectedId(conversation.id);
                        setParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.delete('applicationId');
                          next.set('conversationId', conversation.id);
                          return next;
                        });
                      }}
                    >
                      <p className="font-semibold text-ink dark:text-ink-dark">{counterpart}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-muted dark:text-ink-muted-dark">
                        {conversation.subject || t('dashboard.applicationDiscussion')}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="flex flex-col rounded-3xl border border-border/70 bg-white/85 dark:border-border-dark dark:bg-slate-900/55">
          {!selected ? (
            <p className="px-6 py-10 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
              {getOrCreateMutation.isPending
                ? t('common.loading')
                : t('dashboard.selectConversation')}
            </p>
          ) : (
            <>
              <div className="border-b border-border/60 px-5 py-3 dark:border-border-dark">
                <p className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {counterpartName(selected, userId)}
                </p>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  {selected.subject || t('dashboard.applicationDiscussion')}
                </p>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ minHeight: 320, maxHeight: 420 }}>
                {messagesLoading ? (
                  <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                    {t('dashboard.noMessagesYet')}
                  </p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderUserId === userId;
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                            mine
                              ? 'bg-brand text-white'
                              : 'bg-slate-100 text-ink dark:bg-slate-800 dark:text-ink-dark'
                          }`}
                        >
                          <p>{message.body}</p>
                          {message.attachmentDocumentId ? (
                            <button
                              type="button"
                              className={`mt-1.5 block text-xs font-semibold underline ${mine ? 'text-white' : 'text-brand dark:text-brand-light'}`}
                              onClick={() =>
                                void downloadMutation.mutateAsync(message.attachmentDocumentId!).then((url) => {
                                  window.open(url, '_blank', 'noopener');
                                })
                              }
                            >
                              {t('dashboard.downloadAttachment')}
                            </button>
                          ) : null}
                          <p
                            className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-ink-muted dark:text-ink-muted-dark'}`}
                          >
                            {new Date(message.createdAt).toLocaleString()}
                            {mine ? ` · ${message.isRead ? t('dashboard.read') : t('dashboard.sent')}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                className="border-t border-border/60 px-4 py-3 dark:border-border-dark"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onSend();
                }}
              >
                {attachableDocuments.length > 0 ? (
                  <select
                    className="mb-2 h-9 w-full rounded-xl border border-border bg-[var(--bg)] px-2 text-xs dark:border-border-dark"
                    value={attachmentId}
                    onChange={(event) => setAttachmentId(event.target.value)}
                  >
                    <option value="">{t('dashboard.attachDocumentOptional')}</option>
                    {attachableDocuments.map((doc) => (
                      <option key={doc.documentId} value={doc.documentId}>
                        {doc.kind.replace(/_/g, ' ')} — {doc.fileName || doc.kind}
                      </option>
                    ))}
                  </select>
                ) : null}
                <div className="flex items-end gap-2">
                  <textarea
                    className="min-h-[44px] flex-1 rounded-2xl border border-border bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-brand dark:border-border-dark"
                    placeholder={t('dashboard.typeMessage')}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void onSend();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    className="rounded-2xl"
                    disabled={(!draft.trim() && !attachmentId) || sendMutation.isPending}
                  >
                    {t('common.send')}
                  </Button>
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
