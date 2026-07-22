import type { JobListing } from '@/data/jobs-catalog';
import { fetchApplicationsForJobIds } from '@/repositories/applications.repository';
import {
  createEmployerJobRecord,
  deleteJobRecord,
  fetchEmployerJobsForUser,
  updateEmployerJobRecord,
} from '@/repositories/jobs.repository';
import {
  fetchEmployerProfile,
  listEmployerProfiles as fetchAllEmployerProfiles,
  setEmployerAccountStatusRecord,
  upsertEmployerProfileRecord,
} from '@/repositories/employers.repository';
import type { JobApplication } from '@/data/applications';
import { countUnreadMessages } from '@/repositories/messaging.repository';

export type HiringStatus = 'hiring' | 'paused' | 'not_hiring';

export type EmployerAccountStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type EmployerProfile = {
  userId: string;
  companyName: string;
  logoDataUrl: string;
  coverDataUrl: string;
  description: string;
  website: string;
  address: string;
  country: string;
  industry: string;
  employees: string;
  verified: boolean;
  hiringStatus: HiringStatus;
  accountStatus?: EmployerAccountStatus;
  subscriptionPlan: string;
  subscriptionStatus: string;
  updatedAt: string;
  createdAt: string;
};

export type EmployerJobStatus = 'Open' | 'Closed' | 'Draft';

export type EmployerJob = {
  id: string;
  employerUserId: string;
  companyName: string;
  title: string;
  country: string;
  countryCode: string;
  city: string;
  salaryMonthly: number;
  currency: string;
  salaryLabel: string;
  jobType: string;
  experience: string;
  education: string;
  accommodation: boolean;
  visaSponsorship: boolean;
  medicalInsurance: boolean;
  transport: boolean;
  workingHours: string;
  contractDuration: string;
  requirements: string[];
  benefits: string[];
  description: string;
  applicationDeadline: string;
  maxApplicants: number;
  status: EmployerJobStatus;
  views: number;
  logo: string;
  logoColor: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export const getEmployerProfile = fetchEmployerProfile;
export const listEmployerProfiles = fetchAllEmployerProfiles;
export const upsertEmployerProfile = upsertEmployerProfileRecord;
export const setEmployerAccountStatus = setEmployerAccountStatusRecord;
export const listEmployerJobs = fetchEmployerJobsForUser;
export const createEmployerJob = createEmployerJobRecord;
export const updateEmployerJob = updateEmployerJobRecord;

export async function deleteEmployerJob(id: string, userId: string) {
  const jobs = await fetchEmployerJobsForUser(userId);
  if (!jobs.some((job) => job.id === id)) {
    throw new Error('Job not found');
  }
  await deleteJobRecord(id);
}

export async function getEmployerJob(id: string, employerUserId?: string): Promise<EmployerJob | null> {
  const { supabase } = await import('@/lib/supabase');
  const { jobRowToEmployerJob } = await import('@/repositories/mappers');
  const { data } = await supabase
    .from('jobs')
    .select('*, employers!inner(owner_user_id, legal_name)')
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  const row = data as {
    employers: { owner_user_id: string; legal_name: string };
  } & Parameters<typeof jobRowToEmployerJob>[0];
  if (employerUserId && row.employers.owner_user_id !== employerUserId) {
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) return null;
  }
  return jobRowToEmployerJob(row, row.employers.owner_user_id, row.employers.legal_name);
}

export function incrementEmployerJobViews(id: string) {
  void import('@/repositories/jobs.repository').then(({ resolveJobFromAllSources }) =>
    resolveJobFromAllSources(id, { trackView: true }),
  );
}

export function employerJobToListing(job: EmployerJob): JobListing {
  return {
    id: job.id,
    title: job.title,
    country: job.country,
    countryCode: job.countryCode,
    city: job.city,
    employer: job.companyName,
    salaryMonthly: job.salaryMonthly,
    currency: job.currency,
    salaryLabel: job.salaryLabel,
    visaSponsorship: job.visaSponsorship,
    accommodation: job.accommodation,
    medicalInsurance: job.medicalInsurance,
    contractDuration: job.contractDuration,
    workingHours: job.workingHours,
    description: job.description,
    benefits: job.benefits,
    requirements: job.requirements,
    vacancies: job.maxApplicants,
    applicationDeadline: job.applicationDeadline,
    status: job.status === 'Draft' ? 'Closed' : job.status,
    category: job.category,
    experience: job.experience,
    logo: job.logo,
    logoColor: job.logoColor,
  };
}

export function isEmployerAccountActive(profile: EmployerProfile | null): boolean {
  if (!profile) return false;
  if (!profile.accountStatus) return true;
  return profile.accountStatus === 'approved';
}

export async function listEmployerApplications(userId: string): Promise<JobApplication[]> {
  const jobs = await fetchEmployerJobsForUser(userId);
  const jobIds = jobs.map((job) => job.id);
  const apps = await fetchApplicationsForJobIds(jobIds);
  return apps;
}

export async function getEmployerStats(userId: string) {
  const jobs = await fetchEmployerJobsForUser(userId);
  const apps = await listEmployerApplications(userId);

  return {
    activeJobs: jobs.filter((job) => job.status === 'Open').length,
    closedJobs: jobs.filter((job) => job.status === 'Closed').length,
    draftJobs: jobs.filter((job) => job.status === 'Draft').length,
    applicants: apps.length,
    shortlisted: apps.filter(
      (app) =>
        app.stageStatuses.Shortlisted === 'completed' ||
        app.currentStage === 'Shortlisted' ||
        app.status === 'approved',
    ).length,
    interviews: apps.filter(
      (app) =>
        app.stageStatuses.Interview === 'completed' ||
        app.stageStatuses.Interview === 'in_progress' ||
        app.currentStage === 'Interview',
    ).length,
    hired: apps.filter(
      (app) =>
        app.stageStatuses['Employment Started'] === 'completed' ||
        app.currentStage === 'Employment Started',
    ).length,
    rejected: apps.filter((app) => app.status === 'rejected').length,
    messages: await countUnreadMessages(userId),
    views: jobs.reduce((sum, job) => sum + job.views, 0),
  };
}

export const EMPLOYER_COUNTRIES = [
  'United States',
  'Canada',
  'Australia',
  'United Kingdom',
  'Ireland',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Netherlands',
  'Belgium',
  'Norway',
  'Sweden',
  'Denmark',
  'Finland',
  'New Zealand',
  'Japan',
  'South Korea',
  'Singapore',
  'United Arab Emirates',
  'Qatar',
  'Saudi Arabia',
  'Oman',
  'Bahrain',
  'Kuwait',
  'Poland',
  'Austria',
  'Switzerland',
] as const;

export const EMPLOYER_INDUSTRIES = [
  'Healthcare',
  'Hospitality',
  'Construction',
  'Manufacturing',
  'Technology',
  'Logistics',
  'Agriculture',
  'Education',
  'Security',
  'Finance',
  'Recruitment',
] as const;

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
