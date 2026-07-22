import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { supabase } from '@/lib/supabase';

type AdminPaymentRow = {
  id: string;
  user_id: string;
  status: string;
  amount: number;
  currency: string;
  description: string | null;
  created_at: string;
};

/** Staff/admin can see all payments via the "Staff view all payments" RLS policy. */
async function fetchAllPayments(): Promise<AdminPaymentRow[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('id, user_id, status, amount, currency, description, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AdminPaymentRow[];
}

export function AdminPaymentsPage() {
  const { t } = useTranslation();
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['admin', 'payments'],
    queryFn: fetchAllPayments,
  });

  const totalSucceeded = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <DashboardShell title={t('admin.paymentsTitle')} adminLink>
      <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">{t('admin.paymentsTitle')}</h1>
      <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
        {t('admin.paymentsTotalSucceeded', { amount: totalSucceeded.toLocaleString() })}
      </p>

      {isLoading ? (
        <p className="mt-8 text-sm text-ink-muted">{t('common.loading')}</p>
      ) : payments.length === 0 ? (
        <p className="mt-8 text-sm text-ink-muted">{t('dashboard.noPayments')}</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-border/70 bg-white/85 dark:border-border-dark dark:bg-slate-900/55">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 text-xs font-semibold tracking-wide text-ink-muted uppercase dark:border-border-dark">
              <tr>
                <th className="px-4 py-3">{t('common.date')}</th>
                <th className="px-4 py-3">{t('dashboard.service')}</th>
                <th className="px-4 py-3">{t('dashboard.amount')}</th>
                <th className="px-4 py-3">{t('common.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-border-dark">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3">{new Date(payment.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{payment.description || '—'}</td>
                  <td className="px-4 py-3">
                    {payment.currency} {Number(payment.amount).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 capitalize">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
