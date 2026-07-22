import type { EmployerJob } from '@/data/employer';

export type AdminJob = EmployerJob & { archived?: boolean; assignedEmployer?: string };

export {
  fetchAdminJobs as listAdminJobs,
  createAdminJobRecord as createAdminJob,
  updateAdminJobRecord as updateAdminJob,
  deleteJobRecord as deleteAdminJob,
  duplicateAdminJobRecord as duplicateAdminJob,
  setAdminJobStatusRecord as setAdminJobStatus,
  archiveAdminJobRecord as archiveAdminJob,
} from '@/repositories/jobs.repository';

import type { JobListing } from '@/data/jobs-catalog';
import { employerJobToListing } from '@/data/employer';
import { fetchAdminJobs } from '@/repositories/jobs.repository';
import { hiringCountries } from '@/data/jobs-catalog';

export function adminJobToPublicListing(job: AdminJob) {
  if (job.archived || job.status === 'Draft') return null;
  return employerJobToListing(job);
}

export async function listPublicAdminJobs(): Promise<JobListing[]> {
  const jobs = await fetchAdminJobs();
  return jobs
    .map(adminJobToPublicListing)
    .filter((job): job is JobListing => Boolean(job));
}

export function adminJobCountryOptions() {
  return hiringCountries.map((country) => country.name);
}
