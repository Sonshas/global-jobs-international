-- Application numbers + catalog job snapshots for apply flow

create sequence if not exists public.gji_application_number_seq start 1;

create or replace function public.next_gji_application_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  n bigint;
begin
  n := nextval('public.gji_application_number_seq');
  return 'GJI-2026-' || lpad(n::text, 6, '0');
end;
$$;

revoke all on function public.next_gji_application_number() from public;
grant execute on function public.next_gji_application_number() to authenticated;

-- Ensures a catalog (in-memory) job exists as a published row for FK applications.job_id
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
    insert into public.employers (
      owner_user_id,
      legal_name,
      trading_name,
      status,
      is_verified,
      metadata
    )
    values (
      auth.uid(),
      'Global Jobs International',
      'GJI Platform',
      'active',
      true,
      jsonb_build_object('is_platform', true)
    )
    returning id into v_employer_id;
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

revoke all on function public.ensure_catalog_job(text, jsonb) from public;
grant execute on function public.ensure_catalog_job(text, jsonb) to authenticated;
