import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { useRbac } from '@/hooks/useRbac';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { canAccessAdmin, canAccessEmployer, canAccessSuperAdmin } from '@/lib/security';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotifications,
} from '@/hooks/queries/useNotificationsQueries';
import { useUnreadMessageCount } from '@/hooks/queries/useMessagingQueries';

export function DashboardShell({
  title,
  children,
  adminLink = false,
}: {
  title?: string;
  children: ReactNode;
  adminLink?: boolean;
}) {
  const { t } = useTranslation();
  useDocumentTitle(title ? `${title} | ${t('app.name')}` : t('app.name'));
  const { user, signOut } = useAuth();
  const { data: rbac } = useRbac(user?.id);
  const [open, setOpen] = useState(false);
  const { data: items = [] } = useNotifications(user?.id);
  const markReadMutation = useMarkNotificationReadMutation(user?.id);
  const markAllReadMutation = useMarkAllNotificationsReadMutation(user?.id);
  const unread = items.filter((item) => !item.read).length;
  const { data: unreadMessages = 0 } = useUnreadMessageCount(user?.id);

  const showEmployer = canAccessEmployer(user, rbac ?? null);
  const showStaffAdmin = adminLink && canAccessAdmin(user, rbac ?? null);
  const showSuperAdmin = adminLink && canAccessSuperAdmin(user, rbac ?? null);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-border bg-[var(--nav-bg)] backdrop-blur-md dark:border-border-dark">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="font-heading text-lg font-bold tracking-tight text-brand dark:text-brand-light"
            >
              {t('app.name')}
            </Link>
            {title ? (
              <span className="hidden text-sm text-ink-muted sm:inline dark:text-ink-muted-dark">
                {title}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white dark:border-border-dark dark:bg-surface-elevated-dark"
                aria-label={t('notifications.title')}
                onClick={() => setOpen((value) => !value)}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                  <path
                    d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7Zm6 11a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {unread > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                ) : null}
              </button>
              {open ? (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-white p-3 shadow-xl dark:border-border-dark dark:bg-surface-elevated-dark">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold">{t('notifications.title')}</p>
                    <button
                      type="button"
                      className="text-xs font-medium text-brand"
                      onClick={() => {
                        if (!user?.id) return;
                        void markAllReadMutation.mutateAsync();
                      }}
                    >
                      {t('notifications.markAllRead')}
                    </button>
                  </div>
                  <ul className="max-h-72 space-y-2 overflow-y-auto">
                    {items.length === 0 ? (
                      <li className="px-2 py-4 text-sm text-ink-muted">{t('notifications.empty')}</li>
                    ) : (
                      items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                              item.read ? 'bg-transparent' : 'bg-brand/5'
                            }`}
                            onClick={() => {
                              void markReadMutation.mutateAsync(item.id);
                              if (item.href) window.location.assign(item.href);
                            }}
                          >
                            <p className="font-semibold text-ink dark:text-ink-dark">{item.title}</p>
                            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                              {item.body}
                            </p>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              ) : null}
            </div>
            <Button href="/dashboard" variant="ghost" size="sm">
              {t('nav.dashboard')}
            </Button>
            {showEmployer ? (
              <Button href="/dashboard/employer" variant="ghost" size="sm">
                {t('nav.employer')}
              </Button>
            ) : null}
            <Button href="/dashboard/applications" variant="ghost" size="sm">
              {t('nav.applications')}
            </Button>
            <Button href="/dashboard/payments" variant="ghost" size="sm">
              {t('nav.payments')}
            </Button>
            <Button href="/dashboard/documents" variant="ghost" size="sm">
              {t('nav.documents')}
            </Button>
            <Button href="/dashboard/saved-jobs" variant="ghost" size="sm">
              {t('nav.savedJobs')}
            </Button>
            <Button href="/dashboard/messages" variant="ghost" size="sm" className="relative">
              {t('nav.messages')}
              {unreadMessages > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadMessages}
                </span>
              ) : null}
            </Button>
            <Button href="/dashboard/calendar" variant="ghost" size="sm">
              {t('nav.calendar')}
            </Button>
            <Button href="/dashboard/settings" variant="ghost" size="sm">
              {t('nav.settings')}
            </Button>
            {showStaffAdmin ? (
              <>
                {showSuperAdmin ? (
                  <Button href="/admin/super" variant="ghost" size="sm">
                    {t('nav.superAdmin')}
                  </Button>
                ) : null}
                <Button href="/admin/reports" variant="ghost" size="sm">
                  {t('nav.reports')}
                </Button>
                <Button href="/admin/jobs" variant="ghost" size="sm">
                  {t('nav.jobs')}
                </Button>
                <Button href="/admin/employers" variant="ghost" size="sm">
                  {t('nav.employers')}
                </Button>
                <Button href="/admin/applications" variant="ghost" size="sm">
                  {t('nav.pipeline')}
                </Button>
              </>
            ) : null}
            <LanguageSelector />
            <ThemeToggle />
            <Button type="button" variant="secondary" size="sm" onClick={() => void signOut()}>
              {t('nav.signOut')}
            </Button>
          </div>
        </Container>
      </header>
      <main id="main-content">
        <Container className="py-10 sm:py-14">{children}</Container>
      </main>
    </div>
  );
}
