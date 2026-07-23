#!/usr/bin/env bash
# Rebuild + reload on the Hostinger VPS itself (after git pull).
# Usage (on the VPS as deploy):
#   ./scripts/vps-production-rebuild.sh
set -Eeuo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/global-jobs-international}"
cd "$DEPLOY_PATH"

if [[ ! -f client/.env.production ]]; then
  echo "ERROR: missing client/.env.production" >&2
  echo "Copy client/.env.production.example and fill real VITE_* values, then re-run." >&2
  exit 1
fi

if [[ ! -f server/.env ]]; then
  echo "ERROR: missing server/.env" >&2
  echo "Copy server/.env.production.example → server/.env and fill secrets (chmod 600)." >&2
  exit 1
fi

chmod 600 server/.env || true

echo "==> Installing dependencies"
npm ci

echo "==> Building shared + server + client"
npm run build

echo "==> Reloading PM2 API"
pm2 reload deploy/ecosystem.config.cjs --update-env
pm2 save

echo "==> Verifying local API"
curl -fsS "http://127.0.0.1:3001/api/health" | head -c 400
echo
curl -fsS "http://127.0.0.1:3001/health" | head -c 400
echo

echo "==> Checking client bundle for missing-env fallback"
if grep -R --quiet '127.0.0.1:0' client/dist/assets 2>/dev/null; then
  echo "ERROR: client/dist still contains the unconfigured Supabase fallback." >&2
  echo "Rebuild with a real client/.env.production." >&2
  exit 1
fi

if ! grep -R --quiet '/assets/' client/dist/index.html; then
  echo "ERROR: client/dist/index.html does not reference hashed /assets/ bundles." >&2
  exit 1
fi

echo "OK. Next: confirm Nginx root=client/dist and proxy_pass has no trailing slash,"
echo "then: curl -fsS https://globaljobsinternational.com/api/health"
