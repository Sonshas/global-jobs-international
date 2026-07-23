import type { NextFunction, Request, Response } from 'express';
import { clientOrigins, env } from '../config/env.js';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const EXCLUDED_PATH_PREFIXES = [
  '/api/payments/webhook',
  '/payments/webhook',
  '/api/health',
  '/health',
];

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
 * Allows every host listed in CLIENT_ORIGIN (comma-separated).
 */
export function originCheck() {
  const expectedHosts = new Set(
    clientOrigins()
      .map((origin) => hostOf(origin))
      .filter((host): host is string => Boolean(host)),
  );
  const enforceMissingHeader = env.APP_ENV === 'production' || env.APP_ENV === 'staging';

  return (req: Request, res: Response, next: NextFunction) => {
    if (!STATE_CHANGING_METHODS.has(req.method)) return next();

    const path = req.originalUrl.split('?')[0] ?? req.path;
    if (EXCLUDED_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return next();
    }
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

    if (expectedHosts.size === 0 || !expectedHosts.has(candidateHost)) {
      return res.status(403).json({ error: 'Origin not allowed.' });
    }

    return next();
  };
}
