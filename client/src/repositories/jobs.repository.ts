import { getJobById, searchJobs, type JobListing } from '@/data/jobs-catalog';
import type { AdminJob } from '@/data/admin-jobs';
import type { EmployerJob, EmployerJobStatus } from '@/data/employer';
import { supabase } from '@/lib/supabase';
import { allowSampleCatalog } from '@/lib/sample-catalog';
import type { DbJobRow } from '@/lib/database.types';
import { resolveCountryCode, resolveCountryId, resolveCountryName } from '@/repositories/countries.repository';
import {
  asObject,
  employerJobToJobInsertPayload,
  jobRowToAdminJob,
  jobRowToEmployerJob,
  jobRowToListing,
  mapUiStatusToDb,
  type JobListingMetadata,
} from '@/repositories/mappers';

async function enrichJobRow(row: DbJobRow, employerNameCache?: Map<string, string>): Promise<JobListing> {
  const countryName = await resolveCountryName(row.country_id);
  const countryCode = await resolveCountryCode(row.country_id);
  void asObject(row.metadata);

  let companyName = employerNameCache?.get(row.employer_id) ?? 'Verified Employer';
  if (!employerNameCache) {
    const { data: employer } = await supabase
      .from('employers')
      .select('legal_name, trading_name')
      .eq('id', row.employer_id)
      .maybeSingle();
    if (employer) companyName = employer.trading_name ?? employer.legal_name;
  }

  return jobRowToListing(row, {
    countryName: countryName ?? undefined,
    countryCode,
    companyName,
  });
}

/** Batches employer name lookups for a set of jobs to avoid N+1 queries. */
async function buildEmployerNameCache(rows: DbJobRow[]): Promise<Map<string, string>> {
  const employerIds = [...new Set(rows.map((row) => row.employer_id).filter(Boolean))];
  const cache = new Map<string, string>();
  if (employerIds.length === 0) return cache;

  const { data, error } = await supabase
    .from('employers')
    .select('id, legal_name, trading_name')
    .in('id', employerIds);
  if (error || !data) return cache;

  for (const employer of data) {
    cache.set(employer.id as string, (employer.trading_name as string | null) ?? (employer.legal_name as string));
  }
  return cache;
}

export async function fetchPublishedDbJobs(): Promise<JobListing[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as DbJobRow[];
  const employerNameCache = await buildEmployerNameCache(rows);
  return Promise.all(rows.map((row) => enrichJobRow(row, employerNameCache)));
}

export async function fetchJobByDbId(id: string): Promise<JobListing | null> {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return enrichJobRow(data as DbJobRow);
}

export async function resolveJobFromAllSources(
  id: string,
  options?: { trackView?: boolean },
): Promise<JobListing | null> {
  if (allowSampleCatalog()) {
    const catalog = getJobById(id);
    if (catalog) return catalog;
  }

  const { data: byId, error: byIdError } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
  if (byIdError) throw byIdError;
  if (byId) {
    if (options?.trackView) {
      const meta = asObject((byId as DbJobRow).metadata) as JobListingMetadata;
      const views = (typeof meta.views === 'number' ? meta.views : 0) + 1;
      await supabase
        .from('jobs')
        .update({ metadata: { ...meta, views } })
        .eq('id', (byId as DbJobRow).id);
    }
    return enrichJobRow(byId as DbJobRow);
  }

  const { data: byCatalog, error: catError } = await supabase
    .from('jobs')
    .select('*')
    .eq('metadata->>catalog_id', id)
    .maybeSingle();

  if (catError) throw catError;
  if (!byCatalog) return null;

  if (options?.trackView) {
    const meta = asObject((byCatalog as DbJobRow).metadata) as JobListingMetadata;
    const views = (typeof meta.views === 'number' ? meta.views : 0) + 1;
    await supabase
      .from('jobs')
      .update({ metadata: { ...meta, views } })
      .eq('id', (byCatalog as DbJobRow).id);
  }

  return enrichJobRow(byCatalog as DbJobRow);
}

export async function searchAllJobsAsync(filters: {
  country?: string;
  title?: string;
  category?: string;
  experience?: string;
  salaryMin?: number;
  visaSponsorship?: boolean;
  accommodation?: boolean;
}): Promise<JobListing[]> {
  const catalog = allowSampleCatalog() ? searchJobs(filters) : [];
  let dbJobs: JobListing[] = [];
  try {
    dbJobs = await fetchPublishedDbJobs();
  } catch {
    dbJobs = [];
  }

  const merged = [...dbJobs, ...catalog];
  const seen = new Set<string>();
  const unique: JobListing[] = [];

  for (const job of merged) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    if (filters.country && job.country !== filters.country) continue;
    if (filters.title && !job.title.toLowerCase().includes(filters.title.toLowerCase())) continue;
    if (filters.category && job.category !== filters.category) continue;
    if (filters.experience && job.experience !== filters.experience) continue;
    if (typeof filters.salaryMin === 'number' && job.salaryMonthly < filters.salaryMin) continue;
    if (filters.visaSponsorship && !job.visaSponsorship) continue;
    if (filters.accommodation && !job.accommodation) continue;
    unique.push(job);
  }

  return unique;
}

export async function fetchEmployerJobsForUser(userId: string): Promise<EmployerJob[]> {
  const { data: employer } = await supabase
    .from('employers')
    .select('id, legal_name')
    .eq('owner_user_id', userId)
    .maybeSingle();

  if (!employer) return [];

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('employer_id', employer.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return ((data ?? []) as DbJobRow[]).map((row) =>
    jobRowToEmployerJob(row, userId, employer.legal_name),
  );
}

export async function fetchAdminJobs(): Promise<AdminJob[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('metadata->>source', 'admin')
    .order('updated_at', { ascending: false });

  if (error) {
    const { data: allJobs, error: allError } = await supabase.from('jobs').select('*').order('updated_at', {
      ascending: false,
    });
    if (allError) throw allError;
    return ((allJobs ?? []) as DbJobRow[])
      .filter((row) => asObject(row.metadata).source === 'admin')
      .map((row) => jobRowToAdminJob(row, 'GJI Verified Employer'));
  }

  return ((data ?? []) as DbJobRow[]).map((row) => jobRowToAdminJob(row, 'GJI Verified Employer'));
}

export async function createEmployerJobRecord(
  userId: string,
  input: Omit<
    EmployerJob,
    'id' | 'employerUserId' | 'createdAt' | 'updatedAt' | 'views' | 'logo' | 'logoColor' | 'companyName'
  > & { companyName?: string },
): Promise<EmployerJob> {
  const { getOrCreateEmployerForUser } = await import('@/repositories/employers.repository');
  const employer = await getOrCreateEmployerForUser(userId, input.companyName ?? 'Employer');
  if (employer.status !== 'active' || !employer.is_verified) {
    throw new Error('Employer account is not approved yet.');
  }

  const countryId = (await resolveCountryId(input.country)) ?? (await resolveCountryId('United States'));
  if (!countryId) throw new Error('Country not configured in database.');

  const payload = employerJobToJobInsertPayload(
    {
      ...input,
      employerUserId: userId,
      companyName: input.companyName ?? employer.legal_name,
    } as EmployerJob,
    employer.id,
    countryId,
  );

  const { data, error } = await supabase.from('jobs').insert(payload).select('*').single();
  if (error) throw error;
  return jobRowToEmployerJob(data as DbJobRow, userId, employer.legal_name);
}

export async function updateEmployerJobRecord(
  jobId: string,
  userId: string,
  patch: Partial<EmployerJob>,
): Promise<EmployerJob | null> {
  const { data: existing, error: fetchError } = await supabase
    .from('jobs')
    .select('*, employers!inner(owner_user_id, legal_name)')
    .eq('id', jobId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) return null;

  const row = existing as DbJobRow & { employers: { owner_user_id: string; legal_name: string } };
  if (row.employers.owner_user_id !== userId) {
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) throw new Error('Not allowed to update this job.');
  }

  const current = jobRowToEmployerJob(row, userId, row.employers.legal_name);
  const next = { ...current, ...patch };
  const countryId = (await resolveCountryId(next.country)) ?? row.country_id;

  const meta = asObject(row.metadata);
  const updatePayload = {
    title: next.title,
    description: next.description,
    country_id: countryId,
    status: mapUiStatusToDb(next.status),
    vacancies: next.maxApplicants,
    salary_min: next.salaryMonthly,
    salary_max: next.salaryMonthly,
    salary_currency: next.currency,
    visa_sponsorship: next.visaSponsorship,
    application_deadline: next.applicationDeadline,
    published_at: next.status === 'Open' ? new Date().toISOString() : row.published_at,
    metadata: {
      ...meta,
      views: next.views,
      listing: {
        ...(meta.listing as object),
        ...next,
      },
    },
  };

  const { data, error } = await supabase
    .from('jobs')
    .update(updatePayload)
    .eq('id', jobId)
    .select('*')
    .single();

  if (error) throw error;
  return jobRowToEmployerJob(data as DbJobRow, userId, row.employers.legal_name);
}

export async function deleteJobRecord(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);
  if (error) throw error;
}

export async function createAdminJobRecord(
  adminUserId: string,
  input: Omit<
    AdminJob,
    'id' | 'employerUserId' | 'createdAt' | 'updatedAt' | 'views' | 'logo' | 'logoColor'
  >,
): Promise<AdminJob> {
  const { getOrCreateEmployerForUser } = await import('@/repositories/employers.repository');
  const employer = await getOrCreateEmployerForUser(adminUserId, input.companyName);
  const countryId = (await resolveCountryId(input.country)) ?? (await resolveCountryId('Canada'));
  if (!countryId) throw new Error('Country not configured.');

  const base = employerJobToJobInsertPayload(
    { ...input, employerUserId: adminUserId, companyName: input.companyName } as EmployerJob,
    employer.id,
    countryId,
  );

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...base,
      metadata: {
        ...(base.metadata as object),
        source: 'admin',
        employerUserId: adminUserId,
        archived: false,
        assignedEmployer: input.assignedEmployer,
      },
    })
    .select('*')
    .single();

  if (error) throw error;
  return jobRowToAdminJob(data as DbJobRow, input.companyName);
}

export async function updateAdminJobRecord(id: string, patch: Partial<AdminJob>): Promise<AdminJob | null> {
  const { data: row, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const current = jobRowToAdminJob(row as DbJobRow, patch.companyName ?? 'Employer');
  const next = { ...current, ...patch };
  const updated = await updateEmployerJobRecord(id, next.employerUserId, next);
  if (!updated) return null;

  const meta = asObject((row as DbJobRow).metadata);
  const { data: patched, error: patchError } = await supabase
    .from('jobs')
    .update({
      metadata: {
        ...meta,
        source: 'admin',
        archived: next.archived ?? meta.archived,
        assignedEmployer: next.assignedEmployer,
      },
    })
    .eq('id', id)
    .select('*')
    .single();

  if (patchError) throw patchError;
  return jobRowToAdminJob(patched as DbJobRow, next.companyName);
}

export async function setAdminJobStatusRecord(id: string, status: EmployerJobStatus) {
  return updateAdminJobRecord(id, { status, archived: status === 'Closed' ? false : undefined });
}

export async function archiveAdminJobRecord(id: string, archived = true) {
  return updateAdminJobRecord(id, { archived, status: archived ? 'Closed' : 'Draft' });
}

export async function duplicateAdminJobRecord(id: string, adminUserId: string): Promise<AdminJob | null> {
  const { data: row } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
  if (!row) return null;
  const job = jobRowToAdminJob(row as DbJobRow, 'Employer');
  return createAdminJobRecord(adminUserId, {
    ...job,
    title: `${job.title} (Copy)`,
    status: 'Draft',
  });
}

export async function ensureCatalogJobForListing(job: JobListing): Promise<string> {
  const { data, error } = await supabase.rpc('ensure_catalog_job', {
    p_catalog_id: job.id,
    p_payload: job,
  });
  if (error) throw error;
  return data as string;
}
