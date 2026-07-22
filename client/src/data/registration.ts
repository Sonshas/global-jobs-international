export type CountryOption = {
  iso: string;
  name: string;
  dialCode: string;
};

/** Common international destinations + dial codes for registration. */
export const registrationCountries: CountryOption[] = [
  { iso: 'AF', name: 'Afghanistan', dialCode: '+93' },
  { iso: 'AL', name: 'Albania', dialCode: '+355' },
  { iso: 'DZ', name: 'Algeria', dialCode: '+213' },
  { iso: 'AR', name: 'Argentina', dialCode: '+54' },
  { iso: 'AU', name: 'Australia', dialCode: '+61' },
  { iso: 'AT', name: 'Austria', dialCode: '+43' },
  { iso: 'BH', name: 'Bahrain', dialCode: '+973' },
  { iso: 'BD', name: 'Bangladesh', dialCode: '+880' },
  { iso: 'BE', name: 'Belgium', dialCode: '+32' },
  { iso: 'BR', name: 'Brazil', dialCode: '+55' },
  { iso: 'CA', name: 'Canada', dialCode: '+1' },
  { iso: 'CN', name: 'China', dialCode: '+86' },
  { iso: 'CO', name: 'Colombia', dialCode: '+57' },
  { iso: 'EG', name: 'Egypt', dialCode: '+20' },
  { iso: 'ET', name: 'Ethiopia', dialCode: '+251' },
  { iso: 'FI', name: 'Finland', dialCode: '+358' },
  { iso: 'FR', name: 'France', dialCode: '+33' },
  { iso: 'DE', name: 'Germany', dialCode: '+49' },
  { iso: 'GH', name: 'Ghana', dialCode: '+233' },
  { iso: 'GR', name: 'Greece', dialCode: '+30' },
  { iso: 'HK', name: 'Hong Kong', dialCode: '+852' },
  { iso: 'IN', name: 'India', dialCode: '+91' },
  { iso: 'ID', name: 'Indonesia', dialCode: '+62' },
  { iso: 'IE', name: 'Ireland', dialCode: '+353' },
  { iso: 'IT', name: 'Italy', dialCode: '+39' },
  { iso: 'JM', name: 'Jamaica', dialCode: '+1' },
  { iso: 'JP', name: 'Japan', dialCode: '+81' },
  { iso: 'JO', name: 'Jordan', dialCode: '+962' },
  { iso: 'KE', name: 'Kenya', dialCode: '+254' },
  { iso: 'KW', name: 'Kuwait', dialCode: '+965' },
  { iso: 'LB', name: 'Lebanon', dialCode: '+961' },
  { iso: 'MY', name: 'Malaysia', dialCode: '+60' },
  { iso: 'MX', name: 'Mexico', dialCode: '+52' },
  { iso: 'MA', name: 'Morocco', dialCode: '+212' },
  { iso: 'NP', name: 'Nepal', dialCode: '+977' },
  { iso: 'NL', name: 'Netherlands', dialCode: '+31' },
  { iso: 'NZ', name: 'New Zealand', dialCode: '+64' },
  { iso: 'NG', name: 'Nigeria', dialCode: '+234' },
  { iso: 'NO', name: 'Norway', dialCode: '+47' },
  { iso: 'OM', name: 'Oman', dialCode: '+968' },
  { iso: 'PK', name: 'Pakistan', dialCode: '+92' },
  { iso: 'PH', name: 'Philippines', dialCode: '+63' },
  { iso: 'PL', name: 'Poland', dialCode: '+48' },
  { iso: 'PT', name: 'Portugal', dialCode: '+351' },
  { iso: 'QA', name: 'Qatar', dialCode: '+974' },
  { iso: 'RO', name: 'Romania', dialCode: '+40' },
  { iso: 'RU', name: 'Russia', dialCode: '+7' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '+966' },
  { iso: 'SG', name: 'Singapore', dialCode: '+65' },
  { iso: 'ZA', name: 'South Africa', dialCode: '+27' },
  { iso: 'KR', name: 'South Korea', dialCode: '+82' },
  { iso: 'ES', name: 'Spain', dialCode: '+34' },
  { iso: 'LK', name: 'Sri Lanka', dialCode: '+94' },
  { iso: 'SE', name: 'Sweden', dialCode: '+46' },
  { iso: 'CH', name: 'Switzerland', dialCode: '+41' },
  { iso: 'TW', name: 'Taiwan', dialCode: '+886' },
  { iso: 'TZ', name: 'Tanzania', dialCode: '+255' },
  { iso: 'TH', name: 'Thailand', dialCode: '+66' },
  { iso: 'TR', name: 'Turkey', dialCode: '+90' },
  { iso: 'UG', name: 'Uganda', dialCode: '+256' },
  { iso: 'UA', name: 'Ukraine', dialCode: '+380' },
  { iso: 'AE', name: 'United Arab Emirates', dialCode: '+971' },
  { iso: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { iso: 'US', name: 'United States', dialCode: '+1' },
  { iso: 'VN', name: 'Vietnam', dialCode: '+84' },
  { iso: 'ZM', name: 'Zambia', dialCode: '+260' },
  { iso: 'ZW', name: 'Zimbabwe', dialCode: '+263' },
];

export const workDestinationCountries = [
  'Canada',
  'Australia',
  'United Kingdom',
  'Germany',
  'Ireland',
  'Qatar',
  'United Arab Emirates',
  'Saudi Arabia',
  'New Zealand',
  'United States',
] as const;

export const passportStatuses = [
  { value: 'valid', label: 'Yes — I have a valid passport' },
  { value: 'expired', label: 'Yes — but it is expired' },
  { value: 'applying', label: 'No — I am applying for one' },
  { value: 'none', label: 'No — I do not have a passport' },
] as const;

export const jobSkillCategories = [
  { value: 'skilled', label: 'Skilled' },
  { value: 'unskilled', label: 'Unskilled' },
] as const;

export function flagUrl(iso: string) {
  return `https://flagcdn.com/w40/${iso.toLowerCase()}.png`;
}

export function findCountryByIso(iso: string) {
  return registrationCountries.find((country) => country.iso === iso);
}
