# Deployment Checklist

**Verification status (2026-07-22):** Packaging and runbook are complete. Live cutover evidence is **not** yet recorded → overall go-live verdict remains **NOT PRODUCTION READY** until sections 1–3, 7–8, and 11 below are executed with evidence on the production host. See [`production-readiness-report.md`](./production-readiness-report.md) and [`remaining-issues.md`](./remaining-issues.md).

Concrete, ordered steps for shipping a release to production. For the full architecture and rationale, see [`hostinger-vps.md`](./hostinger-vps.md); for go/no-go sign-off, see [`v1-launch-checklist.md`](./v1-launch-checklist.md). This checklist is the "run book" version — follow it top to bottom for every release.

## 0. Pre-flight (build machine)

```bash
git pull
npm ci
npm run typecheck      # shared + server + client
npm run lint
npm run build           # shared -> server -> client
```

All three must pass with zero errors before continuing. If `npm run build` fails, stop — do not deploy a broken build.

## 1. Environment variables

Confirm every required variable exists in the target environment (see `.env.example` for the full annotated list).

**Server** (`server/.env` on the VPS, mode `600`, never committed):

```dotenv
NODE_ENV=production
APP_ENV=production
PORT=3001
CLIENT_ORIGIN=https://<your-domain>
PUBLIC_APP_URL=https://<your-domain>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=Global Jobs International <noreply@<your-domain>>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRON_SECRET=<random-long-secret>      # required to run interview-reminders unattended
```

**Client** (`client/.env.production`, local/uncommitted, used only at build time):

```dotenv
VITE_APP_ENV=production
VITE_API_URL=https://<your-domain>/api
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_STRICT_RBAC=true
VITE_ALLOW_DEMO_ADMIN=false
# Leave unset (or false) so public pages stay DB-only:
# VITE_ALLOW_SAMPLE_CATALOG=false
```

Never place `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` in any `VITE_*` variable or client file.

Run `node scripts/validate-environment.mjs` against the target `.env` files before deploying.

## 2. Database migrations

1. Apply and test all pending migrations against **staging** first.
2. Take a Supabase backup/snapshot before touching production.
3. Push migrations:
   ```bash
   npx supabase link --project-ref <production-project-ref>
   npx supabase db push --linked
   ```
4. Confirm with `npx supabase migration list --linked` that `local` and `remote` columns match for every migration, especially the newest one.
5. Migrations are forward-only unless a tested rollback migration exists — never hand-edit the remote schema outside of a migration file.

## 3. Build and package

On a trusted build machine (not the VPS, unless the VPS is also the build host):

```bash
npm ci
npm run build
```

This produces `client/dist` (static SPA) and `server/dist` (compiled API).

## 4. Deploy to the VPS

```bash
DEPLOY_HOST=<vps-ip> DEPLOY_USER=deploy ./scripts/deploy-hostinger.sh
```

The script `rsync`s built files, excludes `.env*`, installs production dependencies remotely, and reloads PM2. Confirm `server/.env` already exists on the VPS with mode `600` before the **first** deploy — the script does not create secrets.

First deploy only:

```bash
cd /var/www/global-jobs-international
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup   # then run the printed command, then `pm2 save` again
```

Subsequent deploys: the deploy script reloads PM2 automatically (`pm2 reload`), which is zero-downtime for a single-process setup.

## 5. Nginx and TLS

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/global-jobs-international
sudo ln -s /etc/nginx/sites-available/global-jobs-international /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d <your-domain> -d www.<your-domain>
```

Replace the example domain/path before enabling. Enable HSTS in the Nginx config only after confirming every subdomain is HTTPS-only.

## 6. Stripe webhook

1. In the Stripe dashboard (live mode), create a webhook endpoint: `https://<your-domain>/api/payments/webhook`.
2. Subscribe to the checkout/payment events the payments route consumes (see `server/src/routes/payments.ts`).
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET` on the server (not the client).
4. Send a Stripe test event from the dashboard and confirm a `200` response and a corresponding row in the `payments` table.

## 7. Cron / scheduled jobs

The only scheduled job today is interview reminders (`POST /api/jobs/interview-reminders`), authorized either by `x-cron-secret: $CRON_SECRET` or an authenticated admin JWT.

1. Set `CRON_SECRET` on the server to a long random value.
2. Schedule a daily/hourly HTTP call from the hosting provider's scheduler or an external cron service (e.g. system `cron`, a managed scheduler, or an uptime-monitor "cron" feature):
   ```bash
   curl -X POST https://<your-domain>/api/jobs/interview-reminders \
     -H "x-cron-secret: $CRON_SECRET"
   ```
3. Verify the response body (`remindersSent`, `emailsSent`) after the first scheduled run.

## 8. Smoke tests (post-deploy, every release)

```bash
curl -fsS https://<your-domain>/api/health
pm2 status
pm2 logs gji-api --lines 100
sudo nginx -t
```

`/api/health` returns `appEnv` and configuration booleans only (never secrets). Confirm `appEnv: "production"` and that Supabase, Resend, and Stripe all report configured.

Manual smoke pass (authenticated):

- [ ] Sign in as an applicant, employer, and admin account.
- [ ] Applicant: upload a document, submit an application, see it in the pipeline.
- [ ] Employer: create/edit/publish a job (only while `active`); confirm a `pending`/`rejected`/`suspended` employer cannot.
- [ ] Admin: approve/reject an employer; confirm the change persists after reload.
- [ ] Payments: run a Checkout session end-to-end (test mode first, then a single low-value live transaction) and confirm the webhook updates the `payments` row.
- [ ] Public pages (home, jobs browse, job detail, countries, verified employers) render real data only — no sample/demo banners in production.
- [ ] Run the cron endpoint once manually and confirm reminders/emails behave as expected.

## 9. Monitoring and log rotation

1. Create an uptime monitor for `https://<your-domain>/api/health` (5-minute interval), alerting an on-call owner.
2. Install log rotation:
   ```bash
   sudo cp deploy/logrotate-gji.conf.example /etc/logrotate.d/global-jobs-international
   sudo logrotate -d /etc/logrotate.d/global-jobs-international   # dry run first
   ```
3. Review `pm2 logs gji-api` and `/var/log/nginx/*` after every release.

## 10. Rollback

Keep the previous release artifact (`client/dist`, `server/dist`, non-secret deploy files).

```bash
cd /var/www/global-jobs-international
pm2 reload deploy/ecosystem.config.cjs --update-env
curl -fsS https://<your-domain>/api/health
```

Database rollback requires a tested down-migration; there is none by default, so treat schema changes as forward-only and rehearse them in staging first.

## 11. Backups

- Confirm Supabase automated backups are enabled with a documented retention period and owner.
- Optionally follow [`scripts/backup-supabase.md`](../scripts/backup-supabase.md) for encrypted nightly `pg_dump` backups.
- Periodically rehearse a restore into a non-production project — see [`remaining-issues.md`](./remaining-issues.md) for current status.

---

For the full pre-launch sign-off (RBAC review, secrets audit, DNS, etc.), use [`v1-launch-checklist.md`](./v1-launch-checklist.md) alongside this document.
