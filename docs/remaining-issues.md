# Outstanding Issues Report

**Generated:** 2026-07-22  
**Context:** Production Readiness Verification (no new implementation)  
**Overall go-live verdict:** **NOT PRODUCTION READY**

These items are **outside the application codebase** or are optional scale/polish. Code/platform suites (typecheck, build, env, Sprint 4/5 E2E) passed in this verification run.

---

## Blockers for PRODUCTION READY

| # | Issue | Owner | What “done” looks like |
|---|-------|-------|------------------------|
| 1 | Production secrets not evidenced on a live host (`STRIPE_*`, `RESEND_*`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`) | Ops | Values set on VPS `server/.env` (mode 600); `/api/health` shows required config booleans true |
| 2 | Hostinger DNS / TLS / PM2 cutover not evidenced | Ops | Canonical HTTPS domain serves SPA + `/api`; `pm2 status` healthy; `nginx -t` clean |
| 3 | Live Stripe Checkout + webhook not exercised | Ops | One successful live (or production-like) payment with signed webhook updating `payments` |
| 4 | Backup restore drill not recorded | Ops | Restore into non-prod project with timestamped evidence per `v1-launch-checklist.md` |

Until **all four** are complete with evidence, the overall verdict remains **NOT PRODUCTION READY**.

---

## Non-blocking (post-launch / scale)

| Issue | Notes |
|-------|-------|
| In-memory rate limiter | Fine for single PM2 process; use Redis before multi-instance |
| Multi-currency / PayPal | Optional; USD Stripe path is the V1 payment path |
| Locale English fallbacks | Keys synced; professional translation pass still recommended |
| No APM / centralized logs | Acceptable for single-VPS launch; add before scale |
| No load-test SLOs | Indexes/N+1 fixes landed; measure under real traffic |
| Sample catalog flag | Must stay unset/`false` in production client build |
| SPA Content-Security-Policy via Nginx | Optional hardening; not required for JSON API |

---

## Verification evidence (this run)

- Typecheck client/server: PASS  
- Client production build: PASS  
- `validate-environment.mjs`: 8 PASS  
- `verify-sprint5-complete.mjs`: 15 PASS  
- `verify-sprint4-complete.mjs`: 13 PASS  
- localStorage recruitment data: none (theme/language only)
- Architecture Review claim “most recruitment data lives in localStorage”: **FALSE / retracted** (canvas + `architecture.md` updated 2026-07-22)

See also: [`production-readiness-report.md`](./production-readiness-report.md), [`deployment-checklist.md`](./deployment-checklist.md), [`architecture.md`](./architecture.md).
