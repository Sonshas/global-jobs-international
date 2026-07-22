export type CountryCurrency = {
  countryName: string;
  countryIso: string;
  currencyCode: string;
  currencySymbol: string;
};

/** Local billing currencies — prices are configured per country, not FX-converted. */
export const countryCurrencies: CountryCurrency[] = [
  { countryName: 'Kenya', countryIso: 'KE', currencyCode: 'KES', currencySymbol: 'KES' },
  { countryName: 'Uganda', countryIso: 'UG', currencyCode: 'UGX', currencySymbol: 'UGX' },
  { countryName: 'Tanzania', countryIso: 'TZ', currencyCode: 'TZS', currencySymbol: 'TZS' },
  { countryName: 'Rwanda', countryIso: 'RW', currencyCode: 'RWF', currencySymbol: 'RWF' },
  { countryName: 'Nigeria', countryIso: 'NG', currencyCode: 'NGN', currencySymbol: '₦' },
  { countryName: 'South Africa', countryIso: 'ZA', currencyCode: 'ZAR', currencySymbol: 'R' },
  { countryName: 'Canada', countryIso: 'CA', currencyCode: 'CAD', currencySymbol: 'CA$' },
  { countryName: 'United States', countryIso: 'US', currencyCode: 'USD', currencySymbol: '$' },
  { countryName: 'Australia', countryIso: 'AU', currencyCode: 'AUD', currencySymbol: 'A$' },
  { countryName: 'United Kingdom', countryIso: 'GB', currencyCode: 'GBP', currencySymbol: '£' },
  { countryName: 'Germany', countryIso: 'DE', currencyCode: 'EUR', currencySymbol: '€' },
  { countryName: 'France', countryIso: 'FR', currencyCode: 'EUR', currencySymbol: '€' },
  { countryName: 'Ireland', countryIso: 'IE', currencyCode: 'EUR', currencySymbol: '€' },
  { countryName: 'Qatar', countryIso: 'QA', currencyCode: 'QAR', currencySymbol: 'QAR' },
  { countryName: 'Saudi Arabia', countryIso: 'SA', currencyCode: 'SAR', currencySymbol: 'SAR' },
  { countryName: 'United Arab Emirates', countryIso: 'AE', currencyCode: 'AED', currencySymbol: 'AED' },
  { countryName: 'Japan', countryIso: 'JP', currencyCode: 'JPY', currencySymbol: '¥' },
  { countryName: 'Singapore', countryIso: 'SG', currencyCode: 'SGD', currencySymbol: 'S$' },
  { countryName: 'South Korea', countryIso: 'KR', currencyCode: 'KRW', currencySymbol: '₩' },
  { countryName: 'Ghana', countryIso: 'GH', currencyCode: 'GHS', currencySymbol: 'GH₵' },
  { countryName: 'Ethiopia', countryIso: 'ET', currencyCode: 'ETB', currencySymbol: 'ETB' },
  { countryName: 'India', countryIso: 'IN', currencyCode: 'INR', currencySymbol: '₹' },
  { countryName: 'Philippines', countryIso: 'PH', currencyCode: 'PHP', currencySymbol: '₱' },
  { countryName: 'Pakistan', countryIso: 'PK', currencyCode: 'PKR', currencySymbol: 'PKR' },
  { countryName: 'Bangladesh', countryIso: 'BD', currencyCode: 'BDT', currencySymbol: '৳' },
  { countryName: 'Nepal', countryIso: 'NP', currencyCode: 'NPR', currencySymbol: 'NPR' },
  { countryName: 'Zambia', countryIso: 'ZM', currencyCode: 'ZMW', currencySymbol: 'ZMW' },
  { countryName: 'Zimbabwe', countryIso: 'ZW', currencyCode: 'USD', currencySymbol: '$' },
];

export const defaultCountryCurrency: CountryCurrency = {
  countryName: 'International',
  countryIso: 'XX',
  currencyCode: 'USD',
  currencySymbol: '$',
};

export function resolveCountryCurrency(countryName?: string | null): CountryCurrency {
  if (!countryName) return defaultCountryCurrency;
  const normalized = countryName.toLowerCase().trim();
  const match = countryCurrencies.find(
    (row) =>
      row.countryName.toLowerCase() === normalized ||
      row.countryIso.toLowerCase() === normalized ||
      row.currencyCode.toLowerCase() === normalized,
  );
  return match ?? defaultCountryCurrency;
}

export function formatMoney(
  amount: number,
  currency: Pick<CountryCurrency, 'currencySymbol' | 'currencyCode'>,
): string {
  return `${currency.currencySymbol} ${amount.toLocaleString(undefined, {
    maximumFractionDigits: currency.currencyCode === 'JPY' || currency.currencyCode === 'KRW' ? 0 : 2,
  })}`;
}

export function billingCountryFromUser(user: {
  user_metadata?: Record<string, unknown>;
} | null): string | undefined {
  const meta = user?.user_metadata;
  if (!meta) return undefined;
  if (typeof meta.country_of_residence === 'string' && meta.country_of_residence.trim()) {
    return meta.country_of_residence.trim();
  }
  return undefined;
}
