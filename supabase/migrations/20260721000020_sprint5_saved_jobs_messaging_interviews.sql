-- Sprint 5: saved jobs, realtime messaging, staff interview scheduling

-- ---------------------------------------------------------------------------
-- Saved jobs
-- ---------------------------------------------------------------------------
create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint saved_jobs_user_job_unique unique (user_id, job_id)
);

create index if not exists idx_saved_jobs_user_id on public.saved_jobs (user_id, created_at desc);
create index if not exists idx_saved_jobs_job_id on public.saved_jobs (job_id);

alter table public.saved_jobs enable row level security;

drop policy if exists "Users manage own saved jobs" on public.saved_jobs;
create policy "Users manage own saved jobs"
  on public.saved_jobs for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.is_staff())
  with check (user_id = auth.uid() or public.is_admin() or public.is_staff());

-- ---------------------------------------------------------------------------
-- Interviews: allow staff to insert (admin pipeline)
-- ---------------------------------------------------------------------------
drop policy if exists "Employers and admins manage interviews" on public.interviews;
create policy "Employers staff and admins manage interviews"
  on public.interviews for insert
  to authenticated
  with check (
    public.is_employer_owner(employer_id)
    or public.is_admin()
    or public.is_staff()
  );

drop policy if exists "Interview stakeholders can update" on public.interviews;
create policy "Interview stakeholders can update"
  on public.interviews for update
  to authenticated
  using (
    public.is_admin()
    or public.is_staff()
    or public.is_employer_owner(employer_id)
    or public.is_applicant_owner(applicant_id)
  )
  with check (
    public.is_admin()
    or public.is_staff()
    or public.is_employer_owner(employer_id)
    or public.is_applicant_owner(applicant_id)
  );

-- ---------------------------------------------------------------------------
-- Realtime for messaging (idempotent when already published)
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.conversations;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;
