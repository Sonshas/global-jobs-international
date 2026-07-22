import {
  formatMoney,
  resolveCountryCurrency,
  type CountryCurrency,
} from '@/data/country-currency';
import { simulatePaymentComplete } from '@/repositories/payments.repository';

export type PaymentServiceId =
  | 'cv_preparation'
  | 'document_verification'
  | 'police_clearance'
  | 'medical_appointment'
  | 'interview_preparation';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentRecord = {
  id: string;
  userId: string;
  serviceId: PaymentServiceId;
  name: string;
  description: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  amount: number;
  status: PaymentStatus;
  invoiceNumber: string;
  referenceNumber: string;
  receiptNumber: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

const serviceMeta: Record<
  PaymentServiceId,
  { name: string; description: string; baseUsd: number }
> = {
  cv_preparation: {
    name: 'CV Preparation',
    description: 'Professional international CV written for overseas recruitment.',
    baseUsd: 39,
  },
  document_verification: {
    name: 'Document Verification',
    description: 'Verification of passport, certificates, and application documents.',
    baseUsd: 25,
  },
  police_clearance: {
    name: 'Police Clearance Assistance',
    description: 'Guidance and processing support for police clearance certificates.',
    baseUsd: 35,
  },
  medical_appointment: {
    name: 'Medical Appointment Assistance',
    description: 'Scheduling and checklist support for pre-departure medical exams.',
    baseUsd: 45,
  },
  interview_preparation: {
    name: 'Interview Preparation',
    description: 'Coaching session before employer or embassy interviews.',
    baseUsd: 30,
  },
};

/** Local price tiers keyed by currency code (not live FX). */
const localAmountByCurrency: Record<string, Partial<Record<PaymentServiceId, number>>> = {
  KES: {
    cv_preparation: 3000,
    document_verification: 2500,
    police_clearance: 4500,
    medical_appointment: 5500,
    interview_preparation: 3500,
  },
  UGX: {
    cv_preparation: 85000,
    document_verification: 65000,
    police_clearance: 120000,
    medical_appointment: 140000,
    interview_preparation: 95000,
  },
  TZS: {
    cv_preparation: 95000,
    document_verification: 75000,
    police_clearance: 130000,
    medical_appointment: 150000,
    interview_preparation: 100000,
  },
  RWF: {
    cv_preparation: 35000,
    document_verification: 28000,
    police_clearance: 50000,
    medical_appointment: 60000,
    interview_preparation: 40000,
  },
  NGN: {
    cv_preparation: 35000,
    document_verification: 28000,
    police_clearance: 45000,
    medical_appointment: 55000,
    interview_preparation: 38000,
  },
  ZAR: {
    cv_preparation: 699,
    document_verification: 499,
    police_clearance: 799,
    medical_appointment: 899,
    interview_preparation: 649,
  },
  CAD: { cv_preparation: 49 },
  USD: { cv_preparation: 39 },
  AUD: { cv_preparation: 55 },
  GBP: { cv_preparation: 29 },
  EUR: { cv_preparation: 35 },
  QAR: { cv_preparation: 149 },
  SAR: { cv_preparation: 149 },
  AED: { cv_preparation: 149 },
  JPY: { cv_preparation: 5800 },
  SGD: { cv_preparation: 55 },
  KRW: { cv_preparation: 52000 },
};

export function getServiceQuote(
  serviceId: PaymentServiceId,
  countryName?: string | null,
): {
  serviceId: PaymentServiceId;
  name: string;
  description: string;
  country: string;
  currency: CountryCurrency;
  amount: number;
  formatted: string;
} {
  const currency = resolveCountryCurrency(countryName);
  const meta = serviceMeta[serviceId];
  const local =
    localAmountByCurrency[currency.currencyCode]?.[serviceId] ??
    localAmountByCurrency.USD?.[serviceId];
  const amount =
    local ??
    Math.round(meta.baseUsd * (currency.currencyCode === 'USD' ? 1 : 1.05));

  return {
    serviceId,
    name: meta.name,
    description: meta.description,
    country: currency.countryName,
    currency,
    amount,
    formatted: formatMoney(amount, currency),
  };
}

export function listPaymentServices(countryName?: string | null) {
  return (Object.keys(serviceMeta) as PaymentServiceId[]).map((id) =>
    getServiceQuote(id, countryName),
  );
}

/**
 * @deprecated Never use this in product flows. It delegates to the
 * development-only server simulator; Stripe webhooks confirm real payments.
 */
export async function markPaymentPaid(paymentId: string): Promise<void> {
  await simulatePaymentComplete(paymentId);
}

export function paymentReceiptText(record: PaymentRecord): string {
  return [
    'Global Jobs International — Payment Receipt',
    '----------------------------------------',
    `Service: ${record.name}`,
    `Invoice: ${record.invoiceNumber}`,
    `Reference: ${record.referenceNumber}`,
    `Receipt: ${record.receiptNumber}`,
    `Amount: ${formatMoney(record.amount, record)}`,
    `Country: ${record.country}`,
    `Status: ${record.status}`,
    `Date: ${record.paidAt || record.createdAt}`,
    '----------------------------------------',
    'Thank you for your payment.',
  ].join('\n');
}

export function downloadPaymentReceipt(record: PaymentRecord) {
  const blob = new Blob([paymentReceiptText(record)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${record.receiptNumber}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}
