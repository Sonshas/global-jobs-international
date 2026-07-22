# Staging E2E sign-off (C3)

Repeatable checklist for **jobs & applications** on staging before production launch. Pair with automated smoke tests: `npm run test:e2e`.

## Prerequisites

- Staging Supabase project with **all migrations** applied (through `20260721000014_document_storage.sql`).
- Client `.env` pointed at staging (`VITE_APP_ENV=staging`, `VITE_STRICT_RBAC=true`, `VITE_ALLOW_DEMO_ADMIN=false`).
- Test accounts provisioned in `user_roles` / `admin_users` / `employers` per `docs/rbac.md`.
- Optional Playwright env (see `.env.example`):

  - `E2E_BASE_URL` — staging site URL (default `http://localhost:5173` for local).
  - `E2E_APPLICANT_EMAIL` / `E2E_APPLICANT_PASSWORD`
  - `E2E_EMPLOYER_EMAIL` / `E2E_EMPLOYER_PASSWORD`
  - `E2E_CATALOG_JOB_ID` — catalog job id from `/jobs` browse

## Checklist

| # | Step | Expected | Pass |
|---|------|----------|------|
| 1 | Register new applicant (or use test applicant) | Email verification flow; profile row in `users` / `applicants` | ☐ |
| 2 | Sign in as applicant | Lands on `/dashboard` | ☐ |
| 3 | Open `/dashboard/documents`, upload passport PDF | Row in `documents` + object in Storage bucket `documents`; download works | ☐ |
| 4 | Apply to **catalog** job (`/apply/{catalogId}`) | Required docs upload to Storage; application row created; docs linked via `application_id` | ☐ |
| 5 | Apply to **employer** job (published DB job) | Same as step 4 on employer-owned job | ☐ |
| 6 | Sign in as employer; open applicants tab | Sees application; can shortlist / reject | ☐ |
| 7 | Sign in as applicant; refresh applications | Status/stage reflects employer action (≤30s polling or manual refresh) | ☐ |
| 8 | Sign in as staff/admin; open `/admin/applications` | Pipeline actions work; document list loads from DB | ☐ |
| 9 | RBAC denial: applicant opens `/admin/applications` | Redirect or access denied (strict RBAC) | ☐ |
| 10 | RBAC denial: employer opens `/admin/super` | Denied unless admin role | ☐ |
| 11 | Sign out; open `/dashboard/documents` | Redirect to login | ☐ |

## Automated smoke

```bash
npm run test:e2e          # local: starts Vite client
npm run test:e2e:staging  # set E2E_BASE_URL to staging; E2E_SKIP_WEB_SERVER=1
```

## Test data cleanup

Run `scripts/e2e-cleanup.sql` in the **staging** SQL editor (edit email filters first). Removes applications, document metadata, and storage objects for designated test users only.

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| Product | | | |
