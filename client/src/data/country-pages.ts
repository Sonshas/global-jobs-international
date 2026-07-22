import { hiringCountries, getJobsByCountry, MANDATORY_JOB_TITLES } from '@/data/jobs-catalog';
import { applicationSeason } from '@/data/homepage';

export type CountryPageContent = {
  slug: string;
  name: string;
  code: string;
  currency: string;
  flagUrl: string;
  mapImage: string;
  description: string;
  averageSalary: string;
  visaInformation: string;
  workPermitInformation: string;
  processingTime: string;
  costOfLiving: string;
  popularCities: string[];
  featuredEmployers: string[];
  applicationSeason: string;
  requiredDocuments: string[];
  popularJobs: string[];
  openJobsCount: number;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const costBands = ['Moderate', 'High', 'Premium', 'Affordable'];

export function getCountryPage(slugOrName: string): CountryPageContent | null {
  const normalized = slugOrName.toLowerCase();
  const country = hiringCountries.find(
    (item) =>
      slugify(item.name) === normalized ||
      item.name.toLowerCase() === normalized ||
      item.code === normalized,
  );
  if (!country) return null;

  const jobs = getJobsByCountry(country.name).filter((job) => job.status === 'Open');
  const avg =
    jobs.length > 0
      ? Math.round(jobs.reduce((sum, job) => sum + job.salaryMonthly, 0) / jobs.length)
      : 3200;

  return {
    slug: slugify(country.name),
    name: country.name,
    code: country.code,
    currency: country.currency,
    flagUrl: `https://flagcdn.com/w160/${country.code}.png`,
    mapImage: `https://flagcdn.com/w640/${country.code}.png`,
    description: `${country.name} is an active Global Jobs International hiring market with verified employers, structured visa pathways, and strong demand across ${country.specialties.slice(0, 3).join(', ')} and related roles.`,
    averageSalary: `${country.currency} ${avg.toLocaleString()}/month`,
    visaInformation: `Work visa sponsorship is available on selected roles in ${country.name}. Applicants must hold a valid passport and complete medical and police clearance stages before embassy submission.`,
    workPermitInformation: `Work permits are processed after employer confirmation and document verification. GJI coordinates employer letters, contract packages, and permit tracking for ${country.name} placements.`,
    processingTime: '6–14 weeks typical (role and nationality dependent)',
    costOfLiving: costBands[country.name.length % costBands.length],
    popularCities: country.cities,
    featuredEmployers: [
      `${country.cities[0]} Partners Ltd`,
      `Horizon ${country.name} Group`,
      `Prime Care ${country.code.toUpperCase()}`,
    ],
    applicationSeason: applicationSeason.name,
    requiredDocuments: [
      'Passport',
      'CV',
      'National ID',
      'Academic certificates',
      'Police clearance',
      'Medical report',
      'Passport photo',
    ],
    popularJobs: [...new Set([...country.specialties, ...MANDATORY_JOB_TITLES])].slice(0, 10),
    openJobsCount: jobs.length,
  };
}

export function listCountryPages(): CountryPageContent[] {
  return hiringCountries
    .map((country) => getCountryPage(country.name))
    .filter((page): page is CountryPageContent => Boolean(page));
}

export function countrySlug(name: string) {
  return slugify(name);
}
