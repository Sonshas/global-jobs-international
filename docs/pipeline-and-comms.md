# Pipeline, visa tracking, notifications & email (C5 + C6)

## Recruitment timeline (Postgres)

- Stored on `applications.metadata.recruitmentTimeline` (array of events with `id`, `label`, `status`, `at`, `note`).
- Seeded on apply with **Application Submitted** and **Application Under Review**.
- Admin pipeline actions append events via `appendRecruitmentTimelineEvent`.
- UI reads timeline from hydrated `JobApplication.recruitmentTimeline` (15s application query refresh).

## Visa tracker

- Canonical row: `visa_progress` (created on apply with job `country_id`).
- Tracker booleans live in `visa_progress.metadata.tracker` and are mirrored to `applications.metadata.visaTracker` for fast UI reads.
- Updated by admin pipeline actions (`setVisaTrackerStep`).

## Notifications

- Table: `public.notifications` (RLS: users read/update own; staff/admin/self insert).
- Bell menu: TanStack Query `useNotifications` (15s polling).
- Dispatched on apply, employer status changes, and admin pipeline actions via `dispatchNotification` (API + Supabase fallback).

## Email

- **Server:** `POST /api/comms/email` with JWT — HTML templates in `server/src/email/templates.ts`.
- **Provider:** Resend when `RESEND_API_KEY` is set; development logs only otherwise.
- **Client:** `sendLifecycleEmail` → `dispatchLifecycleEmail` → server API.

## Ops

1. Apply migrations, including document-bucket repair: `npx supabase db push`.
2. For local verification, copy the URL and anon key from `client/.env` to
   `server/.env`, set `APP_ENV=development`, and leave service role and Resend
   unset. `/api/comms/*` authorizes the caller with their JWT in this mode.
3. Run `node scripts/verify-sprint3-workflow.mjs`. It creates isolated users,
   provisions its operator with `npx supabase db query --linked`, and writes
   JSON plus the verification evidence document.
4. Ensure `VITE_API_URL` points at the Express API so comms routes are reachable.
5. Set `RESEND_API_KEY` and `EMAIL_FROM` only for production delivery. Without
   Resend, development calls return `{ provider: "log" }` after logging email.
