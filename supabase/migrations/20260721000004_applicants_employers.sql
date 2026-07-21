-- =============================================================================
-- Applicants, employers, employer profiles
-- =============================================================================

create table if not exists public.applicants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  headline text,
  bio text,
  date_of_birth date,
  nationality_country_id uuid references public.countries (id) on delete set null,
  residence_country_id uuid references public.countries (id) on delete set null,
  residence_city_id uuid references public.cities (id) on delete set null,
  years_experience integer not null default 0 check (years_experience >= 0),
  highest_education text,
  desired_job_category_id uuid references public.job_categories (id) on delete set null,
  desired_salary_min numeric(12, 2),
  desired_salary_max numeric(12, 2),
  desired_salary_currency char(3) default 'USD',
  willing_to_relocate boolean not null default true,
  has_passport boolean not null default false,
  linkedin_url text,
  portfolio_url text,
  resume_document_id uuid,
  profile_completeness integer not null default 0 check (profile_completeness between 0 and 100),
  is_open_to_work boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint applicants_salary_range_check check (
    desired_salary_min is null
    or desired_salary_max is null
    or desired_salary_min <= desired_salary_max
  )
);

create table if not exists public.employers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete restrict,
  legal_name text not null,
  trading_name text,
  registration_number text,
  website_url text,
  industry text,
  company_size text,
  headquarters_country_id uuid references public.countries (id) on delete set null,
  headquarters_city_id uuid references public.cities (id) on delete set null,
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references public.users (id) on delete set null,
  status public.user_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employer_profiles (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null unique references public.employers (id) on delete cascade,
  tagline text,
  about text,
  logo_url text,
  cover_image_url text,
  contact_email citext,
  contact_phone varchar(32),
  founded_year integer check (founded_year is null or founded_year >= 1800),
  benefits text[],
  social_links jsonb not null default '{}'::jsonb,
  hiring_regions uuid[] default '{}',
  offers_visa_sponsorship boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_applicants_user_id on public.applicants (user_id);
create index if not exists idx_applicants_nationality on public.applicants (nationality_country_id);
create index if not exists idx_applicants_open_to_work on public.applicants (is_open_to_work) where is_open_to_work = true;
create index if not exists idx_employers_owner_user_id on public.employers (owner_user_id);
create index if not exists idx_employers_status on public.employers (status);
create index if not exists idx_employers_verified on public.employers (is_verified) where is_verified = true;
create index if not exists idx_employer_profiles_employer_id on public.employer_profiles (employer_id);

create trigger trg_applicants_updated_at
  before update on public.applicants
  for each row execute function public.set_updated_at();

create trigger trg_employers_updated_at
  before update on public.employers
  for each row execute function public.set_updated_at();

create trigger trg_employer_profiles_updated_at
  before update on public.employer_profiles
  for each row execute function public.set_updated_at();

-- Auto-create applicant/employer rows when a public user is created
create or replace function public.handle_new_public_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.account_type = 'applicant' then
    insert into public.applicants (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  elsif new.account_type = 'employer' then
    insert into public.employers (owner_user_id, legal_name, trading_name, status)
    values (
      new.id,
      coalesce(new.full_name, split_part(new.email::text, '@', 1), 'New Employer'),
      coalesce(new.full_name, split_part(new.email::text, '@', 1)),
      'pending'
    );
  elsif new.account_type = 'admin' then
    insert into public.admin_users (user_id, title, is_active)
    values (new.id, 'Administrator', true)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_public_user_created on public.users;
create trigger on_public_user_created
  after insert on public.users
  for each row execute function public.handle_new_public_user();
