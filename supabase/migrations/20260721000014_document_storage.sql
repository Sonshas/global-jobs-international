-- =============================================================================
-- Sprint 2 (C4): Supabase Storage bucket `documents`, storage RLS, document types
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  8388608,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into public.document_types (slug, name, description, is_required_default)
values
  ('national_id', 'National ID', 'Government-issued national identity document', false),
  ('driving_licence', 'Driving Licence', 'Valid driving licence', false),
  ('academic_certificate', 'Academic Certificate', 'Degree or academic qualification', false),
  ('passport_photo', 'Passport Photo', 'Passport-size photograph', false),
  ('ielts_certificate', 'IELTS Certificate', 'English language test certificate', false)
on conflict (slug) do nothing;

-- Staff may review applicant documents (status / rejection reason)
drop policy if exists "Staff review documents" on public.documents;
create policy "Staff review documents"
  on public.documents for update
  to authenticated
  using (public.is_staff() or public.is_admin())
  with check (public.is_staff() or public.is_admin());

-- Extend read access to staff advisors
drop policy if exists "Documents visible to owners and related employers" on public.documents;
create policy "Documents visible to owners and related employers"
  on public.documents for select
  to authenticated
  using (
    public.is_admin()
    or public.is_staff()
    or user_id = auth.uid()
    or public.is_applicant_owner(applicant_id)
    or public.is_employer_owner(employer_id)
    or (
      application_id is not null
      and exists (
        select 1
        from public.applications a
        join public.jobs j on j.id = a.job_id
        where a.id = application_id
          and public.is_employer_owner(j.employer_id)
      )
    )
  );

-- -------------------------
-- Storage object policies (private bucket)
-- Path convention: {user_id}/{applicant_id}/{document_id}/{filename}
-- -------------------------

create or replace function public.storage_document_readable(object_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.is_staff()
    or exists (
      select 1
      from public.documents d
      where d.storage_bucket = 'documents'
        and d.storage_path = object_name
        and (
          d.user_id = auth.uid()
          or public.is_applicant_owner(d.applicant_id)
          or public.is_employer_owner(d.employer_id)
          or (
            d.application_id is not null
            and exists (
              select 1
              from public.applications a
              join public.jobs j on j.id = a.job_id
              where a.id = d.application_id
                and public.is_employer_owner(j.employer_id)
            )
          )
        )
    );
$$;

drop policy if exists "Documents bucket insert own prefix" on storage.objects;
create policy "Documents bucket insert own prefix"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Documents bucket select authorized" on storage.objects;
create policy "Documents bucket select authorized"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.storage_document_readable(name)
    )
  );

drop policy if exists "Documents bucket update own prefix" on storage.objects;
create policy "Documents bucket update own prefix"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Documents bucket delete own or admin" on storage.objects;
create policy "Documents bucket delete own or admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );
