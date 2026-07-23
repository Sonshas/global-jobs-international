-- =============================================================================
-- Remove illegal direct DELETE on storage.objects from user-deletion trigger.
-- Supabase rejects: ERROR 42501 Direct deletion from storage tables is not allowed.
-- File cleanup must use the Storage API (see DELETE /api/admin/users/:userId).
-- =============================================================================

drop trigger if exists trg_users_cleanup_storage on public.users;
drop function if exists public.cleanup_user_storage_before_delete();

comment on function public.admin_delete_user(uuid) is
  'Deletes auth.users row (cascades to public.users and dependents). service_role only. Storage files must be removed via Storage API before calling this.';
