import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Stripe's webhook is a server-to-server call with no Origin/Referer header
// (verified separately via its signature), and health checks never mutate
// state — both are excluded from origin verification.
const EXCLUDED_PATHS = new Set(['/api/payments/webhook', '/api/health']);

function hostOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

/**
 * Defense-in-depth origin check for state-changing requests.
 *
 * This API is a Bearer-JWT-authenticated service — it does not use cookies,
 * so classic CSRF (which relies on a browser automatically attaching cookies
 * to cross-site requests) does not apply here. This middleware is an
 * additional layer, not a substitute for auth: it simply rejects
 * state-changing requests whose `Origin`/`Referer` header (when present)
 * does not match the configured `CLIENT_ORIGIN`. Requests with no
 * Origin/Referer at all (e.g. non-browser API clients, curl, mobile apps)
 * are only blocked in production/staging, where the SPA is the only expected
 * caller; development stays permissive for tooling like Postman/curl.
 */
export function originCheck() {
  const expectedHost = hostOf(env.CLIENT_ORIGIN);
  const enforceMissingHeader = env.APP_ENV === 'production' || env.APP_ENV === 'staging';

  return (req: Request, res: Response, next: NextFunction) => {
    if (!STATE_CHANGING_METHODS.has(req.method)) return next();
    if (EXCLUDED_PATHS.has(req.path) || req.originalUrl.startsWith('/api/payments/webhook')) {
      return next();
    }
    // Trusted server-to-server cron callers (e.g. interview reminders) never
    // send a browser Origin/Referer header. They still have to present the
    // correct `x-cron-secret` (validated by the route itself) or a valid
    // admin bearer token, so skipping the origin check here does not weaken
    // auth — it just avoids blocking a legitimate non-browser caller.
    if (req.headers['x-cron-secret']) {
      return next();
    }

    const originHeader = req.headers.origin;
    const refererHeader = req.headers.referer;
    const candidateHost = hostOf(originHeader) ?? hostOf(refererHeader);

    if (!candidateHost) {
      if (enforceMissingHeader) {
        return res.status(403).json({ error: 'Missing Origin/Referer header.' });
      }
      return next();
    }

    if (!expectedHost || candidateHost !== expectedHost) {
      return res.status(403).json({ error: 'Origin not allowed.' });
    }

    return next();
  };
}
