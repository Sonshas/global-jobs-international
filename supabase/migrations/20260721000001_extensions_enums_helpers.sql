-- =============================================================================
-- Global Jobs International — Extensions, enums, shared helpers
-- =============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- -----------------------------------------------------------------------------
-- Enumerations
-- -----------------------------------------------------------------------------

do $$ begin
  create type public.user_status as enum ('active', 'inactive', 'suspended', 'pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_type as enum ('applicant', 'employer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.job_status as enum ('draft', 'published', 'paused', 'closed', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.employment_type as enum (
    'full_time',
    'part_time',
    'contract',
    'temporary',
    'internship',
    'freelance'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.experience_level as enum (
    'entry',
    'junior',
    'mid',
    'senior',
    'lead',
    'executive'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum (
    'draft',
    'submitted',
    'under_review',
    'shortlisted',
    'interview',
    'offered',
    'accepted',
    'rejected',
    'withdrawn',
    'hired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_status as enum (
    'uploaded',
    'pending_review',
    'approved',
    'rejected',
    'expired'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_provider as enum (
    'stripe',
    'paypal',
    'bank_transfer',
    'manual',
    'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interview_status as enum (
    'scheduled',
    'rescheduled',
    'completed',
    'cancelled',
    'no_show'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interview_mode as enum ('video', 'phone', 'in_person', 'async');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.visa_stage as enum (
    'not_started',
    'documents_collection',
    'employer_sponsorship',
    'application_submitted',
    'biometrics',
    'under_review',
    'approved',
    'rejected',
    'travel_ready'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_channel as enum ('in_app', 'email', 'sms', 'push');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.review_subject_type as enum ('employer', 'applicant', 'job', 'platform');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_action as enum (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'status_change',
    'upload',
    'payment',
    'message',
    'other'
  );
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Shared trigger helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

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
  or exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.slug in ('admin', 'super_admin')
      and ur.is_active = true
  );
end;
$$;

create or replace function public.has_permission(permission_slug text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return public.is_admin()
  or exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.permissions p on p.id = rp.permission_id
    where ur.user_id = auth.uid()
      and ur.is_active = true
      and p.slug = permission_slug
  );
end;
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.has_permission(text) from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_permission(text) to authenticated;
