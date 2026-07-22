# Role-based access control (RBAC)

## Roles

| Platform role | Database source | Client access |
|---------------|-----------------|---------------|
| **Applicant** | `roles.slug = applicant` or default | Dashboard, apply, own applications |
| **Employer** | `roles.slug = employer` and/or `users.account_type = employer` | `/dashboard/employer` |
| **Staff** | `roles.slug = advisor` (mapped to `staff` in the app) | `/admin/applications`, jobs, employers, reports |
| **Admin** | `roles.slug = admin` and/or `admin_users` | Staff routes + operational admin |
| **Super Admin** | `roles.slug = super_admin` | `/admin`, `/admin/super` control plane |

Elevated privileges in **staging/production** come only from Postgres (`user_roles`, `admin_users`). JWT `user_metadata.role` alone cannot grant admin/staff/super_admin when strict RBAC is on.

## Database helpers (migration `…013`)

| Function | Purpose |
|----------|---------|
| `has_role(slug)` | Active, non-expired role membership |
| `is_staff()` | Advisor **or** admin **or** super_admin **or** `admin_users` |
| `is_admin()` | Admin / super_admin / `admin_users` |
| `is_super_admin()` | `super_admin` role only |
| `has_permission(slug)` | Role permissions (unchanged semantics; admins pass) |
| `assign_user_role(user, slug, by)` | Idempotent role grant (+ `admin_users` for admin roles) — **service_role** |
| `seed_platform_employer(owner)` | Creates the catalog employer — **service_role** |

## RLS highlights

- Published jobs: public read; employers manage own rows; admins manage all.
- Applications: applicant owner, employer (own jobs), staff, admins.
- Application **DELETE**: applicant withdraw, staff, or admin.
- Staff SELECT/UPDATE on applications + SELECT on applicants.
- Reference data: public read of active rows; admin manage.
- `user_roles` / `admin_users`: users see own membership; only admins manage assignments.

## Client route guards

| Guard | Routes |
|-------|--------|
| `ProtectedRoute` | Authenticated + email verified |
| `EmployerRoute` | Employer / admin / super_admin |
| `AdminRoute` (staff ops) | Staff / admin / super_admin |
| `SuperAdminRoute` | Admin / super_admin |

Demo admin (`VITE_ALLOW_DEMO_ADMIN=true`) is **opt-in local development only** and is rejected when `VITE_APP_ENV` is staging/production or when building for production.

## Server

`POST /api/audit` requires `Authorization: Bearer <supabase_access_token>`. Unauthenticated requests receive `401`.
