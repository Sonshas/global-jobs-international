-- =============================================================================
-- Sprint 3 verification: repair documents storage infrastructure idempotently.
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
