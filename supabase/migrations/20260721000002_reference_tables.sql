-- =============================================================================
-- Reference / lookup tables
-- =============================================================================

create table if not exists public.languages (
  id uuid primary key default gen_random_uuid(),
  code varchar(10) not null unique,
  name text not null,
  native_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  iso_code char(2) not null unique,
  iso3_code char(3) unique,
  name text not null unique,
  phone_code varchar(8),
  currency_code char(3),
  flag_emoji text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries (id) on delete cascade,
  name text not null,
  state_province text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint cities_country_name_unique unique (country_id, name, state_province)
);

create unique index if not exists idx_cities_country_name_null_region
  on public.cities (country_id, name)
  where state_province is null;

create table if not exists public.job_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.job_categories (id) on delete set null,
  slug text not null unique,
  name text not null unique,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.document_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  is_required_default boolean not null default false,
  allowed_mime_types text[] not null default array['application/pdf', 'image/jpeg', 'image/png'],
  max_file_size_mb integer not null default 10 check (max_file_size_mb > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  resource text not null,
  action text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint permissions_resource_action_unique unique (resource, action)
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint role_permissions_unique unique (role_id, permission_id)
);

create index if not exists idx_cities_country_id on public.cities (country_id);
create index if not exists idx_cities_name on public.cities (name);
create index if not exists idx_countries_featured on public.countries (is_featured) where is_featured = true;
create index if not exists idx_job_categories_parent_id on public.job_categories (parent_id);
create index if not exists idx_role_permissions_role_id on public.role_permissions (role_id);
create index if not exists idx_role_permissions_permission_id on public.role_permissions (permission_id);

create trigger trg_languages_updated_at
  before update on public.languages
  for each row execute function public.set_updated_at();

create trigger trg_countries_updated_at
  before update on public.countries
  for each row execute function public.set_updated_at();

create trigger trg_cities_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

create trigger trg_job_categories_updated_at
  before update on public.job_categories
  for each row execute function public.set_updated_at();

create trigger trg_document_types_updated_at
  before update on public.document_types
  for each row execute function public.set_updated_at();

create trigger trg_roles_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

create trigger trg_permissions_updated_at
  before update on public.permissions
  for each row execute function public.set_updated_at();
