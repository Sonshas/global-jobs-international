-- Sprint 3 verification: role assignment is an operational bootstrap action.
-- Do not expose this SECURITY DEFINER function to authenticated API users.

revoke execute on function public.assign_user_role(uuid, text, uuid) from public;
revoke execute on function public.assign_user_role(uuid, text, uuid) from anon;
revoke execute on function public.assign_user_role(uuid, text, uuid) from authenticated;
grant execute on function public.assign_user_role(uuid, text, uuid) to service_role;
