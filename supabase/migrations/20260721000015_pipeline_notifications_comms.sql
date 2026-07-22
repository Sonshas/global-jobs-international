-- =============================================================================
-- Sprint 3 (C5/C6): Staff notification inserts + visa tracker metadata helper
-- =============================================================================

drop policy if exists "System and admins insert notifications" on public.notifications;
create policy "Privileged roles insert notifications"
  on public.notifications for insert
  to authenticated
  with check (
    public.is_admin()
    or public.is_staff()
    or user_id = auth.uid()
  );
