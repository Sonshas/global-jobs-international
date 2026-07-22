import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { billingCountryFromUser } from '@/data/country-currency';
import {
  downloadPaymentReceipt,
  listPaymentServices,
  type PaymentRecord,
  type PaymentServiceId,
} from '@/data/payments';
import { checkRateLimit } from '@/lib/security';
import { listMyPaymentRecords, startPaymentCheckout } from '@/repositories/payments.repository';

export function PaymentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id || '';
  const country = billingCountryFromUser(user);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [busyService, setBusyService] = useState<PaymentServiceId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const services = useMemo(() => listPaymentServices(country), [country]);

  useEffect(() => {
    if (!userId) return;
    void listMyPaymentRecords().then(setHistory).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Unable to load payments.');
    });
  }, [userId]);

  const pay = async (serviceId: PaymentServiceId) => {
    if (!userId) return;
    if (!checkRateLimit(`pay:${userId}`, 10, 60_000)) return;
    setError(null);
    setBusyService(serviceId);
    try {
      const { url } = await startPaymentCheckout(serviceId);
      window.location.assign(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start checkout.');
      setBusyService(null);
    }
  };

  return (
    <DashboardShell title={t('nav.payments')} adminLink>
      <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
        {t('dashboard.billing')}
      </p>
      <h1 className="mt-2 font-heading text-3xl font-bold text-ink dark:text-ink-dark">
        {t('dashboard.paymentsTitle')}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted dark:text-ink-muted-dark">
        {t('dashboard.paymentsCurrencyHint', {
          country: country || t('dashboard.international'),
        })}
      </p>
      {error ? <p className="mt-4 text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.serviceId}
            className="rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55"
          >
            <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
              {service.name}
            </h2>
            <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
              {service.description}
            </p>
            <p className="mt-4 font-heading text-2xl font-bold text-brand dark:text-brand-light">
              {service.formatted}
            </p>
            <Button
              type="button"
              className="mt-4 w-full rounded-2xl"
              disabled={busyService !== null}
              onClick={() => void pay(service.serviceId)}
            >
              {busyService === service.serviceId ? t('dashboard.processing') : t('common.payNow')}
            </Button>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
        <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
          {t('dashboard.paymentHistory')}
        </h2>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">{t('dashboard.noPayments')}</p>
        ) : (
          <ul className="mt-4 divide-y divide-border/60 dark:divide-border-dark">
            {history.map((record) => (
              <li key={record.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
                <div>
                  <p className="font-semibold text-ink dark:text-ink-dark">{record.name}</p>
                  <p className="text-ink-muted">
                    {record.invoiceNumber} · {record.referenceNumber} ·{' '}
                    {record.paidAt
                      ? new Date(record.paidAt).toLocaleString()
                      : t('dashboard.pendingPayment')}
                  </p>
                  <p className="text-ink-muted">
                    {record.currencySymbol} {record.amount.toLocaleString()} · {record.status}
                  </p>
                </div>
                {record.status === 'paid' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => downloadPaymentReceipt(record)}
                  >
                    {t('dashboard.downloadReceipt')}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </DashboardShell>
  );
}
