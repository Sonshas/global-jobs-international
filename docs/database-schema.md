# Database Schema

Production PostgreSQL schema for **Global Jobs International**, designed for Supabase.

## Location

```
supabase/migrations/
├── 20260721000001_extensions_enums_helpers.sql
├── 20260721000002_reference_tables.sql
├── 20260721000003_identity_rbac.sql
├── 20260721000004_applicants_employers.sql
├── 20260721000005_jobs_requirements.sql
├── 20260721000006_applications_documents.sql
├── 20260721000007_messaging_notifications.sql
├── 20260721000008_payments_visa_interviews_reviews.sql
├── 20260721000009_activity_settings.sql
├── 20260721000010_rls_policies.sql
├── 20260721000011_seed_reference_data.sql
├── 20260721000012_application_numbers_catalog_jobs.sql
├── 20260721000013_rbac_staff_platform_rls.sql
└── 20260721000014_document_storage.sql
```

See also: `docs/document-storage.md` for Storage bucket policies and upload path conventions.

## Entity overview

| Table | Purpose |
| --- | --- |
| `users` | App profile linked 1:1 to `auth.users` |
| `roles` / `permissions` / `role_permissions` / `user_roles` | RBAC |
| `admin_users` | Admin staff profiles |
| `applicants` | Job seeker profiles |
| `employers` / `employer_profiles` | Hiring organizations |
| `countries` / `cities` / `languages` | Geo + i18n references |
| `job_categories` / `jobs` / `job_requirements` | Job catalog |
| `applications` / `application_status_history` | Applications lifecycle |
| `document_types` / `documents` | Uploaded files metadata (+ private Storage bucket `documents`) |
| `conversations` / `messages` | Applicant ↔ employer messaging |
| `notifications` | In-app / multi-channel alerts |
| `payment_methods` / `payments` | Billing |
| `visa_progress` | Visa tracking per application |
| `interviews` | Interview scheduling |
| `reviews` | Ratings and testimonials |
| `activity_logs` | Audit trail |
| `settings` | Global + per-user settings |

## Key relationships

```
auth.users 1──1 users
users 1──1 applicants | employers(owner) | admin_users
users M──M roles (user_roles)
roles M──M permissions (role_permissions)
countries 1──M cities
employers 1──1 employer_profiles
employers 1──M jobs
jobs M──1 job_categories / countries / cities
jobs 1──M job_requirements / applications
applicants 1──M applications / documents / visa_progress
applications 1──M application_status_history / interviews
applications 1──1 visa_progress
conversations 1──M messages
users 1──M notifications / payments / payment_methods / activity_logs / settings
```

## Apply migrations

### Option A — Supabase CLI

```bash
npx supabase link --project-ref netbkjozigrfmlebvaob
npx supabase db push
```

### Option B — SQL Editor

Run the files in timestamp order in the Supabase SQL Editor.

## Notes

- `public.users.id` equals `auth.users.id`
- Signup trigger creates `public.users`, then applicant/employer/admin rows by `account_type`
- Application status changes are appended to `application_status_history`
- RLS is enabled on every table; admins bypass via `is_admin()`
- Extra junction table `role_permissions` is included so roles and permissions are fully related
