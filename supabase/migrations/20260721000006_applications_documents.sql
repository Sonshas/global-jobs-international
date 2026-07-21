-- =============================================================================
-- Applications, status history, documents
-- =============================================================================

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  applicant_id uuid not null references public.applicants (id) on delete cascade,
  status public.application_status not null default 'submitted',
  cover_letter text,
  expected_salary numeric(12, 2),
  expected_salary_currency char(3) default 'USD',
  available_from date,
  source text default 'website',
  reviewer_user_id uuid references public.users (id) on delete set null,
  submitted_at timestamptz not null default timezone('utc', now()),
  decided_at timestamptz,
  withdrawn_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint applications_job_applicant_unique unique (job_id, applicant_id)
);

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  changed_by uuid references public.users (id) on delete set null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  applicant_id uuid references public.applicants (id) on delete cascade,
  employer_id uuid references public.employers (id) on delete cascade,
  application_id uuid references public.applications (id) on delete set null,
  document_type_id uuid not null references public.document_types (id) on delete restrict,
  file_name text not null,
  storage_bucket text not null default 'documents',
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  status public.document_status not null default 'uploaded',
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint documents_owner_check check (
    applicant_id is not null or employer_id is not null
  )
);

-- Deferred FK: applicants.resume_document_id -> documents
alter table public.applicants
  drop constraint if exists applicants_resume_document_id_fkey;

alter table public.applicants
  add constraint applicants_resume_document_id_fkey
  foreign key (resume_document_id) references public.documents (id) on delete set null;

create index if not exists idx_applications_job_id on public.applications (job_id);
create index if not exists idx_applications_applicant_id on public.applications (applicant_id);
create index if not exists idx_applications_status on public.applications (status);
create index if not exists idx_applications_submitted_at on public.applications (submitted_at desc);
create index if not exists idx_application_status_history_application_id
  on public.application_status_history (application_id, created_at desc);
create index if not exists idx_documents_user_id on public.documents (user_id);
create index if not exists idx_documents_applicant_id on public.documents (applicant_id);
create index if not exists idx_documents_employer_id on public.documents (employer_id);
create index if not exists idx_documents_application_id on public.documents (application_id);
create index if not exists idx_documents_type_id on public.documents (document_type_id);
create index if not exists idx_documents_status on public.documents (status);

create trigger trg_applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create trigger trg_documents_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- Track application status changes automatically
create or replace function public.log_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_status_history (
      application_id,
      from_status,
      to_status,
      changed_by,
      note
    )
    values (
      new.id,
      null,
      new.status,
      auth.uid(),
      'Application created'
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.application_status_history (
      application_id,
      from_status,
      to_status,
      changed_by
    )
    values (
      new.id,
      old.status,
      new.status,
      auth.uid()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_applications_status_history on public.applications;
create trigger trg_applications_status_history
  after insert or update of status on public.applications
  for each row execute function public.log_application_status_change();
