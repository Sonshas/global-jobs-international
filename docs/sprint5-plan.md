# Sprint 5 plan: client + wiring

Sprint 5 builds on the Sprint 4 (payments + employer approval) baseline and
wires the remaining client surfaces onto the schema introduced by
`supabase/migrations/20260721000020_sprint5_saved_jobs_messaging_interviews.sql`
(saved jobs, staff/employer interview writes, realtime for messaging) plus a
small follow-up RLS fix in
`20260721000021_sprint5_message_notification_rls.sql`.

## Goals

1. **Employer registration UI** — `EmployerRegisterPage.tsx` + `employer-auth.ts`
   zod schema, routed at `/register/employer`. `AuthProvider.signUp` branches
   on `accountType` so employer signups persist via
   `saveEmployerRegistrationProfile` (never the applicant-hardcoded
   `saveRegistrationProfile`, which would clobber `account_type`).
2. **Saved jobs** — `saved-jobs.repository.ts`, TanStack Query hooks, a
   `SaveJobButton` on job detail/browse, and a `SavedJobsPage` dashboard view.
   Job ids may be catalog ids or real DB ids; `resolveJobDbId` materializes a
   catalog job only when nothing already exists, so checking "is this job
   saved" never has side effects.
3. **Messaging** — `messaging.repository.ts` (conversations + messages),
   realtime-aware hooks, a two-pane `MessagesPage`, and "Message
   employer/applicant" CTAs from the application detail pages. Sending a
   message best-effort notifies the other participant.
4. **Interviews** — `interviews.repository.ts` CRUD, wired into
   `adminAdvancePipeline`'s `schedule_interview` action (best-effort insert so
   the existing timeline/notification behavior never regresses), and an
   `ApplicantCalendarPage` listing upcoming interviews.
5. **Account settings** — `settings.repository.ts` (`user_id, key, value`
   jsonb) and an `AccountSettingsPage` for email + password + notification
   preference (`notify_email`).
6. **i18n** — new English strings for all of the above under `nav`, `auth`,
   `dashboard`, and `jobs` in `client/src/locales/en.json`.

## Schema notes

- `saved_jobs`: unique `(user_id, job_id)`, RLS scoped to the owning user
  (plus admin/staff).
- `interviews`, `conversations`, and `messages` already existed from earlier
  sprints; migration 020 only added the staff/employer interview INSERT
  policy and realtime publication for messaging, and 021 added a
  conversation-participant notification INSERT policy (the prior policy only
  allowed self-inserts or admins, which silently blocked "new message"
  notifications for the recipient).
- `settings`: `(user_id, key)` unique constraint backs `upsertUserSetting`'s
  `onConflict: 'user_id,key'` upsert.

## Status (2026-07-21)

### Implemented (do not reimplement)
1. Employer registration UI (`/register/employer`)
2. Saved jobs (repo, hooks, `SaveJobButton`, `SavedJobsPage`)
3. Messaging + Realtime (`MessagesPage`, CTAs, notification RLS `000021`)
4. Interviews CRUD + applicant calendar + pipeline insert
5. Account settings (`/dashboard/settings`)
6. Migrations `000020`–`000021` + verify script (**10 PASS**)

### Remaining polish (in progress / follow-up)
1. Super-admin calendar prefers real `interviews` rows (done in remaining pass)
2. Admin pipeline datetime + meeting URL fields (done in remaining pass)
3. Applicant 360 messages from `conversations`/`messages` (done in remaining pass)
4. Optional later: professional non-English i18n pass for new strings (staff notes already on Supabase `staff_notes`)

## Verification

`scripts/verify-sprint5-workflow.mjs` runs an end-to-end smoke test against
the linked Supabase project: employer registration → staff approval → job
publish → applicant application → saved job toggle → messaging round-trip →
interview create/update → settings upsert → outsider RLS negative checks.
Results are written to `scripts/verify-sprint5-workflow-results.json` and
`docs/sprint5-verification-report.md`.
