-- =============================================================================
-- Identity, RBAC, admin users
-- public.users mirrors auth.users and stores app-level profile data
-- =============================================================================

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  full_name text,
  phone varchar(32),
  avatar_url text,
  account_type public.account_type not null default 'applicant',
  status public.user_status not null default 'pending',
  preferred_language_id uuid references public.languages (id) on delete set null,
  country_id uuid references public.countries (id) on delete set null,
  city_id uuid references public.cities (id) on delete set null,
  timezone text default 'UTC',
  last_login_at timestamptz,
  email_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  assigned_by uuid references public.users (id) on delete set null,
  is_active boolean not null default true,
  assigned_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_roles_unique unique (user_id, role_id)
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  title text,
  department text,
  is_active boolean not null default true,
  notes text,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_users_account_type on public.users (account_type);
create index if not exists idx_users_status on public.users (status);
create index if not exists idx_users_country_id on public.users (country_id);
create index if not exists idx_users_preferred_language_id on public.users (preferred_language_id);
create index if not exists idx_user_roles_user_id on public.user_roles (user_id);
create index if not exists idx_user_roles_role_id on public.user_roles (role_id);
create index if not exists idx_admin_users_is_active on public.admin_users (is_active);

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_user_roles_updated_at
  before update on public.user_roles
  for each row execute function public.set_updated_at();

create trigger trg_admin_users_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

-- Keep public.users in sync with auth.users
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inferred_type public.account_type := 'applicant';
begin
  if coalesce(new.raw_user_meta_data ->> 'role', new.raw_user_meta_data ->> 'account_type') in ('employer') then
    inferred_type := 'employer';
  elsif coalesce(new.raw_user_meta_data ->> 'role', new.raw_user_meta_data ->> 'account_type') in ('admin') then
    inferred_type := 'admin';
  end if;

  insert into public.users (
    id,
    email,
    full_name,
    account_type,
    status,
    email_verified_at,
    metadata
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    inferred_type,
    case when new.email_confirmed_at is not null then 'active'::public.user_status else 'pending'::public.user_status end,
    new.email_confirmed_at,
    coalesce(new.raw_user_meta_data, '{}'::jsonb)
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        email_verified_at = coalesce(excluded.email_verified_at, public.users.email_verified_at),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
