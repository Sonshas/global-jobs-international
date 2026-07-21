-- =============================================================================
-- Payments, visa progress, interviews, reviews
-- =============================================================================

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider public.payment_provider not null default 'stripe',
  method_type text not null default 'card',
  label text,
  external_customer_id text,
  external_payment_method_id text,
  brand text,
  last4 varchar(4),
  exp_month integer check (exp_month is null or exp_month between 1 and 12),
  exp_year integer,
  is_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  payer_user_id uuid not null references public.users (id) on delete restrict,
  employer_id uuid references public.employers (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  provider public.payment_provider not null default 'stripe',
  status public.payment_status not null default 'pending',
  amount numeric(12, 2) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  description text,
  external_payment_id text,
  external_invoice_id text,
  receipt_url text,
  paid_at timestamptz,
  failed_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.visa_progress (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications (id) on delete cascade,
  applicant_id uuid not null references public.applicants (id) on delete cascade,
  country_id uuid not null references public.countries (id) on delete restrict,
  stage public.visa_stage not null default 'not_started',
  visa_type text,
  reference_number text,
  case_officer text,
  submitted_at timestamptz,
  decision_at timestamptz,
  expected_decision_date date,
  notes text,
  assigned_advisor_id uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  applicant_id uuid not null references public.applicants (id) on delete cascade,
  employer_id uuid not null references public.employers (id) on delete cascade,
  scheduled_by uuid references public.users (id) on delete set null,
  interviewer_user_id uuid references public.users (id) on delete set null,
  status public.interview_status not null default 'scheduled',
  mode public.interview_mode not null default 'video',
  scheduled_start_at timestamptz not null,
  scheduled_end_at timestamptz,
  timezone text not null default 'UTC',
  meeting_url text,
  location_text text,
  feedback text,
  rating integer check (rating is null or rating between 1 and 5),
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint interviews_time_range_check check (
    scheduled_end_at is null or scheduled_end_at >= scheduled_start_at
  )
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_user_id uuid not null references public.users (id) on delete cascade,
  subject_type public.review_subject_type not null,
  subject_user_id uuid references public.users (id) on delete cascade,
  employer_id uuid references public.employers (id) on delete cascade,
  applicant_id uuid references public.applicants (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_public boolean not null default true,
  is_verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint reviews_subject_presence_check check (
    subject_user_id is not null
    or employer_id is not null
    or applicant_id is not null
    or job_id is not null
  )
);

create index if not exists idx_payment_methods_user_id on public.payment_methods (user_id);
create index if not exists idx_payment_methods_default on public.payment_methods (user_id) where is_default = true;
create index if not exists idx_payments_user_id on public.payments (user_id);
create index if not exists idx_payments_status on public.payments (status);
create index if not exists idx_payments_application_id on public.payments (application_id);
create index if not exists idx_payments_external_payment_id on public.payments (external_payment_id);
create index if not exists idx_visa_progress_applicant_id on public.visa_progress (applicant_id);
create index if not exists idx_visa_progress_stage on public.visa_progress (stage);
create index if not exists idx_visa_progress_country_id on public.visa_progress (country_id);
create index if not exists idx_interviews_application_id on public.interviews (application_id);
create index if not exists idx_interviews_applicant_id on public.interviews (applicant_id);
create index if not exists idx_interviews_employer_id on public.interviews (employer_id);
create index if not exists idx_interviews_scheduled_start_at on public.interviews (scheduled_start_at);
create index if not exists idx_reviews_reviewer_user_id on public.reviews (reviewer_user_id);
create index if not exists idx_reviews_employer_id on public.reviews (employer_id);
create index if not exists idx_reviews_applicant_id on public.reviews (applicant_id);
create index if not exists idx_reviews_public on public.reviews (is_public) where is_public = true;

create trigger trg_payment_methods_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();

create trigger trg_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create trigger trg_visa_progress_updated_at
  before update on public.visa_progress
  for each row execute function public.set_updated_at();

create trigger trg_interviews_updated_at
  before update on public.interviews
  for each row execute function public.set_updated_at();

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();
