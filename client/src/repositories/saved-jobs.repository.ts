import { supabase } from '@/lib/supabase';
import type { DbSavedJobRow } from '@/lib/database.types';
import { ensureCatalogJobForListing, resolveJobFromAllSources } from '@/repositories/jobs.repository';
import { getJobById, type JobListing } from '@/data/jobs-catalog';

/** Look up the public.jobs(id) for a listing id without creating catalog rows. */
async function tryResolveExistingJobDbId(jobId: string): Promise<string | null> {
  const { data: byCatalog } = await supabase
    .from('jobs')
    .select('id')
    .eq('metadata->>catalog_id', jobId)
    .maybeSingle();
  if (byCatalog?.id) return byCatalog.id as string;

  const { data: byId } = await supabase.from('jobs').select('id').eq('id', jobId).maybeSingle();
  return (byId?.id as string) ?? null;
}

/** Saved jobs reference public.jobs(id); catalog listings must be materialized first. */
async function resolveJobDbId(jobId: string): Promise<string> {
  const existing = await tryResolveExistingJobDbId(jobId);
  if (existing) return existing;

  const catalogJob = getJobById(jobId);
  if (catalogJob) {
    return ensureCatalogJobForListing(catalogJob);
  }
  throw new Error('Job not found.');
}

export type SavedJobEntry = {
  id: string;
  userId: string;
  jobId: string;
  createdAt: string;
  job: JobListing | null;
};

export async function listSavedJobs(userId: string): Promise<SavedJobEntry[]> {
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as DbSavedJobRow[];

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      userId: row.user_id,
      jobId: row.job_id,
      createdAt: row.created_at,
      job: await resolveJobFromAllSources(row.job_id).catch(() => null),
    })),
  );
}

export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  const dbJobId = await tryResolveExistingJobDbId(jobId);
  if (!dbJobId) return false;
  const { data, error } = await supabase
    .from('saved_jobs')
    .select('id')
    .eq('user_id', userId)
    .eq('job_id', dbJobId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

export async function saveJob(userId: string, jobId: string): Promise<void> {
  const dbJobId = await resolveJobDbId(jobId);
  const { error } = await supabase
    .from('saved_jobs')
    .upsert({ user_id: userId, job_id: dbJobId }, { onConflict: 'user_id,job_id' });
  if (error) throw error;
}

export async function unsaveJob(userId: string, jobId: string): Promise<void> {
  const dbJobId = (await tryResolveExistingJobDbId(jobId)) ?? jobId;
  const { error } = await supabase.from('saved_jobs').delete().eq('user_id', userId).eq('job_id', dbJobId);
  if (error) throw error;
}

export async function toggleSavedJob(userId: string, jobId: string): Promise<boolean> {
  const saved = await isJobSaved(userId, jobId);
  if (saved) {
    await unsaveJob(userId, jobId);
    return false;
  }
  await saveJob(userId, jobId);
  return true;
}
