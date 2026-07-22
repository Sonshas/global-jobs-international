-- =============================================================================
-- Staging E2E cleanup — EDIT email filters before running on shared staging.
-- Removes applications, document rows, and storage objects for test users only.
-- =============================================================================

-- Example test accounts (replace with your staging emails):
-- \set applicant_email 'e2e-applicant@example.com'
-- \set employer_email 'e2e-employer@example.com'

do $$
declare
  applicant_email text := 'e2e-applicant@example.com';
  employer_email text := 'e2e-employer@example.com';
  uid uuid;
  paths text[];
begin
  select id into uid from auth.users where email = applicant_email;
  if uid is not null then
    select array_agg(storage_path) into paths
    from public.documents
    where user_id = uid;

    delete from public.applications
    where applicant_id in (select id from public.applicants where user_id = uid);

    delete from public.documents where user_id = uid;

    if paths is not null then
      delete from storage.objects
      where bucket_id = 'documents'
        and name = any(paths);
    end if;
  end if;

  -- Optional: remove employer test jobs/applications created during E2E
  select id into uid from auth.users where email = employer_email;
  if uid is not null then
    delete from public.applications
    where job_id in (
      select j.id
      from public.jobs j
      join public.employers e on e.id = j.employer_id
      where e.owner_user_id = uid
        and j.metadata->>'e2e' = 'true'
    );

    delete from public.jobs
    where employer_id in (select id from public.employers where owner_user_id = uid)
      and metadata->>'e2e' = 'true';
  end if;
end $$;
