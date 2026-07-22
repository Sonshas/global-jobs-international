# Version 1.0 launch checklist

Use this checklist for the production go/no-go. Each checked item needs an owner and evidence in the release record.

## Access, authentication, and RBAC

- [ ] Production Supabase project is separate from development and staging.
- [ ] Supabase Site URL and all authentication redirect URLs use the production HTTPS domain.
- [ ] Email confirmation, password reset, and sign-in have been tested with production-like accounts.
- [ ] `VITE_ALLOW_DEMO_ADMIN=false` and `VITE_STRICT_RBAC=true` in the production client build.
- [ ] First super admin has been assigned with `public.assign_user_role`, not browser metadata.
- [ ] Applicant, employer, staff, and admin access has been tested for least privilege.
- [ ] No service-role key, Stripe secret, Resend key, or other secret appears in a Vite bundle, Git history, logs, or client environment file.

## Documents and application pipeline

- [ ] Document storage bucket, MIME/size limits, and RLS policies have been deployed and verified.
- [ ] Applicant upload, download, replacement, and unauthorized-access cases have been tested.
- [ ] Application creation, status transitions, notifications, and audit history have been smoke tested.
- [ ] Recovery behavior for a failed document upload or notification is documented.

## Employer approval and jobs

- [ ] Employer approval/rejection is performed by authorized staff and persists after reload.
- [ ] Pending, rejected, and suspended employers cannot create or edit jobs.
- [ ] An approved active employer can create, edit, publish, and close only its own jobs.
- [ ] Public job browsing shows only intended published/verified content.

## Payments and communications

- [ ] Stripe uses live keys only in the production server environment.
- [ ] Stripe webhook endpoint is `https://<domain>/api/payments/webhook` and its signing secret is set.
- [ ] Test a successful Checkout flow, cancellation, retry, duplicate webhook delivery, and payment audit trail.
- [ ] Resend domain is verified; transactional email has been tested with a real recipient.
- [ ] Payment support/refund and webhook incident ownership is assigned.

## Deployment and configuration

- [ ] `npm ci`, `npm run build`, `npm run typecheck`, and applicable E2E tests pass from the release commit.
- [ ] All migrations have been applied to staging, tested, backed up, then applied to production.
- [ ] `client/.env.production` contains public `VITE_*` values only.
- [ ] VPS `server/.env` has mode `600`, uses production values, and is excluded from deploy sync.
- [ ] PM2 starts on reboot and `pm2 status` reports one healthy `gji-api` process.
- [ ] Nginx serves the SPA, proxies `/api`, and has passed `nginx -t`.
- [ ] HTTPS redirect and valid certificate work for the canonical domain.
- [ ] Rollback artifact and owner are available before the release starts.

## Monitoring, backups, and post-launch

- [ ] `/api/health` returns `status: ok`, `appEnv: production`, and all required configuration booleans are true.
- [ ] UptimeRobot (or equivalent) monitors the HTTPS health endpoint and alerts an on-call owner.
- [ ] PM2/Nginx logs, restart count, disk/memory, certificate expiry, and provider status are monitored.
- [ ] Log rotation has been installed and dry-run verified.
- [ ] Supabase automated backups have documented retention and an accountable owner.
- [ ] Optional logical backup schedule, off-site encryption, and failure alerting are configured if required.
- [ ] A database restore has been tested into a non-production project within the agreed recovery objective.
- [ ] Post-launch owners and 24-hour hypercare contacts are recorded.
