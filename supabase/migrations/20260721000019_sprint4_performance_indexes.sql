-- =============================================================================
-- Sprint 4: small, query-backed performance indexes
-- =============================================================================

-- Admin employer lists order newest-first; this avoids a sort as the table grows.
create index if not exists idx_employers_updated_at_desc
  on public.employers (updated_at desc);

-- Public job browsing commonly constrains status and orders published jobs.
create index if not exists idx_jobs_published_status_published_at_desc
  on public.jobs (status, published_at desc)
  where status = 'published';
