-- Sprint 5 follow-up: allow a conversation participant to insert a
-- notification for the other participant (e.g. "new message" alerts).
-- The existing "System and admins insert notifications" policy only allowed
-- self-inserts or admins, which silently blocked cross-user message
-- notifications under RLS. This adds a narrowly scoped permissive policy
-- (OR-combined with the existing ones) rather than loosening the base rule.

create policy "Conversation participants can notify each other"
  on public.notifications for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.conversations c
      where (c.applicant_user_id = auth.uid() and c.employer_user_id = user_id)
         or (c.employer_user_id = auth.uid() and c.applicant_user_id = user_id)
    )
  );
