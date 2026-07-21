-- =============================================================================
-- Seed reference data (roles, permissions, languages, document types, countries)
-- =============================================================================

insert into public.languages (code, name, native_name)
values
  ('en', 'English', 'English'),
  ('es', 'Spanish', 'Español'),
  ('fr', 'French', 'Français'),
  ('de', 'German', 'Deutsch'),
  ('ar', 'Arabic', 'العربية')
on conflict (code) do nothing;

insert into public.roles (slug, name, description, is_system)
values
  ('super_admin', 'Super Admin', 'Full platform access', true),
  ('admin', 'Admin', 'Operational administration', true),
  ('employer', 'Employer', 'Hiring organization user', true),
  ('applicant', 'Applicant', 'Job seeker user', true),
  ('advisor', 'Advisor', 'Recruitment / visa advisor', true)
on conflict (slug) do nothing;

insert into public.permissions (slug, name, resource, action, description)
values
  ('users.read', 'Read users', 'users', 'read', 'View user profiles'),
  ('users.manage', 'Manage users', 'users', 'manage', 'Create/update/suspend users'),
  ('jobs.read', 'Read jobs', 'jobs', 'read', 'View jobs'),
  ('jobs.manage', 'Manage jobs', 'jobs', 'manage', 'Create and edit jobs'),
  ('applications.read', 'Read applications', 'applications', 'read', 'View applications'),
  ('applications.manage', 'Manage applications', 'applications', 'manage', 'Update application status'),
  ('applicants.read', 'Read applicants', 'applicants', 'read', 'View applicant profiles'),
  ('employers.manage', 'Manage employers', 'employers', 'manage', 'Verify and manage employers'),
  ('payments.read', 'Read payments', 'payments', 'read', 'View payments'),
  ('payments.manage', 'Manage payments', 'payments', 'manage', 'Process payments'),
  ('settings.manage', 'Manage settings', 'settings', 'manage', 'Update platform settings')
on conflict (slug) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.slug in ('admin', 'super_admin')
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in ('jobs.manage', 'applications.read', 'applications.manage')
where r.slug = 'employer'
on conflict (role_id, permission_id) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.slug in ('jobs.read', 'applications.manage')
where r.slug = 'applicant'
on conflict (role_id, permission_id) do nothing;

insert into public.document_types (slug, name, description, is_required_default)
values
  ('passport', 'Passport', 'Valid passport bio page', true),
  ('resume', 'Resume / CV', 'Curriculum vitae', true),
  ('certificate', 'Certificate', 'Professional or educational certificate', false),
  ('police_clearance', 'Police Clearance', 'Criminal background check', false),
  ('medical_report', 'Medical Report', 'Fitness / medical certificate', false),
  ('offer_letter', 'Offer Letter', 'Signed employment offer', false),
  ('visa_document', 'Visa Document', 'Visa forms and evidence', false)
on conflict (slug) do nothing;

insert into public.job_categories (slug, name, description, sort_order)
values
  ('healthcare', 'Healthcare', 'Nursing, medical and allied health roles', 10),
  ('engineering', 'Engineering', 'Civil, mechanical, electrical and related roles', 20),
  ('hospitality', 'Hospitality', 'Hotels, tourism and food service', 30),
  ('it-software', 'IT & Software', 'Software engineering and IT operations', 40),
  ('construction', 'Construction', 'Site, trades and project roles', 50),
  ('logistics', 'Logistics', 'Warehousing, supply chain and transport', 60),
  ('education', 'Education', 'Teaching and academic support', 70),
  ('finance', 'Finance', 'Accounting, banking and finance roles', 80)
on conflict (slug) do nothing;

insert into public.countries (iso_code, iso3_code, name, phone_code, currency_code, is_featured)
values
  ('CA', 'CAN', 'Canada', '+1', 'CAD', true),
  ('AU', 'AUS', 'Australia', '+61', 'AUD', true),
  ('GB', 'GBR', 'United Kingdom', '+44', 'GBP', true),
  ('DE', 'DEU', 'Germany', '+49', 'EUR', true),
  ('IE', 'IRL', 'Ireland', '+353', 'EUR', true),
  ('QA', 'QAT', 'Qatar', '+974', 'QAR', true),
  ('AE', 'ARE', 'United Arab Emirates', '+971', 'AED', true),
  ('SA', 'SAU', 'Saudi Arabia', '+966', 'SAR', true),
  ('US', 'USA', 'United States', '+1', 'USD', false),
  ('NZ', 'NZL', 'New Zealand', '+64', 'NZD', false)
on conflict (iso_code) do nothing;

insert into public.cities (country_id, name, state_province)
select c.id, v.city, v.region
from public.countries c
join (
  values
    ('CA', 'Toronto', 'Ontario'),
    ('CA', 'Vancouver', 'British Columbia'),
    ('AU', 'Sydney', 'New South Wales'),
    ('AU', 'Melbourne', 'Victoria'),
    ('GB', 'London', 'England'),
    ('DE', 'Berlin', null),
    ('IE', 'Dublin', null),
    ('QA', 'Doha', null),
    ('AE', 'Dubai', null),
    ('AE', 'Abu Dhabi', null),
    ('SA', 'Riyadh', null)
) as v(iso, city, region) on v.iso = c.iso_code
on conflict (country_id, name, state_province) do nothing;

insert into public.settings (user_id, key, value, description, is_public)
select null, v.key, v.value::jsonb, v.description, v.is_public
from (
  values
    ('platform.name', '"Global Jobs International"', 'Public platform name', true),
    ('platform.support_email', '"hello@globaljobs.international"', 'Support contact email', true),
    (
      'applications.allow_multiple_per_job',
      'false',
      'Whether applicants may submit multiple applications to the same job',
      false
    )
) as v(key, value, description, is_public)
where not exists (
  select 1
  from public.settings s
  where s.user_id is null
    and s.key = v.key
);
