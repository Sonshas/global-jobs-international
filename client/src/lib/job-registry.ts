import { getJobById, searchJobs, type JobListing } from '@/data/jobs-catalog';
import { searchAllJobsAsync, resolveJobFromAllSources } from '@/repositories/jobs.repository';

/** @deprecated Prefer useResolvedJob() for database-backed listings. */
export function resolveJob(id: string): JobListing | null {
  return getJobById(id);
}

export { resolveJobFromAllSources };

export async function searchAllJobs(filters: {
  country?: string;
  title?: string;
  category?: string;
  experience?: string;
  salaryMin?: number;
  visaSponsorship?: boolean;
  accommodation?: boolean;
}): Promise<JobListing[]> {
  return searchAllJobsAsync(filters);
}

export async function listNewestJobs(limit = 8): Promise<JobListing[]> {
  const merged = await searchAllJobsAsync({});
  return merged.filter((job) => job.status === 'Open').slice(0, limit);
}

/** Sync catalog-only search for static components. */
export function searchCatalogJobs(filters: Parameters<typeof searchJobs>[0]) {
  return searchJobs(filters);
}
