import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  useMarkConversationReadMutation,
  useMessages,
  useMessagesRealtime,
  useSendMessageMutation,
  useSupportConversations,
} from '@/hooks/queries/useMessagingQueries';
import { claimSupportConversation, type Conversation } from '@/repositories/messaging.repository';

/** Staff/admin inbox for employer <-> support conversations (kind = 'support'). */
export function AdminSupportInboxPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading } = useSupportConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [claiming, setClaiming] = useState(false);

  const selected = useMemo<Conversation | null>(
    () => conversations.find((c) => c.id === selectedId) ?? conversations[0] ?? null,
    [conversations, selectedId],
  );

  const { data: messages = [], isLoading: messagesLoading } = useMessages(selected?.id);
  useMessagesRealtime(selected?.id, userId);
  const sendMutation = useSendMessageMutation(userId);
  const markReadMutation = useMarkConversationReadMutation(userId);

  const onSend = async () => {
    if (!selected || !draft.trim() || !userId) return;
    await sendMutation.mutateAsync({ conversationId: selected.id, body: draft });
    setDraft('');
    void markReadMutation.mutateAsync(selected.id);
  };

  const onClaim = async () => {
    if (!selected || !userId) return;
    setClaiming(true);
    try {
      await claimSupportConversation(selected.id, userId);
      void queryClient.invalidateQueries({ queryKey: ['messaging', 'support-conversations'] });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <DashboardShell title={t('dashboard.supportInbox')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">{t('dashboard.supportInbox')}</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">{t('admin.supportInboxDesc')}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.4fr]">
        <aside className="overflow-hidden rounded-3xl border border-border/70 bg-white/85 dark:border-border-dark dark:bg-slate-900/55">
          {isLoading ? (
            <p className="px-4 py-6 text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-muted dark:text-ink-muted-dark">{t('dashboard.noConversations')}</p>
          ) : (
            <ul className="max-h-[520px] divide-y divide-border/60 overflow-y-auto dark:divide-border-dark">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    className={`w-full px-4 py-3 text-left text-sm transition ${
                      selected?.id === conversation.id ? 'bg-brand/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                    onClick={() => setSelectedId(conversation.id)}
                  >
                    <p className="font-semibold text-ink dark:text-ink-dark">
                      {conversation.employerName || t('common.employer')}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-muted dark:text-ink-muted-dark">
                      {conversation.staffUserId ? t('admin.claimed') : t('admin.unclaimed')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex flex-col rounded-3xl border border-border/70 bg-white/85 dark:border-border-dark dark:bg-slate-900/55">
          {!selected ? (
            <p className="px-6 py-10 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
              {t('dashboard.selectConversation')}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3 dark:border-border-dark">
                <p className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {selected.employerName || t('common.employer')}
                </p>
                {!selected.staffUserId ? (
                  <Button type="button" size="sm" variant="outline" disabled={claiming} onClick={() => void onClaim()}>
                    {t('admin.claim')}
                  </Button>
                ) : null}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" style={{ minHeight: 320, maxHeight: 420 }}>
                {messagesLoading ? (
                  <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('dashboard.noMessagesYet')}</p>
                ) : (
                  messages.map((message) => {
                    const mine = message.senderUserId === userId;
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                            mine ? 'bg-brand text-white' : 'bg-slate-100 text-ink dark:bg-slate-800 dark:text-ink-dark'
                          }`}
                        >
                          <p>{message.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-ink-muted dark:text-ink-muted-dark'}`}>
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <form
                className="flex items-end gap-2 border-t border-border/60 px-4 py-3 dark:border-border-dark"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onSend();
                }}
              >
                <textarea
                  className="min-h-[44px] flex-1 rounded-2xl border border-border bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-brand dark:border-border-dark"
                  placeholder={t('dashboard.typeMessage')}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Button type="submit" className="rounded-2xl" disabled={!draft.trim() || sendMutation.isPending}>
                  {t('common.send')}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
