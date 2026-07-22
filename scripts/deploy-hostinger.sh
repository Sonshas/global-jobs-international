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

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm ci
npm run build

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
  "cd '${DEPLOY_PATH}' && npm ci --omit=dev && pm2 reload deploy/ecosystem.config.cjs --update-env && pm2 save"

echo "Deployment complete. Verify: https://<domain>/api/health"
