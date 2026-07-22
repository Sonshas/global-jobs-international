import cors from 'cors';
import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { auditRouter } from './routes/audit.js';
import { commsRouter } from './routes/comms.js';
import { paymentsRouter } from './routes/payments.js';
import { adminRouter } from './routes/admin.js';
import { jobsRouter } from './routes/jobs.js';
import { rateLimit } from './middleware/rateLimit.js';
import { originCheck } from './middleware/originCheck.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

export function createApp() {
  const app = express();

  app.use(
    helmet({
      // This is a JSON API (no HTML templates rendered server-side), so the
      // default CSP mainly adds noise without protecting anything here; the
      // SPA itself sets its own CSP via its static host. Cross-origin
      // resource policy stays permissive so the SPA (served from a different
      // origin/CDN) can fetch API responses without being blocked by CORP.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader('X-Request-Id', randomUUID());
    next();
  });
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  // Stripe verifies the exact request bytes; this must stay before express.json().
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(rateLimit());
  // Defense-in-depth Origin/Referer check for state-changing requests. Runs
  // after CORS (which already restricts browser access) and after body
  // parsing so it can rely on Express's routing (`req.path`) consistently.
  app.use(originCheck());

  app.use('/api/health', healthRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/comms', commsRouter);
  // Payments checkout (and Stripe interactions generally) get a tighter
  // per-IP rate limit than the default API-wide one.
  app.use('/api/payments/checkout', rateLimit({ max: 30 }));
  app.use('/api/payments', paymentsRouter);
  // Admin endpoints are lower-traffic and higher-sensitivity — tighten the
  // rate limit beyond the default API-wide allowance.
  app.use('/api/admin', rateLimit({ max: 30 }));
  app.use('/api/admin', adminRouter);
  app.use('/api/jobs', jobsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
