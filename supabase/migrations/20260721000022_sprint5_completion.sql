-- =============================================================================
-- Sprint 5 completion: staff notes, support conversations, campaigns,
-- employer subscription fields, staff payment monitoring, interview reminders
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. staff_notes — replaces the client localStorage applicant notes cache.
-- Staff/admin manage; applicants and employers have no access.
-- ---------------------------------------------------------------------------
create table if not exists public.staff_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  author_user_id uuid references public.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_staff_notes_application_id
  on public.staff_notes (application_id, created_at desc);

alter table public.staff_notes enable row level security;

drop policy if exists "Staff manage application notes" on public.staff_notes;
create policy "Staff manage application notes"
  on public.staff_notes for all
  to authenticated
  using (public.is_staff() or public.is_admin())
  with check (public.is_staff() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. conversations: support threads (employer <-> staff), alongside the
-- existing application (applicant <-> employer) threads.
-- Design: applicant_user_id becomes nullable; kind='support' threads use
-- employer_user_id + staff_user_id and leave applicant_user_id null.
-- ---------------------------------------------------------------------------
alter table public.conversations alter column applicant_user_id drop not null;

alter table public.conversations
  add column if not exists kind text not null default 'application';

do $$
begin
  alter table public.conversations
    add constraint conversations_kind_check check (kind in ('application', 'support'));
exception
  when duplicate_object then null;
end;
$$;

alter table public.conversations
  add column if not exists staff_user_id uuid references public.users (id) on delete set null;

alter table public.conversations drop constraint if exists conversations_participants_distinct;
alter table public.conversations
  add constraint conversations_participants_distinct check (
    applicant_user_id is null or applicant_user_id <> employer_user_id
  );

-- One open support thread per employer; staff is assigned when first opened.
create unique index if not exists idx_conversations_support_per_employer
  on public.conversations (employer_user_id)
  where kind = 'support';

create index if not exists idx_conversations_staff_user_id on public.conversations (staff_user_id);

-- Replace conversation RLS to account for support threads (staff/employer,
-- no applicant). OR-combined with the original application-thread rules.
drop policy if exists "Conversation participants can read" on public.conversations;
create policy "Conversation participants can read"
  on public.conversations for select
  to authenticated
  using (
    public.is_admin()
    or applicant_user_id = auth.uid()
    or employer_user_id = auth.uid()
    or staff_user_id = auth.uid()
    or (kind = 'support' and public.is_staff())
  );

drop policy if exists "Conversation participants can create" on public.conversations;
create policy "Conversation participants can create"
  on public.conversations for insert
  to authenticated
  with check (
    public.is_admin()
    or applicant_user_id = auth.uid()
    or employer_user_id = auth.uid()
    or staff_user_id = auth.uid()
    or (kind = 'support' and public.is_staff())
  );

drop policy if exists "Conversation participants can update" on public.conversations;
create policy "Conversation participants can update"
  on public.conversations for update
  to authenticated
  using (
    public.is_admin()
    or applicant_user_id = auth.uid()
    or employer_user_id = auth.uid()
    or staff_user_id = auth.uid()
    or (kind = 'support' and public.is_staff())
  )
  with check (
    public.is_admin()
    or applicant_user_id = auth.uid()
    or employer_user_id = auth.uid()
    or staff_user_id = auth.uid()
    or (kind = 'support' and public.is_staff())
  );

-- Messages: extend participant checks to cover support threads.
drop policy if exists "Message participants can read" on public.messages;
create policy "Message participants can read"
  on public.messages for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          c.applicant_user_id = auth.uid()
          or c.employer_user_id = auth.uid()
          or c.staff_user_id = auth.uid()
          or (c.kind = 'support' and public.is_staff())
        )
    )
  );

drop policy if exists "Message participants can send" on public.messages;
create policy "Message participants can send"
  on public.messages for insert
  to authenticated
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          c.applicant_user_id = auth.uid()
          or c.employer_user_id = auth.uid()
          or c.staff_user_id = auth.uid()
          or (c.kind = 'support' and public.is_staff())
        )
    )
  );

drop policy if exists "Message participants can update own read state" on public.messages;
create policy "Message participants can update own read state"
  on public.messages for update
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          c.applicant_user_id = auth.uid()
          or c.employer_user_id = auth.uid()
          or c.staff_user_id = auth.uid()
          or (c.kind = 'support' and public.is_staff())
        )
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          c.applicant_user_id = auth.uid()
          or c.employer_user_id = auth.uid()
          or c.staff_user_id = auth.uid()
          or (c.kind = 'support' and public.is_staff())
        )
    )
  );

-- ---------------------------------------------------------------------------
-- 3. campaigns — admin/staff manage, public reads active campaigns.
-- ---------------------------------------------------------------------------
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  country_id uuid references public.countries (id) on delete set null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_campaigns_is_active on public.campaigns (is_active) where is_active = true;
create index if not exists idx_campaigns_country_id on public.campaigns (country_id);

drop trigger if exists trg_campaigns_updated_at on public.campaigns;
create trigger trg_campaigns_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

alter table public.campaigns enable row level security;

drop policy if exists "Public reads active campaigns" on public.campaigns;
create policy "Public reads active campaigns"
  on public.campaigns for select
  to anon, authenticated
  using (is_active = true or public.is_admin() or public.is_staff());

drop policy if exists "Staff manage campaigns" on public.campaigns;
create policy "Staff manage campaigns"
  on public.campaigns for all
  to authenticated
  using (public.is_admin() or public.is_staff())
  with check (public.is_admin() or public.is_staff());

-- ---------------------------------------------------------------------------
-- 4. employers: explicit subscription plan/status columns (in addition to
-- metadata, for simple querying/reporting).
-- ---------------------------------------------------------------------------
alter table public.employers add column if not exists subscription_plan text not null default 'free';
alter table public.employers add column if not exists subscription_status text not null default 'none';

-- ---------------------------------------------------------------------------
-- 5. Staff can SELECT all payments for monitoring (OR-combined with the
-- existing owner/payer/admin select policy).
-- ---------------------------------------------------------------------------
drop policy if exists "Staff view all payments" on public.payments;
create policy "Staff view all payments"
  on public.payments for select
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- 6. Realtime for messaging was already enabled in migration 000020; no
-- change needed here.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 7. Index to support interview reminder scans (next 24h, still scheduled).
-- ---------------------------------------------------------------------------
create index if not exists idx_interviews_scheduled_reminder
  on public.interviews (scheduled_start_at)
  where status = 'scheduled';
