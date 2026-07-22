import type { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory, per-process rate limiter keyed by client IP.
 *
 * Each call to `rateLimit()` creates its own independent bucket map, so
 * mounting a second, stricter instance on a specific router (e.g.
 * `/api/admin`) does not share counters with the API-wide instance mounted
 * globally — each limiter tracks only the requests that actually pass
 * through it.
 *
 * Caveat: because state lives in process memory, limits reset per process
 * and are not shared across multiple server instances/replicas. See
 * `docs/remaining-issues.md` for the multi-instance follow-up (e.g. a
 * Redis-backed limiter) needed before horizontal scaling.
 */
export function rateLimit(options?: { windowMs?: number; max?: number }) {
  const windowMs = options?.windowMs ?? 60_000;
  const max = options?.max ?? 120;
  const hits = new Map<string, { count: number; reset: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = hits.get(key);
    if (!bucket || now > bucket.reset) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    if (bucket.count >= max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    bucket.count += 1;
    hits.set(key, bucket);
    return next();
  };
}
