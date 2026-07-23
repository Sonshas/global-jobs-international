#!/usr/bin/env bash
# Sync only the built SPA to the VPS (fastest fix for white-page / missing VITE_*).
# Prerequisites: client/dist already built with client/.env.production
# Example:
#   npm run env:client:production && npm run build -w client && npm run verify:production:local
#   DEPLOY_HOST=203.0.113.10 DEPLOY_USER=deploy ./scripts/deploy-client-dist.sh
set -Eeuo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST to the VPS hostname or IP}"
: "${DEPLOY_USER:=deploy}"
: "${DEPLOY_PATH:=/var/www/global-jobs-international}"
: "${DEPLOY_PORT:=22}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ ! -f client/dist/index.html ]]; then
  echo "ERROR: client/dist missing. Run: npm run env:client:production && npm run build -w client" >&2
  exit 1
fi

if grep -R --quiet '127.0.0.1:0\|"unconfigured"' client/dist/assets 2>/dev/null; then
  echo "ERROR: client/dist still contains unconfigured Supabase fallback. Rebuild with .env.production." >&2
  exit 1
fi

if ! grep -R --quiet '\.supabase\.co' client/dist/assets 2>/dev/null; then
  echo "ERROR: client/dist has no inlined Supabase host. VITE_SUPABASE_URL was not baked in." >&2
  exit 1
fi

node scripts/verify-production-deploy.mjs --local-only

echo "Syncing client/dist → ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/client/dist"
rsync -az --delete \
  -e "ssh -p ${DEPLOY_PORT}" \
  client/dist/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/client/dist/"

echo "Synced. Hard-refresh https://globaljobsinternational.com (Ctrl+Shift+R)."
echo "Confirm HTML references a NEW /assets/index-*.js hash (not index-1Pp2xMKw.js)."
