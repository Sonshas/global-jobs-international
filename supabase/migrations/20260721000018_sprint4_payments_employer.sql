-- =============================================================================
-- Sprint 4: Stripe payment integrity and employer approval enforcement
-- =============================================================================

-- employers.status uses public.user_status. The original enum did not contain
-- "rejected", so add it before mapping application approval states to the DB.
alter type public.user_status add value if not exists 'rejected';

-- The enum itself constrains status to the supported states:
-- pending | active | suspended | rejected. Keep verification aligned with an
-- active approved employer, including direct SQL/service-role updates.
create or replace function public.enforce_employer_approval_state()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE'
    and not (public.is_admin() or public.is_staff())
    and (
      new.status is distinct from old.status
      or new.is_verified is distinct from old.is_verified
      or new.verified_at is distinct from old.verified_at
      or new.verified_by is distinct from old.verified_by
    ) then
    raise exception 'Employer approval status can only be changed by staff';
  end if;

  if new.status = 'active' then
    new.is_verified := true;
    new.verified_at := coalesce(new.verified_at, timezone('utc', now()));
  else
    new.is_verified := false;
    new.verified_at := null;
    new.verified_by := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_employer_approval_state on public.employers;
create trigger trg_enforce_employer_approval_state
  before insert or update of status, is_verified, verified_at, verified_by
  on public.employers
  for each row execute function public.enforce_employer_approval_state();

create index if not exists idx_payments_user_id on public.payments (user_id);
create index if not exists idx_payments_external_payment_id on public.payments (external_payment_id);

-- Payment state transitions are server/webhook controlled. This prevents a
-- browser client from changing its own pending payment to paid.
drop policy if exists "Admins update payments" on public.payments;
create policy "Admins update payments"
  on public.payments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Preserve existing integrations if historic duplicate provider identifiers
-- exist; otherwise make Stripe webhook delivery idempotent at the database.
do $$
begin
  if not exists (
    select 1
    from public.payments
    where external_payment_id is not null
    group by external_payment_id
    having count(*) > 1
  ) then
    create unique index if not exists uq_payments_external_payment_id_not_null
      on public.payments (external_payment_id)
      where external_payment_id is not null;
  else
    raise notice 'Skipped unique payments.external_payment_id index because duplicates already exist.';
  end if;
end;
$$;

-- A verified active employer is required to create or edit its jobs. Staff
-- retain their operational override; the helper is SECURITY DEFINER so the
-- RLS condition does not depend on employers table visibility.
create or replace function public.can_manage_employer_jobs(p_employer_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.is_admin()
    or public.is_staff()
    or exists (
      select 1
      from public.employers e
      where e.id = p_employer_id
        and e.owner_user_id = auth.uid()
        and e.status = 'active'
        and e.is_verified = true
    );
end;
$$;

revoke all on function public.can_manage_employer_jobs(uuid) from public;
grant execute on function public.can_manage_employer_jobs(uuid) to authenticated;

drop policy if exists "Employers manage own jobs" on public.jobs;
drop policy if exists "Employers update own jobs" on public.jobs;

create policy "Active employers create own jobs"
  on public.jobs for insert
  to authenticated
  with check (public.can_manage_employer_jobs(employer_id));

create policy "Active employers update own jobs"
  on public.jobs for update
  to authenticated
  using (public.can_manage_employer_jobs(employer_id))
  with check (public.can_manage_employer_jobs(employer_id));
