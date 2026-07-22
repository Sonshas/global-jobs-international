# Sprint 3 verification setup

## 1. Environment files

Follow **[`docs/environment-setup.md`](./environment-setup.md)** for the full guide.

Local minimum:

1. Ensure `client/.env` and `server/.env` exist (already generated for this repo’s linked project).
2. Supabase URL + anon must match between client and server.
3. Leave `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` blank for local Sprint 3.
4. Templates: root `.env.example`, `client/.env.example`, `server/.env.example`.

## 2. Secret locations

| Variable | Source | Configure in |
|----------|--------|--------------|
| `SUPABASE_URL` / anon keys | Supabase → Project Settings → API | `client/.env` + `server/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → `service_role` | **Server host / `server/.env` only** (optional locally) |
| `RESEND_API_KEY` | https://resend.com | **Server host / `server/.env` only** (optional locally) |

## 3. Database

```bash
npx supabase login   # if needed
npx supabase db push
```

## 4. Auth

Disable email confirmation on the isolated verification project so `signUp` returns a session.

## 5. Run

```bash
node scripts/probe-sprint3-schema.mjs
node scripts/verify-sprint3-workflow.mjs
```

Both scripts fail fast with explicit missing-variable messages (`ENV_PREFLIGHT_FAILED`) instead of generic Supabase/network errors.
The server also validates env on startup (`server/src/config/env.ts`).
