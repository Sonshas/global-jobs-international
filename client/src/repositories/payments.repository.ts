import type { PaymentRecord, PaymentServiceId } from '@/data/payments';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import { logAudit } from '@/lib/security';

type DbPaymentRow = {
  id: string;
  user_id: string;
  status: string;
  amount: number | string;
  currency: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Json;
};

function apiBase(): string | null {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  return raw ? raw.replace(/\/$/, '') : null;
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error('Sign in is required to manage payments.');
  return { Authorization: `Bearer ${data.session.access_token}` };
}

function asObject(value: Json): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function currencySymbol(currencyCode: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? currencyCode;
}

export function paymentFromRow(row: DbPaymentRow): PaymentRecord {
  const metadata = asObject(row.metadata);
  const serviceId = (metadata.serviceId as PaymentServiceId | undefined) ?? 'cv_preparation';
  const name = (metadata.serviceName as string | undefined) ?? 'Global Jobs International service';
  const dbStatus = String(row.status);
  const status: PaymentRecord['status'] =
    dbStatus === 'succeeded' || dbStatus === 'paid'
      ? 'paid'
      : dbStatus === 'failed'
        ? 'failed'
        : dbStatus === 'refunded'
          ? 'refunded'
          : 'pending';
  return {
    id: row.id,
    userId: row.user_id,
    serviceId,
    name,
    description: row.description ?? '',
    country: (metadata.country as string | undefined) ?? 'International',
    currencyCode: row.currency,
    currencySymbol: currencySymbol(row.currency),
    amount: Number(row.amount),
    status,
    invoiceNumber: (metadata.invoiceNumber as string | undefined) ?? row.id.slice(0, 8).toUpperCase(),
    referenceNumber: (metadata.stripeCheckoutSessionId as string | undefined) ?? row.id,
    receiptNumber: (metadata.receiptNumber as string | undefined) ?? row.id.slice(0, 8).toUpperCase(),
    paidAt: row.paid_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listMyPaymentRecords(): Promise<PaymentRecord[]> {
  const base = apiBase();
  if (base) {
    const response = await fetch(`${base}/payments/mine`, { headers: await authHeaders() });
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Unable to load payments.');
    const body = (await response.json()) as { payments: DbPaymentRow[] };
    return body.payments.map(paymentFromRow);
  }

  const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DbPaymentRow[]).map(paymentFromRow);
}

export async function startPaymentCheckout(serviceId: PaymentServiceId): Promise<{ url: string; paymentId: string }> {
  const base = apiBase();
  if (!base) throw new Error('VITE_API_URL is required to start Stripe Checkout.');
  const response = await fetch(`${base}/payments/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ serviceId }),
  });
  const body = (await response.json().catch(() => null)) as { url?: string; paymentId?: string; error?: string } | null;
  if (!response.ok || !body?.url || !body.paymentId) throw new Error(body?.error ?? 'Unable to start checkout.');
  logAudit({ action: 'payment_checkout_started', detail: `${serviceId}:${body.paymentId}` });
  return { url: body.url, paymentId: body.paymentId };
}

/** Development-only helper. The API rejects this outside APP_ENV=development. */
export async function simulatePaymentComplete(paymentId: string): Promise<void> {
  const base = apiBase();
  if (!base) throw new Error('VITE_API_URL is required for the development simulator.');
  const response = await fetch(`${base}/payments/dev-simulate-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ paymentId }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Unable to simulate payment.');
}
