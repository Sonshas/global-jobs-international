# Authentication

## Overview

The React client uses Supabase Auth (email + password) with PKCE.

## Required environment variables

See `docs/environments.md` for development / staging / production.

Create `client/.env`:

```env
VITE_APP_ENV=development
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_STRICT_RBAC=true
VITE_ALLOW_DEMO_ADMIN=false
```

Roles are assigned in Postgres (`public.assign_user_role`) — see `docs/rbac.md`.
## Supabase dashboard settings

1. Authentication → Providers → Email enabled
2. Authentication → URL Configuration
   - Site URL: `http://localhost:5173`
   - Redirect URLs:
     - `http://localhost:5173/auth/callback`
     - `http://localhost:5173/auth/reset-password`
3. Optional: disable “Confirm email” only for local testing

## Routes

| Path | Purpose |
| --- | --- |
| `/register` | Create applicant account |
| `/login` | Sign in |
| `/forgot-password` | Request reset email |
| `/auth/reset-password` | Set new password from email link |
| `/verify-email` | Email verification instructions / resend |
| `/auth/callback` | Handles email confirmation / OAuth-style code exchange |
| `/dashboard` | Protected applicant dashboard |

## Flow

1. User registers → Supabase sends confirmation email
2. User opens link → `/auth/callback` establishes session
3. Verified users access `/dashboard`
4. Unverified sessions are redirected to `/verify-email`
