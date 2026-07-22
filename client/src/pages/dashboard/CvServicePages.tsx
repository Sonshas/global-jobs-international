import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { formatCvPrice, getCvOrderFromPayments, getCvPreparationPrice } from '@/data/cv-services';
import { checkRateLimit } from '@/lib/security';
import { startPaymentCheckout } from '@/repositories/payments.repository';

function useCvOrder(userId: string | undefined) {
  return useQuery({
    queryKey: ['cv-order', userId],
    queryFn: () => getCvOrderFromPayments(userId!),
    enabled: Boolean(userId),
  });
}

export function CvPreparationPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const countryOfResidence =
    typeof user?.user_metadata?.country_of_residence === 'string'
      ? user.user_metadata.country_of_residence
      : undefined;

  const price = useMemo(() => getCvPreparationPrice(countryOfResidence), [countryOfResidence]);
  const { data: order = null } = useCvOrder(user?.id);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (order && order.status === 'completed') {
    return <Navigate to="/dashboard/cv-status" replace />;
  }

  const handleStartPayment = () => {
    navigate('/dashboard/cv-payment');
  };

  return (
    <DashboardShell title={t('dashboard.cvPreparation')}>
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
          {t('dashboard.cvOptionalService')}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
          {t('dashboard.cvPreparation')}
        </h1>
        <p className="mt-3 text-ink-muted dark:text-ink-muted-dark">{t('dashboard.cvOptionalDesc')}</p>

        <section className="mt-8 rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-ink-muted dark:text-ink-muted-dark">
                {t('dashboard.priceFor', { country: price.countryName })}
              </p>
              <p className="mt-1 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
                {formatCvPrice(price)}
              </p>
              <p className="mt-2 text-xs text-ink-muted dark:text-ink-muted-dark">
                {t('dashboard.cvPriceNote')}
              </p>
            </div>
            <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand dark:text-brand-light">
              {t('common.optional')}
            </span>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-ink-muted dark:text-ink-muted-dark">
            <li>• {t('dashboard.cvFeature1')}</li>
            <li>• {t('dashboard.cvFeature2')}</li>
            <li>• {t('dashboard.cvFeature3')}</li>
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button type="button" className="rounded-2xl sm:flex-1" onClick={handleStartPayment}>
              {t('apply.continueToPayment')}
            </Button>
            <Button href="/dashboard" variant="secondary" className="rounded-2xl sm:flex-1">
              {t('dashboard.skipForNow')}
            </Button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

export function CvPaymentPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const countryOfResidence =
    typeof user?.user_metadata?.country_of_residence === 'string'
      ? user.user_metadata.country_of_residence
      : undefined;
  const price = useMemo(() => getCvPreparationPrice(countryOfResidence), [countryOfResidence]);
  const { data: order = null } = useCvOrder(user?.id);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handlePay = async () => {
    if (!user.id) return;
    if (!checkRateLimit(`cv-pay:${user.id}`, 5, 60_000)) return;
    setBusy(true);
    try {
      const { url } = await startPaymentCheckout('cv_preparation');
      window.location.assign(url);
    } catch {
      setBusy(false);
    }
  };

  return (
    <DashboardShell title={t('dashboard.cvPayment')}>
      <div className="mx-auto max-w-xl">
        <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">
          {t('dashboard.cvPayment')}
        </h1>
        <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">{t('dashboard.cvPaymentDesc')}</p>

        <section className="mt-8 rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted dark:text-ink-muted-dark">{t('dashboard.service')}</dt>
              <dd className="font-medium">{t('dashboard.cvPreparation')}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted dark:text-ink-muted-dark">{t('dashboard.billingCountry')}</dt>
              <dd className="font-medium">{price.countryName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted dark:text-ink-muted-dark">{t('dashboard.amount')}</dt>
              <dd className="font-heading text-lg font-bold">{formatCvPrice(price)}</dd>
            </div>
            {order?.status === 'pending_payment' ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted dark:text-ink-muted-dark">{t('dashboard.orderStatus')}</dt>
                <dd className="font-medium text-amber-600 dark:text-amber-400">{t('dashboard.awaitingPayment')}</dd>
              </div>
            ) : null}
          </dl>

          <Button
            type="button"
            className="mt-8 w-full rounded-2xl"
            disabled={busy}
            onClick={() => void handlePay()}
          >
            {busy ? t('dashboard.processing') : t('dashboard.payAmount', { amount: formatCvPrice(price) })}
          </Button>
          <Button href="/dashboard/cv-preparation" variant="ghost" className="mt-2 w-full rounded-2xl">
            {t('common.back')}
          </Button>
        </section>
      </div>
    </DashboardShell>
  );
}

export function CvStatusPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: order = null, isLoading } = useCvOrder(user?.id);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isLoading && (!order || order.status !== 'completed')) {
    return <Navigate to="/dashboard/cv-preparation" replace />;
  }

  if (!order) {
    return (
      <DashboardShell title={t('dashboard.cvOrderStatus')}>
        <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={t('dashboard.cvOrderStatus')}>
      <div className="mx-auto max-w-xl">
        <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">
          {t('dashboard.cvOrderStatus')}
        </h1>
        <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">{t('dashboard.cvStatusDesc')}</p>

        <section className="mt-8 rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink-muted dark:text-ink-muted-dark">{t('common.status')}</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                order.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
              }`}
            >
              {order.status === 'completed' ? t('dashboard.completed') : t('dashboard.inProgress')}
            </span>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted dark:text-ink-muted-dark">{t('dashboard.amountPaid')}</dt>
              <dd className="font-medium">
                {order.currencyCode} {order.amount.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted dark:text-ink-muted-dark">{t('dashboard.updated')}</dt>
              <dd className="font-medium">{new Date(order.updatedAt).toLocaleString()}</dd>
            </div>
          </dl>

          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            {t('dashboard.cvReadyMessage')}
            <Button href="/dashboard" className="mt-4 w-full rounded-2xl" variant="primary">
              {t('dashboard.viewInDashboard')}
            </Button>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

function DashboardShell({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();

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
            <span className="hidden text-sm text-ink-muted sm:inline dark:text-ink-muted-dark">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button href="/dashboard" variant="ghost" size="sm">
              {t('nav.dashboard')}
            </Button>
            <ThemeToggle />
            <Button type="button" variant="secondary" size="sm" onClick={() => void signOut()}>
              {t('nav.signOut')}
            </Button>
          </div>
        </Container>
      </header>
      <main>
        <Container className="py-10 sm:py-14">{children}</Container>
      </main>
    </div>
  );
}
