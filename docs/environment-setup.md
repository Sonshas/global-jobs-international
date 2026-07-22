# Environment setup guide

Complete guide for configuring **development**, **staging**, and **production**.
Annotated variable catalog: [`.env.example`](../.env.example).

---

## Variable reference (every variable)

| Variable | Used by | Where the value comes from |
|----------|---------|----------------------------|
| `VITE_APP_ENV` | Client | You choose: `development` \| `staging` \| `production` |
| `VITE_API_URL` | Client | Your API public URL **including** `/api` (local: `http://localhost:3001/api`) |
| `VITE_SUPABASE_URL` | Client | Supabase → **Project Settings → API → Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase → **Project Settings → API → `anon` `public`** |
| `VITE_STRICT_RBAC` | Client | Set `true` once roles are seeded (required staging/production) |
| `VITE_ALLOW_DEMO_ADMIN` | Client | Local-only; must be `false` in staging/production |
| `PORT` | Server | You choose (default `3001`) |
| `NODE_ENV` | Server | `development` locally; `production` on hosted API |
| `APP_ENV` | Server | `development` \| `staging` \| `production` (drives required secrets) |
| `CLIENT_ORIGIN` | Server | Exact SPA browser origin (CORS), e.g. `http://localhost:5173` |
| `SUPABASE_URL` | Server | Same Project URL as `VITE_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | Server | Same anon key as `VITE_SUPABASE_ANON_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase → **API → `service_role` `secret`**. **Never** in Vite/client. Optional locally; required staging/production. |
| `RESEND_API_KEY` | Server | [resend.com](https://resend.com) → API Keys. Optional locally (console log); required production. |
| `EMAIL_FROM` | Server | Address on a domain verified in Resend |
| `STRIPE_SECRET_KEY` | Server | Stripe Dashboard → **Developers → API keys**. Use `sk_test_` outside production and never expose it to Vite/client. |
| `STRIPE_WEBHOOK_SECRET` | Server | Stripe Dashboard → **Developers → Webhooks** → production endpoint signing secret (`whsec_...`). |
| `PUBLIC_APP_URL` | Server | Public HTTPS SPA origin, e.g. `https://www.example.com`; used for Stripe Checkout return URLs. |
| `E2E_*` | Playwright | Optional staging test accounts / URLs (see `.env.example`) |

---

## Development (local)

### 1. Create files

```bash
copy client\.env.example client\.env
copy server\.env.example server\.env
```

On macOS/Linux: `cp client/.env.example client/.env` (same for server).

### 2. Fill Supabase values

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your **dev** project.
2. **Project Settings → API**:
   - Copy **Project URL** → `client/.env` `VITE_SUPABASE_URL` and `server/.env` `SUPABASE_URL`
   - Copy **anon public** → `VITE_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
3. Leave `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` **blank** for normal local work.
4. Set `EMAIL_FROM` to any sensible From string (used when Resend is later enabled).

### 3. Auth URLs

Supabase → **Authentication → URL Configuration**:

- Site URL: `http://localhost:5173`
- Redirect URLs: `/auth/callback`, `/auth/reset-password`, `/verify-email`

For Sprint 3 automated verification, disable **Confirm email** on this isolated project so `signUp` returns a session.

### 4. Schema

```bash
npx supabase login
npx supabase link --project-ref <your-dev-ref>
npx supabase db push
```

### 5. Start and validate

```bash
npm run dev
```

- Server prints `APP_ENV=development` and whether service_role / Resend are set.
- If required vars are missing, the server **prints a checklist and exits with code 1** (no stack crash).

### 6. Verify Sprint 3

```bash
node scripts/probe-sprint3-schema.mjs
node scripts/verify-sprint3-workflow.mjs
```

---

## Staging

Use a **separate** Supabase project. Never reuse production keys.

| File | Notes |
|------|--------|
| `client/.env.staging` | From `client/.env.staging.example` |
| `server/.env.staging` | From `server/.env.staging.example` (or host env vars) |

Required on the staging **server**:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `APP_ENV=staging`, `NODE_ENV=production`
- `CLIENT_ORIGIN=https://staging.example.com` (your real staging SPA origin)

Optional: `RESEND_API_KEY` and Stripe test-mode variables (recommended before production cutover). When exercising Checkout, set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `PUBLIC_APP_URL=https://staging.example.com`; register the exact `/api/payments/webhook` endpoint in Stripe.

Deploy client with staging env; deploy API with staging secrets via host/CI — not into the browser bundle.

```bash
npx supabase link --project-ref <staging-ref>
npx supabase db push
```

Bootstrap first admin (SQL editor or CLI):

```sql
select public.assign_user_role('<admin-user-uuid>', 'super_admin', null);
select public.seed_platform_employer('<admin-user-uuid>');
```

---

## Production

Separate Supabase project again.

| File / store | Notes |
|--------------|--------|
| `client/.env.production` | Public `VITE_*` only |
| Host / secrets manager | All `server` secrets — never commit |

Required on the production **server**:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `EMAIL_FROM` (verified domain)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_APP_URL` (HTTPS browser origin)
- `APP_ENV=production`, `NODE_ENV=production`
- `CLIENT_ORIGIN=https://www.example.com`

```bash
npx supabase link --project-ref <production-ref>
npx supabase db push
```

Configure production Auth Site URL + redirects to the live SPA.

---

## Startup validation rules

| Condition | Behavior |
|-----------|----------|
| Missing/placeholder `SUPABASE_URL` or `SUPABASE_ANON_KEY` | Server exits with clear error (all environments) |
| Staging/production without `SUPABASE_SERVICE_ROLE_KEY` | Server exits with clear error |
| `APP_ENV=production` without `RESEND_API_KEY` / `EMAIL_FROM` | Server exits with clear error |
| `APP_ENV=production` without Stripe key, webhook secret, or public app URL | Server exits with clear error |
| Development without Resend / service_role | Allowed (email log mode; JWT routes work) |

Implementation: `server/src/config/env.ts` → `loadServerEnv()`.

---

## Checklist

- [ ] `client/.env` and `server/.env` exist for local development
- [ ] Supabase URL + anon match between client and server
- [ ] `service_role` and Resend keys exist only on server hosts for staging/production
- [ ] Stripe live key, webhook signing secret, and public app URL exist only on the production server
- [ ] Migrations pushed (`npx supabase db push`)
- [ ] `npm run typecheck` / `npm run dev` succeed
- [ ] `node scripts/verify-sprint3-workflow.mjs` → 15 PASS
