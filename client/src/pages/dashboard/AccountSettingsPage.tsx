import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useUpsertUserSettingMutation, useUserSetting } from '@/hooks/queries/useSettingsQueries';

const NOTIFY_EMAIL_KEY = 'notify_email';

export function AccountSettingsPage() {
  const { t } = useTranslation();
  const { user, updatePassword } = useAuth();
  const { data: notifyEmailValue, isLoading: settingLoading } = useUserSetting<boolean>(
    user?.id,
    NOTIFY_EMAIL_KEY,
  );
  const upsertSetting = useUpsertUserSettingMutation(user?.id, NOTIFY_EMAIL_KEY);

  const [notifyEmail, setNotifyEmail] = useState(true);
  useEffect(() => {
    if (typeof notifyEmailValue === 'boolean') setNotifyEmail(notifyEmailValue);
  }, [notifyEmailValue]);

  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const onToggleNotifyEmail = async () => {
    const next = !notifyEmail;
    setNotifyEmail(next);
    await upsertSetting.mutateAsync(next);
  };

  const onSubmitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (passwordForm.password.length < 8) {
      setPasswordError(t('validation.passwordMin'));
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setPasswordError(t('validation.passwordMismatch'));
      return;
    }

    setPasswordSubmitting(true);
    try {
      const result = await updatePassword(passwordForm.password);
      if (result.error) {
        setPasswordError(result.error);
        return;
      }
      setPasswordMessage(t('dashboard.passwordUpdated'));
      setPasswordForm({ password: '', confirmPassword: '' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <DashboardShell title={t('nav.settings')} adminLink>
      <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
        {t('dashboard.accountSettingsEyebrow')}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('nav.settings')}
      </h1>

      <section className="mt-8 space-y-4 rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.accountEmail')}
        </h2>
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{user?.email}</p>
      </section>

      <section className="mt-6 space-y-4 rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.notificationPreferences')}
        </h2>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 px-4 py-3 text-sm dark:border-border-dark">
          <span className="font-medium text-ink dark:text-ink-dark">
            {t('dashboard.emailNotificationsLabel')}
          </span>
          <input
            type="checkbox"
            checked={notifyEmail}
            disabled={settingLoading || upsertSetting.isPending}
            onChange={() => void onToggleNotifyEmail()}
            className="h-5 w-5 accent-brand"
          />
        </label>
      </section>

      <section className="mt-6 space-y-4 rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.changePassword')}
        </h2>
        <form onSubmit={onSubmitPassword} className="grid gap-4 sm:grid-cols-2">
          {passwordError ? (
            <p className="sm:col-span-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
              {passwordError}
            </p>
          ) : null}
          {passwordMessage ? (
            <p className="sm:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
              {passwordMessage}
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink dark:text-ink-dark">
              {t('auth.newPassword')}
            </span>
            <input
              type="password"
              className="h-11 w-full rounded-xl border border-border bg-[var(--bg)] px-3 text-sm outline-none focus:border-brand dark:border-border-dark"
              value={passwordForm.password}
              onChange={(event) => setPasswordForm((f) => ({ ...f, password: event.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-ink dark:text-ink-dark">
              {t('auth.confirmNewPassword')}
            </span>
            <input
              type="password"
              className="h-11 w-full rounded-xl border border-border bg-[var(--bg)] px-3 text-sm outline-none focus:border-brand dark:border-border-dark"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((f) => ({ ...f, confirmPassword: event.target.value }))}
            />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-2xl" disabled={passwordSubmitting}>
              {passwordSubmitting ? t('auth.updating') : t('auth.updatePassword')}
            </Button>
          </div>
        </form>
      </section>

      <p className="mt-6 text-sm text-ink-muted dark:text-ink-muted-dark">
        {t('dashboard.themeLanguageHint')}
      </p>
    </DashboardShell>
  );
}
