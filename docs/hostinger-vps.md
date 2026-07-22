# Hostinger VPS deployment (Global Jobs International)

This guide deploys the Vite client as Nginx static files and the Express API with PM2 on port `3001`. It assumes Ubuntu/Debian, a Node 20+ VPS, and a separate production Supabase project.

## 1. Provision the VPS

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx rsync
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo adduser --disabled-password --gecos "" deploy
sudo mkdir -p /var/www/global-jobs-international
sudo chown -R deploy:deploy /var/www/global-jobs-international
```

Use SSH keys, disable password login after confirming access, and allow only ports `22`, `80`, and `443` in the VPS firewall.

## 2. DNS and Supabase Auth

1. Create DNS `A` records for `example.com` and optionally `www.example.com` pointing to the VPS public IP. Wait for propagation.
2. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://example.com`.
3. Add production redirect URLs for `https://example.com/auth/callback`, `/auth/reset-password`, and `/verify-email`.
4. Use a production Supabase project; never share staging keys or a database with production.

## 3. Configure production environment variables

Create `/var/www/global-jobs-international/server/.env` as the `deploy` user, then restrict it:

```bash
chmod 600 /var/www/global-jobs-international/server/.env
```

Required server variables:

```dotenv
NODE_ENV=production
APP_ENV=production
PORT=3001
CLIENT_ORIGIN=https://example.com
PUBLIC_APP_URL=https://example.com
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
RESEND_API_KEY=<resend-api-key>
EMAIL_FROM=Global Jobs International <noreply@example.com>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Never place service-role, Resend, Stripe, SSH, or database credentials in `client/.env*`, a `VITE_*` variable, Nginx config, PM2 config, or Git. In Stripe, create a live webhook for `https://example.com/api/payments/webhook` and subscribe to the events required by the payments route.

Before the client build, create a local, uncommitted `client/.env.production`:

```dotenv
VITE_APP_ENV=production
VITE_API_URL=https://example.com/api
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_STRICT_RBAC=true
VITE_ALLOW_DEMO_ADMIN=false
```

## 4. Build and deploy

On a trusted build machine:

```bash
npm ci
npm run build
DEPLOY_HOST=<vps-ip> DEPLOY_USER=deploy ./scripts/deploy-hostinger.sh
```

The script transfers built files with `rsync`, excludes `.env*`, installs production dependencies on the VPS, and reloads PM2. Confirm `/var/www/global-jobs-international/server/.env` remains on the VPS before the first deployment.

For the first deployment on the VPS:

```bash
cd /var/www/global-jobs-international
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
# Run the command printed by `pm2 startup`, then:
pm2 save
```

## 5. Configure Nginx and TLS

```bash
sudo cp /var/www/global-jobs-international/deploy/nginx.conf.example \
  /etc/nginx/sites-available/global-jobs-international
sudo ln -s /etc/nginx/sites-available/global-jobs-international \
  /etc/nginx/sites-enabled/global-jobs-international
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com
sudo systemctl enable --now nginx
```

Replace the example domain and path before enabling the site. Certbot should redirect HTTP to HTTPS. After testing HTTPS, enable the HSTS line in `deploy/nginx.conf.example` only when every subdomain is HTTPS-capable.

## 6. Validate the release

```bash
curl -fsS https://example.com/api/health
pm2 status
pm2 logs gji-api --lines 100
sudo nginx -t
```

`/api/health` reports the application environment and boolean configuration state only; it deliberately never returns keys. Confirm `appEnv` is `production` and that Supabase anon, service-role, Resend, and Stripe are configured. Complete an authenticated smoke test for sign-in, documents, application pipeline, employer approval, and Stripe webhook delivery.

## 7. Monitoring, logs, and rotation

1. Create an UptimeRobot HTTPS monitor for `https://example.com/api/health` (5-minute interval) and send alerts to the on-call owner.
2. Monitor certificate expiration, VPS disk space, memory, CPU, PM2 restarts, and Supabase/Stripe/Resend provider status.
3. Review `pm2 logs gji-api` and `/var/log/nginx/*` after every release.
4. Install rotation:

```bash
sudo cp /var/www/global-jobs-international/deploy/logrotate-gji.conf.example \
  /etc/logrotate.d/global-jobs-international
sudo logrotate -d /etc/logrotate.d/global-jobs-international
```

Adjust the PM2 Linux user in that file. The first run uses `-d` (dry run); run without `-d` only after verification.

## 8. Backups and recovery

- Enable Supabase automated backups and record retention and owner.
- Follow [`scripts/backup-supabase.md`](../scripts/backup-supabase.md) for optional encrypted nightly `pg_dump` backups and quarterly restore tests.
- Use cron or a managed scheduler for nightly backups; alert on failures and missing artifacts.
- Preserve release metadata without secrets. Do not back up `.env` to Git or an unencrypted location.

## 9. Rollback

Keep the previous release artifact. If a release fails, restore the previous `client/dist`, `server/dist`, and non-secret deployment files, then run:

```bash
cd /var/www/global-jobs-international
pm2 reload deploy/ecosystem.config.cjs --update-env
curl -fsS https://example.com/api/health
```

Database migrations are forward-only unless a tested rollback migration exists. Take a backup and test migrations against staging before `supabase db push` in production.
