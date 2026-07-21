-- =============================================================================
-- Jobs and job requirements
-- =============================================================================

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  employer_id uuid not null references public.employers (id) on delete cascade,
  category_id uuid references public.job_categories (id) on delete set null,
  country_id uuid not null references public.countries (id) on delete restrict,
  city_id uuid references public.cities (id) on delete set null,
  title text not null,
  slug text not null,
  summary text,
  description text not null,
  responsibilities text,
  benefits text,
  employment_type public.employment_type not null default 'full_time',
  experience_level public.experience_level not null default 'mid',
  status public.job_status not null default 'draft',
  vacancies integer not null default 1 check (vacancies > 0),
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  salary_currency char(3) not null default 'USD',
  salary_period text not null default 'year',
  is_salary_public boolean not null default true,
  visa_sponsorship boolean not null default false,
  relocation_assistance boolean not null default false,
  remote_option boolean not null default false,
  application_deadline date,
  published_at timestamptz,
  closed_at timestamptz,
  created_by uuid references public.users (id) on delete set null,
  updated_by uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint jobs_employer_slug_unique unique (employer_id, slug),
  constraint jobs_salary_range_check check (
    salary_min is null
    or salary_max is null
    or salary_min <= salary_max
  )
);

create table if not exists public.job_requirements (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  requirement_type text not null default 'skill',
  title text not null,
  description text,
  is_mandatory boolean not null default true,
  min_years_experience integer check (min_years_experience is null or min_years_experience >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_jobs_employer_id on public.jobs (employer_id);
create index if not exists idx_jobs_category_id on public.jobs (category_id);
create index if not exists idx_jobs_country_id on public.jobs (country_id);
create index if not exists idx_jobs_city_id on public.jobs (city_id);
create index if not exists idx_jobs_status on public.jobs (status);
create index if not exists idx_jobs_published_at on public.jobs (published_at desc);
create index if not exists idx_jobs_visa_sponsorship on public.jobs (visa_sponsorship) where visa_sponsorship = true;
create index if not exists idx_jobs_title_search on public.jobs using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '')));
create index if not exists idx_job_requirements_job_id on public.job_requirements (job_id);

create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create trigger trg_job_requirements_updated_at
  before update on public.job_requirements
  for each row execute function public.set_updated_at();
