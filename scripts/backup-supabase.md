# Supabase backup runbook

## Managed Supabase

1. Enable and verify the project’s automated database backups in the Supabase dashboard.
2. Set a retention period that meets the business recovery requirement.
3. Test a restore into a separate project before relying on backups for production.
4. Export or document Storage bucket retention separately: database backups do not replace object-storage recovery planning.

Record the backup owner, retention policy, last restore test, and recovery contact outside Git.

## Optional logical PostgreSQL backup

Run this from a secured Linux host with `pg_dump` installed. Store `DATABASE_URL` in the host environment or a root-readable secrets file; do not put it in this repository.

```bash
export DATABASE_URL='postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require'
backup_dir="/var/backups/gji/$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$backup_dir"/{database,release-metadata}
pg_dump --format=custom --no-owner --no-privileges \
  --file "$backup_dir/database/gji.dump" "$DATABASE_URL"
sha256sum "$backup_dir/database/gji.dump" > "$backup_dir/database/SHA256SUMS"
```

Copy the encrypted backup to a separate provider/account. Restrict the backup directory to the backup operator and regularly test:

```bash
pg_restore --list /var/backups/gji/<timestamp>/database/gji.dump
```

## Release metadata (no secrets)

For each backup or release, preserve a timestamped directory containing only:

- Git commit SHA and deployment timestamp
- `deploy/nginx.conf.example` rendered with domain/path only (no credentials)
- PM2 configuration and the list of enabled system services
- Migration version and `supabase db push` result

Do not copy `server/.env`, private keys, database URLs, access tokens, or Supabase service-role keys into Git or unencrypted backup metadata.

## Schedule and verify

- Schedule nightly logical dumps only when required in addition to Supabase’s managed backups.
- Alert on non-zero cron exit status and missing backup artifacts.
- Review backup freshness daily and run a documented restore test at least quarterly.
