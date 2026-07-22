-- =============================================================================
-- Sprint 1 (C1/C2): RBAC helpers, staff permissions, platform employer, RLS
-- =============================================================================

-- -------------------------
-- Role helper functions
-- -------------------------

create or replace function public.has_role(role_slug text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and ur.is_active = true
      and (ur.expires_at is null or ur.expires_at > timezone('utc', now()))
      and r.slug = role_slug
  );
end;
$$;

create or replace function public.is_super_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.has_role('super_admin');
end;
$$;

create or replace function public.is_staff()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Staff / advisor role OR elevated admin roles
  return public.has_role('advisor')
    or public.has_role('admin')
    or public.has_role('super_admin')
    or exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.is_active = true
    );
end;
$$;

-- Admins = operational admin OR super_admin OR admin_users membership
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
  or public.has_role('admin')
  or public.has_role('super_admin');
end;
$$;

revoke all on function public.has_role(text) from public;
revoke all on function public.is_super_admin() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;

grant execute on function public.has_role(text) to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- -------------------------
-- Staff (advisor) permissions
-- -------------------------

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in (
  'applications.read',
  'applications.manage',
  'applicants.read',
  'jobs.read'
)
where r.slug = 'advisor'
on conflict (role_id, permission_id) do nothing;

-- -------------------------
-- Seed platform employer (owned by first super_admin/admin if present)
-- Ops can also call: select public.seed_platform_employer('<user-uuid>');
-- -------------------------

create or replace function public.seed_platform_employer(p_owner_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employer_id uuid;
begin
  if p_owner_user_id is null then
    raise exception 'owner user id required';
  end if;

  if not exists (select 1 from public.users where id = p_owner_user_id) then
    raise exception 'owner user does not exist in public.users';
  end if;

  select e.id into v_employer_id
  from public.employers e
  where coalesce(e.metadata ->> 'is_platform', 'false') = 'true'
  limit 1;

  if v_employer_id is not null then
    return v_employer_id;
  end if;

  insert into public.employers (
    owner_user_id,
    legal_name,
    trading_name,
    status,
    is_verified,
    verified_at,
    metadata
  )
  values (
    p_owner_user_id,
    'Global Jobs International',
    'GJI Platform',
    'active',
    true,
    timezone('utc', now()),
    jsonb_build_object('is_platform', true, 'accountStatus', 'approved')
  )
  returning id into v_employer_id;

  insert into public.employer_profiles (employer_id, tagline, about)
  values (
    v_employer_id,
    'Official platform employer for catalog listings',
    'System employer used for Global Jobs International catalog job snapshots.'
  )
  on conflict (employer_id) do nothing;

  return v_employer_id;
end;
$$;

revoke all on function public.seed_platform_employer(uuid) from public;
grant execute on function public.seed_platform_employer(uuid) to service_role;
-- ensure_catalog_job (security definer) may call seed_platform_employer as migration owner
grant execute on function public.seed_platform_employer(uuid) to postgres;

-- Auto-seed platform employer when a super_admin/admin user exists
do $$
declare
  v_owner uuid;
begin
  select ur.user_id into v_owner
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.is_active = true
    and r.slug in ('super_admin', 'admin')
  order by case when r.slug = 'super_admin' then 0 else 1 end
  limit 1;

  if v_owner is null then
    select au.user_id into v_owner
    from public.admin_users au
    where au.is_active = true
    limit 1;
  end if;

  if v_owner is not null then
    perform public.seed_platform_employer(v_owner);
  end if;
end $$;

-- -------------------------
-- Harden ensure_catalog_job: never create platform employer owned by applicants
-- -------------------------

create or replace function public.ensure_catalog_job(
  p_catalog_id text,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_id uuid;
  v_employer_id uuid;
  v_country_id uuid;
  v_title text;
  v_slug text;
  v_owner uuid;
begin
  if p_catalog_id is null or length(trim(p_catalog_id)) = 0 then
    raise exception 'catalog_id required';
  end if;

  select j.id into v_job_id
  from public.jobs j
  where j.metadata ->> 'catalog_id' = p_catalog_id
  limit 1;

  if v_job_id is not null then
    return v_job_id;
  end if;

  select e.id into v_employer_id
  from public.employers e
  where coalesce(e.metadata ->> 'is_platform', 'false') = 'true'
  limit 1;

  if v_employer_id is null then
    -- Prefer elevated owner; fall back to current user only if they are staff/admin
    select ur.user_id into v_owner
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.is_active = true
      and r.slug in ('super_admin', 'admin')
    order by case when r.slug = 'super_admin' then 0 else 1 end
    limit 1;

    if v_owner is null and public.is_staff() then
      v_owner := auth.uid();
    end if;

    if v_owner is null then
      raise exception
        'Platform employer is not seeded. An admin must run: select public.seed_platform_employer(''<admin-user-uuid>'');';
    end if;

    v_employer_id := public.seed_platform_employer(v_owner);
  end if;

  v_title := coalesce(p_payload ->> 'title', 'International Role');
  v_slug := lower(regexp_replace(v_title || '-' || left(p_catalog_id, 8), '[^a-zA-Z0-9]+', '-', 'g'));

  select c.id into v_country_id
  from public.countries c
  where c.name = p_payload ->> 'country'
  limit 1;

  insert into public.jobs (
    employer_id,
    country_id,
    title,
    slug,
    summary,
    description,
    employment_type,
    experience_level,
    status,
    vacancies,
    salary_currency,
    visa_sponsorship,
    published_at,
    metadata
  )
  values (
    v_employer_id,
    coalesce(
      v_country_id,
      (select id from public.countries order by name limit 1)
    ),
    v_title,
    v_slug,
    left(coalesce(p_payload ->> 'description', v_title), 500),
    coalesce(p_payload ->> 'description', v_title),
    'full_time',
    'mid',
    'published',
    greatest(1, coalesce((p_payload ->> 'vacancies')::int, 1)),
    coalesce(p_payload ->> 'currency', 'USD'),
    coalesce((p_payload ->> 'visaSponsorship')::boolean, false),
    timezone('utc', now()),
    jsonb_build_object(
      'catalog_id', p_catalog_id,
      'source', 'catalog',
      'listing', p_payload
    )
  )
  returning id into v_job_id;

  return v_job_id;
end;
$$;

-- -------------------------
-- Application DELETE (withdraw) RLS
-- -------------------------

drop policy if exists "Applicants withdraw own applications" on public.applications;
create policy "Applicants withdraw own applications"
  on public.applications for delete
  to authenticated
  using (
    public.is_admin()
    or public.is_staff()
    or public.is_applicant_owner(applicant_id)
  );

-- Staff can read applications (pipeline)
drop policy if exists "Staff view applications" on public.applications;
create policy "Staff view applications"
  on public.applications for select
  to authenticated
  using (public.is_staff());

drop policy if exists "Staff update applications" on public.applications;
create policy "Staff update applications"
  on public.applications for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Staff can read applicants for pipeline
drop policy if exists "Staff read applicants" on public.applicants;
create policy "Staff read applicants"
  on public.applicants for select
  to authenticated
  using (public.is_staff() or public.has_permission('applicants.read'));

-- -------------------------
-- Helper: assign role (service_role / admin only via SQL)
-- -------------------------

create or replace function public.assign_user_role(
  p_user_id uuid,
  p_role_slug text,
  p_assigned_by uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id uuid;
  v_id uuid;
begin
  select id into v_role_id from public.roles where slug = p_role_slug;
  if v_role_id is null then
    raise exception 'Unknown role slug: %', p_role_slug;
  end if;

  insert into public.user_roles (user_id, role_id, assigned_by, is_active)
  values (p_user_id, v_role_id, p_assigned_by, true)
  on conflict (user_id, role_id) do update
    set is_active = true,
        assigned_by = coalesce(excluded.assigned_by, public.user_roles.assigned_by),
        updated_at = timezone('utc', now())
  returning id into v_id;

  if p_role_slug in ('admin', 'super_admin') then
    insert into public.admin_users (user_id, title, is_active, created_by)
    values (
      p_user_id,
      case when p_role_slug = 'super_admin' then 'Super Admin' else 'Admin' end,
      true,
      p_assigned_by
    )
    on conflict (user_id) do update
      set is_active = true,
          title = excluded.title,
          updated_at = timezone('utc', now());
  end if;

  if p_role_slug = 'employer' then
    update public.users
    set account_type = 'employer',
        updated_at = timezone('utc', now())
    where id = p_user_id;
  elsif p_role_slug in ('admin', 'super_admin') then
    update public.users
    set account_type = 'admin',
        updated_at = timezone('utc', now())
    where id = p_user_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.assign_user_role(uuid, text, uuid) from public;
grant execute on function public.assign_user_role(uuid, text, uuid) to service_role;
