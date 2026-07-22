import { formatMoney, resolveCountryCurrency } from '@/data/country-currency';
import { listMyPaymentRecords } from '@/repositories/payments.repository';

export type CvServicePrice = {
  countryName: string;
  countryIso: string;
  currencyCode: string;
  currencySymbol: string;
  amount: number;
};

/**
 * Configured local CV preparation prices by billing/residence country.
 * Add or update entries here — do not derive via live FX conversion.
 */
export const cvPreparationPrices: CvServicePrice[] = [
  {
    countryName: 'Kenya',
    countryIso: 'KE',
    currencyCode: 'KES',
    currencySymbol: 'KES',
    amount: 3000,
  },
  {
    countryName: 'Nigeria',
    countryIso: 'NG',
    currencyCode: 'NGN',
    currencySymbol: '₦',
    amount: 35000,
  },
  {
    countryName: 'Uganda',
    countryIso: 'UG',
    currencyCode: 'UGX',
    currencySymbol: 'UGX',
    amount: 85000,
  },
  {
    countryName: 'Tanzania',
    countryIso: 'TZ',
    currencyCode: 'TZS',
    currencySymbol: 'TZS',
    amount: 95000,
  },
  {
    countryName: 'Ghana',
    countryIso: 'GH',
    currencyCode: 'GHS',
    currencySymbol: 'GH₵',
    amount: 320,
  },
  {
    countryName: 'Ethiopia',
    countryIso: 'ET',
    currencyCode: 'ETB',
    currencySymbol: 'ETB',
    amount: 4500,
  },
  {
    countryName: 'Rwanda',
    countryIso: 'RW',
    currencyCode: 'RWF',
    currencySymbol: 'RWF',
    amount: 35000,
  },
  {
    countryName: 'Zambia',
    countryIso: 'ZM',
    currencyCode: 'ZMW',
    currencySymbol: 'ZMW',
    amount: 650,
  },
  {
    countryName: 'Zimbabwe',
    countryIso: 'ZW',
    currencyCode: 'USD',
    currencySymbol: '$',
    amount: 39,
  },
  {
    countryName: 'South Africa',
    countryIso: 'ZA',
    currencyCode: 'ZAR',
    currencySymbol: 'R',
    amount: 699,
  },
  {
    countryName: 'India',
    countryIso: 'IN',
    currencyCode: 'INR',
    currencySymbol: '₹',
    amount: 2499,
  },
  {
    countryName: 'Philippines',
    countryIso: 'PH',
    currencyCode: 'PHP',
    currencySymbol: '₱',
    amount: 1999,
  },
  {
    countryName: 'Pakistan',
    countryIso: 'PK',
    currencyCode: 'PKR',
    currencySymbol: 'PKR',
    amount: 8999,
  },
  {
    countryName: 'Bangladesh',
    countryIso: 'BD',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    amount: 3499,
  },
  {
    countryName: 'Nepal',
    countryIso: 'NP',
    currencyCode: 'NPR',
    currencySymbol: 'NPR',
    amount: 4500,
  },
  {
    countryName: 'United Kingdom',
    countryIso: 'GB',
    currencyCode: 'GBP',
    currencySymbol: '£',
    amount: 29,
  },
  {
    countryName: 'United States',
    countryIso: 'US',
    currencyCode: 'USD',
    currencySymbol: '$',
    amount: 39,
  },
  {
    countryName: 'Canada',
    countryIso: 'CA',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    amount: 49,
  },
  {
    countryName: 'Australia',
    countryIso: 'AU',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    amount: 55,
  },
  {
    countryName: 'United Arab Emirates',
    countryIso: 'AE',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    amount: 149,
  },
  {
    countryName: 'Saudi Arabia',
    countryIso: 'SA',
    currencyCode: 'SAR',
    currencySymbol: 'SAR',
    amount: 149,
  },
  {
    countryName: 'Qatar',
    countryIso: 'QA',
    currencyCode: 'QAR',
    currencySymbol: 'QAR',
    amount: 149,
  },
  { countryName: 'Germany', countryIso: 'DE', currencyCode: 'EUR', currencySymbol: '€', amount: 35 },
  { countryName: 'France', countryIso: 'FR', currencyCode: 'EUR', currencySymbol: '€', amount: 35 },
  { countryName: 'Ireland', countryIso: 'IE', currencyCode: 'EUR', currencySymbol: '€', amount: 35 },
  { countryName: 'Japan', countryIso: 'JP', currencyCode: 'JPY', currencySymbol: '¥', amount: 5800 },
  { countryName: 'Singapore', countryIso: 'SG', currencyCode: 'SGD', currencySymbol: 'S$', amount: 55 },
  { countryName: 'South Korea', countryIso: 'KR', currencyCode: 'KRW', currencySymbol: '₩', amount: 52000 },
];

export const defaultCvPreparationPrice: CvServicePrice = {
  countryName: 'International',
  countryIso: 'XX',
  currencyCode: 'USD',
  currencySymbol: '$',
  amount: 39,
};

export function getCvPreparationPrice(countryName?: string | null): CvServicePrice {
  const currency = resolveCountryCurrency(countryName);
  const fromList = cvPreparationPrices.find(
    (price) => price.countryName.toLowerCase() === currency.countryName.toLowerCase(),
  );
  if (fromList) return fromList;
  if (currency.countryName !== 'International') {
    return {
      countryName: currency.countryName,
      countryIso: currency.countryIso,
      currencyCode: currency.currencyCode,
      currencySymbol: currency.currencySymbol,
      amount: defaultCvPreparationPrice.amount,
    };
  }
  return defaultCvPreparationPrice;
}

export function formatCvPrice(price: CvServicePrice): string {
  return formatMoney(price.amount, price);
}

export type CvOrderStatus = 'none' | 'offered' | 'pending_payment' | 'in_progress' | 'completed';

export type CvOrderRecord = {
  userId: string;
  status: CvOrderStatus;
  countryName: string;
  currencyCode: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

/**
 * Legacy helpers retained as no-ops / in-memory only.
 * CV order status is loaded exclusively from `public.payments` via
 * `getCvOrderFromPayments`.
 */
export function readCvOrder(_userId: string): CvOrderRecord | null {
  return null;
}

export function writeCvOrder(_order: CvOrderRecord) {
  // no-op — payments table is the source of truth
}

export function upsertCvOrder(
  userId: string,
  patch: Partial<CvOrderRecord> & Pick<CvOrderRecord, 'status'>,
): CvOrderRecord {
  const now = new Date().toISOString();
  return {
    userId,
    status: patch.status,
    countryName: patch.countryName ?? 'International',
    currencyCode: patch.currencyCode ?? 'USD',
    amount: patch.amount ?? defaultCvPreparationPrice.amount,
    createdAt: now,
    updatedAt: now,
    completedAt: patch.completedAt,
  };
}

/**
 * Authoritative CV order status, derived from `public.payments` (Stripe webhook
 * is the only writer of payment status). Use this everywhere except the
 * synchronous apply-wizard guard.
 */
export async function getCvOrderFromPayments(userId: string): Promise<CvOrderRecord | null> {
  try {
    const records = await listMyPaymentRecords();
    const cvPayments = records.filter(
      (record) => record.userId === userId && record.serviceId === 'cv_preparation',
    );
    if (!cvPayments.length) return null;

    const latest = [...cvPayments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const status: CvOrderStatus =
      latest.status === 'paid'
        ? 'completed'
        : latest.status === 'failed' || latest.status === 'refunded'
          ? 'none'
          : 'pending_payment';

    return {
      userId,
      status,
      countryName: latest.country,
      currencyCode: latest.currencyCode,
      amount: latest.amount,
      createdAt: latest.createdAt,
      updatedAt: latest.updatedAt,
      completedAt: latest.paidAt,
    };
  } catch {
    return null;
  }
}
