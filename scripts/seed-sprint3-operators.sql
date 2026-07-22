-- Sprint 3 post-verifier operator provisioning
--
-- Prerequisite: scripts/verify-sprint3-workflow.mjs has created the target
-- auth user and its public.users row. Replace the email below with that
-- verifier-created user's email before running this file. The verifier can
-- create the user with its anon client; this SQL then provisions its roles.
--
-- Run against the linked project with the cached Supabase CLI login:
--   npx supabase db query --linked --file scripts/seed-sprint3-operators.sql
--
-- This uses privileged SQL. Do not expose it through the browser or execute it
-- with an anon/authenticated application key.

begin;

do $$
declare
  v_operator_email text := 'REPLACE_WITH_VERIFIER_CREATED_USER_EMAIL';
  v_operator_id uuid;
begin
  if v_operator_email = 'REPLACE_WITH_VERIFIER_CREATED_USER_EMAIL' then
    raise exception 'Set v_operator_email to a verifier-created user email before running this script.';
  end if;

  select u.id
  into v_operator_id
  from public.users u
  where lower(u.email) = lower(v_operator_email);

  if v_operator_id is null then
    raise exception 'No public.users row exists for verifier operator email: %', v_operator_email;
  end if;

  perform public.assign_user_role(v_operator_id, 'admin', v_operator_id);
  perform public.assign_user_role(v_operator_id, 'employer', v_operator_id);
  perform public.seed_platform_employer(v_operator_id);
end;
$$;

commit;
