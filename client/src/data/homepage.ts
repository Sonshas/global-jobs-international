import {
  getFeaturedJobs,
  getJobsByCountry,
  jobCatalogStats,
  MANDATORY_JOB_TITLES,
  searchCategories,
  searchCountryNames,
  searchExperienceLevels,
  searchJobTitles,
  type JobListing,
} from '@/data/jobs-catalog';
import { allowSampleCatalog } from '@/lib/sample-catalog';

/** Navigation items — labels come from i18n keys via `navKey`. */
export const navLinks = [
  { navKey: 'nav.home', href: '#home' },
  { navKey: 'nav.jobs', href: '/jobs' },
  { navKey: 'nav.countries', href: '/countries' },
  { navKey: 'nav.services', href: '/services' },
  { navKey: 'nav.employers', href: '#verified-employers' },
  { navKey: 'nav.about', href: '/legal/about' },
  { navKey: 'nav.contact', href: '#contact' },
] as const;

/** @deprecated Use appLanguages from `@/i18n/languages` */
export { appLanguages as languages } from '@/i18n/languages';

export {
  getJobsByCountry,
  MANDATORY_JOB_TITLES,
  searchCategories,
  searchCountryNames,
  searchExperienceLevels,
  searchJobTitles,
};
export type { JobListing };

export const sampleJobTitles = MANDATORY_JOB_TITLES;
export type SampleJobTitle = (typeof MANDATORY_JOB_TITLES)[number];

/**
 * Fallback stat values shown until live data loads (see `usePlatformPublicStats`
 * in `useJobsQueries`/`usePublicStatsQueries`). Sample catalog counts are only
 * used as placeholders when the sample catalog is explicitly allowed
 * (`allowSampleCatalog()`); production builds start from conservative zeros
 * and are immediately overridden by live DB-backed counts in `StatsSection`.
 */
export const stats = [
  {
    id: 'jobs',
    label: 'Available Jobs',
    value: allowSampleCatalog() ? jobCatalogStats.openJobs : 0,
    suffix: '+',
    format: 'standard' as const,
  },
  {
    id: 'countries',
    label: 'Countries',
    value: allowSampleCatalog() ? jobCatalogStats.totalCountries : 0,
    suffix: '+',
    format: 'standard' as const,
  },
  {
    id: 'employers',
    label: 'Verified Employers',
    value: allowSampleCatalog() ? jobCatalogStats.totalEmployers : 0,
    suffix: '+',
    format: 'standard' as const,
  },
  {
    id: 'applicants',
    label: 'Applicants',
    value: allowSampleCatalog() ? jobCatalogStats.applicants : 0,
    suffix: '',
    format: 'compact' as const,
  },
  {
    id: 'interviews',
    label: 'Interviews Scheduled',
    value: allowSampleCatalog() ? jobCatalogStats.interviewsScheduled : 0,
    suffix: '+',
    format: 'standard' as const,
  },
  {
    id: 'placements',
    label: 'Successful Placements',
    value: allowSampleCatalog() ? jobCatalogStats.successfulPlacements : 0,
    suffix: '',
    format: 'compact' as const,
  },
] as const;

export const jobCategories = searchCategories;

export const searchCountries = searchCountryNames;

export const featuredCountries = [
  {
    name: 'United States',
    code: 'us',
    openings: getJobsByCountry('United States').length,
    averageSalary: 'USD 4,200 / mo',
    currency: 'USD',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'New York City skyline',
  },
  {
    name: 'Canada',
    code: 'ca',
    openings: getJobsByCountry('Canada').length,
    averageSalary: 'CAD 3,800 / mo',
    currency: 'CAD',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Toronto skyline at dusk',
  },
  {
    name: 'Australia',
    code: 'au',
    openings: getJobsByCountry('Australia').length,
    averageSalary: 'AUD 4,500 / mo',
    currency: 'AUD',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Sydney Opera House and harbour',
  },
  {
    name: 'United Kingdom',
    code: 'gb',
    openings: getJobsByCountry('United Kingdom').length,
    averageSalary: 'GBP 2,900 / mo',
    currency: 'GBP',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'London cityscape along the Thames',
  },
  {
    name: 'Germany',
    code: 'de',
    openings: getJobsByCountry('Germany').length,
    averageSalary: 'EUR 3,400 / mo',
    currency: 'EUR',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Berlin streets and architecture',
  },
  {
    name: 'Ireland',
    code: 'ie',
    openings: getJobsByCountry('Ireland').length,
    averageSalary: 'EUR 3,500 / mo',
    currency: 'EUR',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1564953263297-0fe329af7105?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Colourful buildings in Dublin',
  },
  {
    name: 'Qatar',
    code: 'qa',
    openings: getJobsByCountry('Qatar').length,
    averageSalary: 'QAR 8,500 / mo',
    currency: 'QAR',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1559599746-8823b38544c6?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Doha skyline at night',
  },
  {
    name: 'United Arab Emirates',
    code: 'ae',
    openings: getJobsByCountry('United Arab Emirates').length,
    averageSalary: 'AED 9,200 / mo',
    currency: 'AED',
    visaSponsorship: true,
    image:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=70',
    imageAlt: 'Dubai skyline with Burj Khalifa',
  },
] as const;

export type FeaturedCountry = (typeof featuredCountries)[number];

/** @deprecated Use JobListing from jobs-catalog — kept for compatibility. */
export type CountryJob = JobListing;

export const countryJobs = getJobsByCountry(null);
export const featuredJobs = getFeaturedJobs(9);
export const getJobsForCountry = getJobsByCountry;

export const whyChooseUs = [
  {
    id: 'verified',
    title: 'Verified Employers',
    description:
      'Every employer is screened so you apply to legitimate international opportunities with confidence.',
    icon: 'shield' as const,
  },
  {
    id: 'guidance',
    title: 'End-to-End Guidance',
    description:
      'From application to visa documentation, our advisors support you at every stage of your journey.',
    icon: 'route' as const,
  },
  {
    id: 'reach',
    title: 'Global Reach',
    description:
      'Access roles across North America, Europe, the Middle East, and Oceania from one trusted platform.',
    icon: 'globe' as const,
  },
  {
    id: 'candidate',
    title: 'Candidate-First Process',
    description:
      'Transparent timelines, clear requirements, and personalised matching built around your goals.',
    icon: 'spark' as const,
  },
] as const;

export const recruitmentSteps = [
  {
    step: 1,
    title: 'Create Account',
    description: 'Register in minutes and secure your candidate workspace.',
  },
  {
    step: 2,
    title: 'Complete Profile',
    description: 'Add experience, credentials, and preferred destinations.',
  },
  {
    step: 3,
    title: 'Apply',
    description: 'Submit to verified roles matched to your strengths.',
  },
  {
    step: 4,
    title: 'Document Review',
    description: 'Our team validates certificates and eligibility files.',
  },
  {
    step: 5,
    title: 'Employer Review',
    description: 'Shortlisted applications are reviewed by hiring partners.',
  },
  {
    step: 6,
    title: 'Interview',
    description: 'Prepare with coaches and meet employers virtually.',
  },
  {
    step: 7,
    title: 'Offer Letter',
    description: 'Receive and review your international employment offer.',
  },
  {
    step: 8,
    title: 'Visa Preparation',
    description: 'Get structured support for sponsorship and filings.',
  },
  {
    step: 9,
    title: 'Travel',
    description: 'Final relocation guidance before you depart.',
  },
] as const;

export const testimonials = [
  {
    id: '1',
    name: 'Amina Okonkwo',
    role: 'ICU Nurse',
    country: 'Canada',
    rating: 5,
    photo: 'https://i.pravatar.cc/160?img=47',
    quote:
      'Global Jobs International helped me secure a job abroad. The advisors were responsive and honest every step of the way.',
  },
  {
    id: '2',
    name: 'Daniel Reyes',
    role: 'Software Engineer',
    country: 'Ireland',
    rating: 5,
    photo: 'https://i.pravatar.cc/160?img=12',
    quote:
      'I found a verified tech role in Dublin within weeks. The process felt premium, organised, and genuinely supportive.',
  },
  {
    id: '3',
    name: 'Fatima Al-Hassan',
    role: 'Hotel Manager',
    country: 'United Arab Emirates',
    rating: 5,
    photo: 'https://i.pravatar.cc/160?img=5',
    quote:
      'From interview prep to contract review, the team helped me land a leadership role in Dubai with confidence.',
  },
] as const;

export const verifiedEmployers = [
  {
    id: 'maple',
    name: 'Maple Health Network',
    industry: 'Healthcare',
    country: 'Canada',
    logo: 'MH',
    logoColor: '#0052CC',
    openings: 86,
  },
  {
    id: 'pacific',
    name: 'Pacific Infrastructure',
    industry: 'Engineering',
    country: 'Australia',
    logo: 'PI',
    logoColor: '#0F766E',
    openings: 42,
  },
  {
    id: 'thames',
    name: 'Thames Digital',
    industry: 'Technology',
    country: 'United Kingdom',
    logo: 'TD',
    logoColor: '#1D4ED8',
    openings: 31,
  },
  {
    id: 'gulf',
    name: 'Gulf Hospitality Group',
    industry: 'Hospitality',
    country: 'United Arab Emirates',
    logo: 'GH',
    logoColor: '#B45309',
    openings: 58,
  },
  {
    id: 'rhein',
    name: 'Rhein Logistics',
    industry: 'Logistics',
    country: 'Germany',
    logo: 'RL',
    logoColor: '#DC2626',
    openings: 37,
  },
  {
    id: 'desert',
    name: 'Desert Build Co.',
    industry: 'Construction',
    country: 'Qatar',
    logo: 'DB',
    logoColor: '#0369A1',
    openings: 29,
  },
  {
    id: 'emerald',
    name: 'Emerald Care Partners',
    industry: 'Care Services',
    country: 'Ireland',
    logo: 'EC',
    logoColor: '#047857',
    openings: 44,
  },
  {
    id: 'najd',
    name: 'Najd Industrial Group',
    industry: 'Manufacturing',
    country: 'Saudi Arabia',
    logo: 'NI',
    logoColor: '#0F172A',
    openings: 63,
  },
] as const;

/**
 * Current application season windows.
 * Update these dates each cycle — countdown derives from them live.
 */
export const applicationSeason = {
  name: '2026 International Placement Season',
  opensAt: '2026-07-21T00:00:00+03:00',
  closesAt: '2026-09-30T23:59:59+03:00',
  visaProcessing: 'October 2026',
  departure: 'November–December 2026',
  description:
    'Submit applications for verified overseas roles during the official placement window. Early applicants receive priority document review.',
} as const;

export const footerColumns = [
  {
    title: 'Explore',
    links: [
      { label: 'Find Jobs', href: '#jobs' },
      { label: 'Countries', href: '#countries' },
      { label: 'Employers', href: '#verified-employers' },
      { label: 'Services', href: '#services' },
    ],
  },
  {
    title: 'Candidates',
    links: [
      { label: 'Create Account', href: '/register' },
      { label: 'Visa Guidance', href: '#visa' },
      { label: 'Recruitment Journey', href: '#services' },
      { label: 'Success Stories', href: '#testimonials' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Contact', href: '#contact' },
      { label: 'Careers', href: '#careers' },
      { label: 'Press', href: '#press' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Centre', href: '#help' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Use', href: '#terms' },
      { label: 'Cookie Settings', href: '#cookies' },
    ],
  },
] as const;

/** Approximate map coordinates in a 1000×500 viewBox */
export const mapLocations = [
  { id: 'us', label: 'United States', x: 210, y: 175 },
  { id: 'ca', label: 'Canada', x: 220, y: 148 },
  { id: 'gb', label: 'United Kingdom', x: 478, y: 142 },
  { id: 'ie', label: 'Ireland', x: 452, y: 148 },
  { id: 'de', label: 'Germany', x: 512, y: 156 },
  { id: 'qa', label: 'Qatar', x: 618, y: 236 },
  { id: 'ae', label: 'UAE', x: 638, y: 250 },
  { id: 'au', label: 'Australia', x: 820, y: 372 },
] as const;

export const flightRoutes = [
  {
    id: 'us-ca',
    d: 'M210 175 C 214 160, 218 152, 220 148',
    delay: 0,
  },
  {
    id: 'ca-gb',
    d: 'M220 148 C 320 80, 400 90, 478 142',
    delay: 0.3,
  },
  {
    id: 'gb-de',
    d: 'M478 142 C 492 146, 502 150, 512 156',
    delay: 0.7,
  },
  {
    id: 'de-ae',
    d: 'M512 156 C 560 190, 600 220, 638 250',
    delay: 1.1,
  },
  {
    id: 'ae-au',
    d: 'M638 250 C 700 290, 760 330, 820 372',
    delay: 1.5,
  },
  {
    id: 'us-au',
    d: 'M210 175 C 420 240, 640 310, 820 372',
    delay: 1.9,
  },
  {
    id: 'ie-qa',
    d: 'M452 148 C 520 180, 570 210, 618 236',
    delay: 2.3,
  },
] as const;
