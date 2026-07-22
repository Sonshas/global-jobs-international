# Architecture Overview

**Last persistence audit:** 2026-07-22

## Monorepo layout

```
global-jobs-international/
├── client/     # React 19 + Vite frontend
├── server/     # Express + TypeScript API
├── shared/     # Shared types and contracts
├── supabase/   # SQL migrations (Postgres + RLS + Storage policies)
└── docs/       # Project documentation
```

## Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Routing  | React Router                             |
| Data     | TanStack React Query → Supabase JS       |
| Forms    | React Hook Form + Zod                    |
| Motion   | Framer Motion                            |
| i18n     | i18next / react-i18next                  |
| Backend  | Node.js, Express, TypeScript             |
| Database | Supabase (Postgres + Auth + Storage)     |
| Payments | Stripe Checkout + webhooks               |

## Persistence model (system of record)

**Supabase is the system of record for all recruitment / ATS business data.**

| Domain | Store |
|--------|--------|
| Users, applicants, employers, employer profiles | Postgres |
| Jobs, countries, categories | Postgres |
| Applications, pipeline / status history | Postgres |
| Documents (metadata + files) | Postgres + Storage bucket `documents` |
| Payments | Postgres (written by API + Stripe webhook) |
| Conversations, messages (application + support) | Postgres (+ Realtime) |
| Notifications, interviews, saved jobs, visa progress | Postgres |
| Staff notes, campaigns, settings, activity logs | Postgres |
| Roles / RBAC (`user_roles`, `admin_users`) | Postgres |

### Browser storage (UI preferences only)

| Key | Purpose | Business data? |
|-----|---------|----------------|
| `gji-theme` | Theme preference | No |
| `gji-language` | Locale preference | No |

**Retracted (stale Architecture Review claim):** “Most recruitment data lives in browser localStorage, not Supabase.” That statement is **false** as of the 2026-07-22 audit. Clearing browser storage does not delete applications, jobs, documents, payments, or messages.

Optional DEV-only sample job catalog may appear in memory when `allowSampleCatalog()` is true (`import.meta.env.DEV` or `VITE_ALLOW_SAMPLE_CATALOG=true`). It must stay disabled in production client builds.

## Request flow

1. The Vite client talks to Supabase (Auth + Postgres RLS + Storage) via repositories under `client/src/repositories/`, wrapped by TanStack Query hooks.
2. The client also calls the Express API under `/api` for health, audit fan-out, Stripe checkout/webhooks, email/comms, admin privilege ops, and interview reminders.
3. In development, Vite proxies `/api` to `http://localhost:3001`.
4. The browser uses the anon key (RLS enforced). The server uses the service role key only for privileged operations (webhooks, cron, admin).

## Conventions

- Feature UI lives under `client/src/` (pages, components, hooks).
- Domain persistence lives in `client/src/repositories/` (not browser storage).
- API routes live under `server/src/routes/`.
- Cross-cutting types and API contracts live in `shared/src/`.
- Keep environment secrets out of git; copy `.env.example` files locally.

## Related docs

- Interactive Architecture Review canvas: project canvases `gji-architecture-review.canvas.tsx` (updated 2026-07-22)
- [`production-readiness-report.md`](./production-readiness-report.md)
- [`remaining-issues.md`](./remaining-issues.md)
- [`deployment-checklist.md`](./deployment-checklist.md)
