# Authentication

## Overview

The React client uses Supabase Auth (email + password). The SPA uses the **implicit** auth flow so email confirmation and password-reset links work on any browser or device. A stored PKCE code verifier is **not** required for those links.

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
   - **Production Site URL:** `https://globaljobsinternational.com`
   - **Production Redirect URLs** (allow list):
     - `https://globaljobsinternational.com/auth/callback`
     - `https://globaljobsinternational.com/auth/reset-password`
     - `https://globaljobsinternational.com/verify-email`
   - Local development may also allow `http://localhost:5173/...` while developing
3. The client sends `emailRedirectTo` / `redirectTo` from `VITE_PUBLIC_SITE_URL` in production builds (never `window.location.origin` when that would be localhost)
4. Optional: disable “Confirm email” only for local testing

### Email confirmation (cross-device)

Default Confirm signup templates use `{{ .ConfirmationURL }}`. With `flowType: 'implicit'`, Supabase redirects to `/auth/callback` with session tokens in the URL hash. The callback page establishes the session via `setSession` / `detectSessionInUrl` — no PKCE verifier needed.

Optional (recommended if you customize templates): point the link at a token-hash URL so the app calls `verifyOtp` directly:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

`/auth/callback` handles, in order:

1. `token_hash` + `type` → `verifyOtp` (any device)
2. `code` → `exchangeCodeForSession` **only** when a local PKCE verifier exists
3. Hash `access_token` / `refresh_token` → `setSession` (implicit flow)
4. Otherwise, if the email was already verified but no session can be created → “sign in” success state

## Routes

| Path | Purpose |
| --- | --- |
| `/register` | Create applicant account |
| `/login` | Sign in |
| `/forgot-password` | Request reset email |
| `/auth/reset-password` | Set new password from email link |
| `/verify-email` | Email verification instructions / resend |
| `/auth/callback` | Handles email confirmation / session from URL |
| `/dashboard` | Protected applicant dashboard |

## Flow

1. User registers → Supabase sends confirmation email
2. User opens link (any device) → `/auth/callback` establishes session or asks them to sign in
3. Verified users access `/dashboard`
4. Unverified sessions are redirected to `/verify-email`
