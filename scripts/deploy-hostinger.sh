#!/usr/bin/env bash
# Build locally, sync a release to a Linux VPS, then reload the PM2 API.
# Prerequisites: bash, npm, rsync, SSH key access, Node 20+ and PM2 on the VPS.
# Example:
#   DEPLOY_HOST=203.0.113.10 DEPLOY_USER=deploy ./scripts/deploy-hostinger.sh
#
# The VPS must already contain server/.env with mode 600. This script excludes
# all .env files and never transfers secrets.
set -Eeuo pipefail

: "${DEPLOY_HOST:?Set DEPLOY_HOST to the VPS hostname or IP}"
: "${DEPLOY_USER:=deploy}"
: "${DEPLOY_PATH:=/var/www/global-jobs-international}"
: "${DEPLOY_PORT:=22}"
: "${DEPLOY_SITE_URL:=https://globaljobsinternational.com}"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ ! -f client/.env.production ]]; then
  echo "ERROR: client/.env.production is required before a production build." >&2
  echo "Copy client/.env.production.example and fill real VITE_* values." >&2
  echo "Building without it produces a blank white page in the browser." >&2
  exit 1
fi

npm ci
npm run build
node scripts/verify-production-deploy.mjs --local-only

rsync -az --delete \
  --exclude '.git/' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'node_modules/' \
  --exclude 'coverage/' \
  --exclude '*.log' \
  -e "ssh -p ${DEPLOY_PORT}" \
  ./ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

ssh -p "$DEPLOY_PORT" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "cd '${DEPLOY_PATH}' && npm ci --omit=dev && pm2 reload deploy/ecosystem.config.cjs --update-env && pm2 save && curl -fsS http://127.0.0.1:3001/api/health | head -c 300 && echo"

echo "Deployment complete."
echo "Verify publicly: curl -fsS ${DEPLOY_SITE_URL}/api/health"
echo "Or: node scripts/verify-production-deploy.mjs ${DEPLOY_SITE_URL}"
