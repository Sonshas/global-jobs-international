-- =============================================================================
-- Row Level Security policies
-- =============================================================================

-- Helper: employer ownership
create or replace function public.is_employer_owner(p_employer_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.employers e
    where e.id = p_employer_id
      and e.owner_user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_applicant_owner(p_applicant_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.applicants a
    where a.id = p_applicant_id
      and a.user_id = auth.uid()
  );
end;
$$;

revoke all on function public.is_employer_owner(uuid) from public;
revoke all on function public.is_applicant_owner(uuid) from public;
grant execute on function public.is_employer_owner(uuid) to authenticated;
grant execute on function public.is_applicant_owner(uuid) to authenticated;

-- Enable RLS on all application tables
alter table public.languages enable row level security;
alter table public.countries enable row level security;
alter table public.cities enable row level security;
alter table public.job_categories enable row level security;
alter table public.document_types enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.admin_users enable row level security;
alter table public.applicants enable row level security;
alter table public.employers enable row level security;
alter table public.employer_profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_requirements enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.documents enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.payment_methods enable row level security;
alter table public.payments enable row level security;
alter table public.visa_progress enable row level security;
alter table public.interviews enable row level security;
alter table public.reviews enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings enable row level security;

-- -------------------------
-- Public reference data
-- -------------------------
create policy "Reference languages are readable"
  on public.languages for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Admins manage languages"
  on public.languages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Reference countries are readable"
  on public.countries for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Admins manage countries"
  on public.countries for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Reference cities are readable"
  on public.cities for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Admins manage cities"
  on public.cities for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Reference job categories are readable"
  on public.job_categories for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

create policy "Admins manage job categories"
  on public.job_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Reference document types are readable"
  on public.document_types for select
  to authenticated
  using (is_active = true or public.is_admin());

create policy "Admins manage document types"
  on public.document_types for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Roles are readable by authenticated users"
  on public.roles for select
  to authenticated
  using (true);

create policy "Admins manage roles"
  on public.roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Permissions are readable by authenticated users"
  on public.permissions for select
  to authenticated
  using (true);

create policy "Admins manage permissions"
  on public.permissions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Role permissions readable by authenticated users"
  on public.role_permissions for select
  to authenticated
  using (true);

create policy "Admins manage role permissions"
  on public.role_permissions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------
-- Users / RBAC / admins
-- -------------------------
create policy "Users can view own profile"
  on public.users for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

create policy "Users can update own profile"
  on public.users for update
  to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Admins manage user roles"
  on public.user_roles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins manage admin users"
  on public.admin_users for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can view admin users"
  on public.admin_users for select
  to authenticated
  using (public.is_admin() or user_id = auth.uid());

-- -------------------------
-- Applicants / employers
-- -------------------------
create policy "Applicants can view own record"
  on public.applicants for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin() or public.has_permission('applicants.read'));

create policy "Applicants can update own record"
  on public.applicants for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Applicants can insert own record"
  on public.applicants for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "Employers readable by owner, admins, and public verified"
  on public.employers for select
  to anon, authenticated
  using (
    public.is_admin()
    or owner_user_id = auth.uid()
    or (is_verified = true and status = 'active')
  );

create policy "Employer owners can update own employer"
  on public.employers for update
  to authenticated
  using (owner_user_id = auth.uid() or public.is_admin())
  with check (owner_user_id = auth.uid() or public.is_admin());

create policy "Employer owners can insert employer"
  on public.employers for insert
  to authenticated
  with check (owner_user_id = auth.uid() or public.is_admin());

create policy "Employer profiles readable with employer"
  on public.employer_profiles for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.employers e
      where e.id = employer_id
        and (
          e.owner_user_id = auth.uid()
          or (e.is_verified = true and e.status = 'active')
        )
    )
  );

create policy "Employer owners manage profiles"
  on public.employer_profiles for all
  to authenticated
  using (public.is_employer_owner(employer_id) or public.is_admin())
  with check (public.is_employer_owner(employer_id) or public.is_admin());

-- -------------------------
-- Jobs
-- -------------------------
create policy "Published jobs are publicly readable"
  on public.jobs for select
  to anon, authenticated
  using (
    status = 'published'
    or public.is_admin()
    or public.is_employer_owner(employer_id)
  );

create policy "Employers manage own jobs"
  on public.jobs for insert
  to authenticated
  with check (public.is_employer_owner(employer_id) or public.is_admin());

create policy "Employers update own jobs"
  on public.jobs for update
  to authenticated
  using (public.is_employer_owner(employer_id) or public.is_admin())
  with check (public.is_employer_owner(employer_id) or public.is_admin());

create policy "Employers delete own jobs"
  on public.jobs for delete
  to authenticated
  using (public.is_employer_owner(employer_id) or public.is_admin());

create policy "Job requirements follow job visibility"
  on public.job_requirements for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.jobs j
      where j.id = job_id
        and (
          j.status = 'published'
          or public.is_admin()
          or public.is_employer_owner(j.employer_id)
        )
    )
  );

create policy "Employers manage job requirements"
  on public.job_requirements for all
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_employer_owner(j.employer_id)
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_employer_owner(j.employer_id)
    )
  );

-- -------------------------
-- Applications / documents
-- -------------------------
create policy "Applicants and employers view related applications"
  on public.applications for select
  to authenticated
  using (
    public.is_admin()
    or public.is_applicant_owner(applicant_id)
    or exists (
      select 1
      from public.jobs j
      where j.id = job_id
        and public.is_employer_owner(j.employer_id)
    )
  );

create policy "Applicants create applications"
  on public.applications for insert
  to authenticated
  with check (public.is_applicant_owner(applicant_id) or public.is_admin());

create policy "Applicants and employers update related applications"
  on public.applications for update
  to authenticated
  using (
    public.is_admin()
    or public.is_applicant_owner(applicant_id)
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_employer_owner(j.employer_id)
    )
  )
  with check (
    public.is_admin()
    or public.is_applicant_owner(applicant_id)
    or exists (
      select 1 from public.jobs j
      where j.id = job_id and public.is_employer_owner(j.employer_id)
    )
  );

create policy "Application history visible to participants"
  on public.application_status_history for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = application_id
        and (
          public.is_applicant_owner(a.applicant_id)
          or public.is_employer_owner(j.employer_id)
        )
    )
  );

create policy "Documents visible to owners and related employers"
  on public.documents for select
  to authenticated
  using (
    public.is_admin()
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

create policy "Users manage own documents"
  on public.documents for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users update own documents"
  on public.documents for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users delete own documents"
  on public.documents for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- -------------------------
-- Messaging / notifications
-- -------------------------
create policy "Conversation participants can read"
  on public.conversations for select
  to authenticated
  using (
    public.is_admin()
    or applicant_user_id = auth.uid()
    or employer_user_id = auth.uid()
  );

create policy "Conversation participants can create"
  on public.conversations for insert
  to authenticated
  with check (
    public.is_admin()
    or applicant_user_id = auth.uid()
    or employer_user_id = auth.uid()
  );

create policy "Conversation participants can update"
  on public.conversations for update
  to authenticated
  using (
    public.is_admin()
    or applicant_user_id = auth.uid()
    or employer_user_id = auth.uid()
  )
  with check (
    public.is_admin()
    or applicant_user_id = auth.uid()
    or employer_user_id = auth.uid()
  );

create policy "Message participants can read"
  on public.messages for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.applicant_user_id = auth.uid() or c.employer_user_id = auth.uid())
    )
  );

create policy "Message participants can send"
  on public.messages for insert
  to authenticated
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.applicant_user_id = auth.uid() or c.employer_user_id = auth.uid())
    )
  );

create policy "Message participants can update own read state"
  on public.messages for update
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.applicant_user_id = auth.uid() or c.employer_user_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.applicant_user_id = auth.uid() or c.employer_user_id = auth.uid())
    )
  );

create policy "Users manage own notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Users update own notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "System and admins insert notifications"
  on public.notifications for insert
  to authenticated
  with check (public.is_admin() or user_id = auth.uid());

-- -------------------------
-- Payments / visa / interviews / reviews
-- -------------------------
create policy "Users manage own payment methods"
  on public.payment_methods for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Users view own payments"
  on public.payments for select
  to authenticated
  using (user_id = auth.uid() or payer_user_id = auth.uid() or public.is_admin());

create policy "Users create own payments"
  on public.payments for insert
  to authenticated
  with check (payer_user_id = auth.uid() or public.is_admin());

create policy "Admins update payments"
  on public.payments for update
  to authenticated
  using (public.is_admin() or payer_user_id = auth.uid())
  with check (public.is_admin() or payer_user_id = auth.uid());

create policy "Visa progress visible to applicant employer advisor admin"
  on public.visa_progress for select
  to authenticated
  using (
    public.is_admin()
    or public.is_applicant_owner(applicant_id)
    or assigned_advisor_id = auth.uid()
    or exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = application_id
        and public.is_employer_owner(j.employer_id)
    )
  );

create policy "Visa progress managed by admins advisors applicants"
  on public.visa_progress for all
  to authenticated
  using (
    public.is_admin()
    or assigned_advisor_id = auth.uid()
    or public.is_applicant_owner(applicant_id)
  )
  with check (
    public.is_admin()
    or assigned_advisor_id = auth.uid()
    or public.is_applicant_owner(applicant_id)
  );

create policy "Interview participants can view"
  on public.interviews for select
  to authenticated
  using (
    public.is_admin()
    or public.is_applicant_owner(applicant_id)
    or public.is_employer_owner(employer_id)
    or interviewer_user_id = auth.uid()
    or scheduled_by = auth.uid()
  );

create policy "Employers and admins manage interviews"
  on public.interviews for insert
  to authenticated
  with check (public.is_employer_owner(employer_id) or public.is_admin());

create policy "Interview stakeholders can update"
  on public.interviews for update
  to authenticated
  using (
    public.is_admin()
    or public.is_employer_owner(employer_id)
    or public.is_applicant_owner(applicant_id)
  )
  with check (
    public.is_admin()
    or public.is_employer_owner(employer_id)
    or public.is_applicant_owner(applicant_id)
  );

create policy "Public reviews are readable"
  on public.reviews for select
  to anon, authenticated
  using (is_public = true or reviewer_user_id = auth.uid() or public.is_admin());

create policy "Authenticated users create reviews"
  on public.reviews for insert
  to authenticated
  with check (reviewer_user_id = auth.uid() or public.is_admin());

create policy "Reviewers update own reviews"
  on public.reviews for update
  to authenticated
  using (reviewer_user_id = auth.uid() or public.is_admin())
  with check (reviewer_user_id = auth.uid() or public.is_admin());

-- -------------------------
-- Activity / settings
-- -------------------------
create policy "Users view own activity; admins view all"
  on public.activity_logs for select
  to authenticated
  using (actor_user_id = auth.uid() or public.is_admin());

create policy "Authenticated users can write activity through function or self"
  on public.activity_logs for insert
  to authenticated
  with check (actor_user_id = auth.uid() or public.is_admin());

create policy "Public and own settings readable"
  on public.settings for select
  to anon, authenticated
  using (
    is_public = true
    or user_id = auth.uid()
    or (user_id is null and public.is_admin())
    or public.is_admin()
  );

create policy "Users manage own settings"
  on public.settings for all
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "Admins manage global settings"
  on public.settings for all
  to authenticated
  using (user_id is null and public.is_admin())
  with check (user_id is null and public.is_admin());
