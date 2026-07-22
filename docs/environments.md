# Environments (Development / Staging / Production)

Global Jobs International uses **separate Supabase projects** and env files per environment. Never share production service-role keys with the browser or with non-production apps.

## Projects

| Environment | Purpose | Supabase | Client env | Server env |
|-------------|---------|----------|------------|------------|
| **Development** | Local engineers | Dev project | `client/.env` | `server/.env` |
| **Staging** | Pre-release QA | Staging project | `client/.env.staging` | `server/.env.staging` |
| **Production** | Live traffic | Production project | `client/.env.production` | `server/.env.production` |

Full annotated template: root [`.env.example`](../.env.example).  
Step-by-step setup: [`docs/environment-setup.md`](./environment-setup.md).

## Required variables by environment

### Client (`VITE_*` only — public)

| Variable | Dev | Staging | Production | Description |
|----------|-----|---------|------------|-------------|
| `VITE_APP_ENV` | required | required | required | `development` \| `staging` \| `production` |
| `VITE_API_URL` | required | required | required | Express API base **including** `/api` |
| `VITE_SUPABASE_URL` | required | required | required | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | required | required | required | Anon/public key only |
| `VITE_STRICT_RBAC` | recommended `true` | required `true` | required `true` | Postgres-backed roles |
| `VITE_ALLOW_DEMO_ADMIN` | optional | must be `false` | must be `false` | Local demo bypass |

### Server (private)

| Variable | Dev | Staging | Production | Description |
|----------|-----|---------|------------|-------------|
| `PORT` | optional (3001) | optional | optional | API listen port |
| `NODE_ENV` | `development` | `production` | `production` | Node runtime mode |
| `APP_ENV` | `development` | `staging` | `production` | Product environment |
| `CLIENT_ORIGIN` | required | required | required | Exact SPA origin for CORS |
| `SUPABASE_URL` | required | required | required | Same project as client |
| `SUPABASE_ANON_KEY` | required | required | required | JWT verification |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | **required** | **required** | Server-only admin API |
| `RESEND_API_KEY` | optional (log mode) | optional | **required** | Transactional email |
| `EMAIL_FROM` | optional | optional | **required** | Verified Resend sender |

The server **refuses to start** if required variables are missing or still placeholders. Development requires real `SUPABASE_URL` + `SUPABASE_ANON_KEY` (auth/comms cannot run without them).

## Where to configure secrets

| Secret | Where to obtain | Where to put it |
|--------|-----------------|-----------------|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Supabase → Project Settings → API → Project URL | `client/.env*` and `server/.env*` |
| `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` | `client/.env*` and `server/.env*` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` `secret` | **Server only**: `server/.env*`, VPS/host env, or CI secrets manager. **Never** Vite / browser / git. |
| `RESEND_API_KEY` | [resend.com](https://resend.com) API keys | **Server only**: `server/.env*` or host secrets |
| `EMAIL_FROM` | Domain verified in Resend | `server/.env*` |

## Schema sync

```bash
npx supabase link --project-ref <dev-ref>
npx supabase db push
```

Apply the same ordered migrations under `supabase/migrations/` to every environment.

## Auth URL configuration (each Supabase project)

Set Site URL and Redirect URLs for that environment’s SPA origin.

## Role bootstrap

```sql
select public.assign_user_role('<user-uuid>', 'super_admin', null);
select public.seed_platform_employer('<user-uuid>');
```

Use the Supabase SQL editor or `npx supabase db query --linked` (privileged). Local Sprint 3 verification provisions a disposable operator this way and does not require `SUPABASE_SERVICE_ROLE_KEY`.
