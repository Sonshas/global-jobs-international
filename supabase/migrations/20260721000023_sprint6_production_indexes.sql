-- =============================================================================
-- Sprint 6: production-readiness indexes
-- =============================================================================

-- `resolveJobFromAllSources` looks up jobs by their legacy sample-catalog id
-- via `metadata->>'catalog_id'`. Index only the rows that actually carry one.
create index if not exists idx_jobs_metadata_catalog_id
  on public.jobs ((metadata ->> 'catalog_id'))
  where metadata ->> 'catalog_id' is not null;

-- Public homepage stats and the "Verified Employers" section both filter on
-- verified + active employers.
create index if not exists idx_employers_verified_active
  on public.employers (is_verified, status)
  where is_verified = true and status = 'active';

-- Batched employer-name / job-count lookups (`fetchPublishedDbJobs`,
-- `fetchVerifiedEmployers`) filter published jobs by a set of employer ids.
create index if not exists idx_jobs_employer_id_status_published
  on public.jobs (employer_id, status)
  where status = 'published';

-- Note: `jobs.status` already has `idx_jobs_status` (see
-- 20260721000005_jobs_requirements.sql) and a published-only composite index
-- (see 20260721000019_sprint4_performance_indexes.sql); no change needed there.
