import cors from 'cors';
import { randomUUID } from 'node:crypto';
import express, { type Router } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { clientOrigins, env } from './config/env.js';
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

/**
 * Mount API routers on a parent path. Attached at both `/api` and `/` so a
 * misconfigured Nginx `proxy_pass .../` (which strips `/api`) still works.
 */
function mountApiRoutes(router: Router) {
  router.use('/health', healthRouter);
  router.use('/audit', auditRouter);
  router.use('/comms', commsRouter);
  router.use('/payments/checkout', rateLimit({ max: 30 }));
  router.use('/payments', paymentsRouter);
  router.use('/admin', rateLimit({ max: 30 }));
  router.use('/admin', adminRouter);
  router.use('/jobs', jobsRouter);
}

export function createApp() {
  const app = express();
  const allowedOrigins = new Set(clientOrigins());

  app.use(
    helmet({
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
      origin(origin, callback) {
        // Non-browser clients (curl, Stripe webhooks, cron) send no Origin.
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.has(origin)) {
          callback(null, origin);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    }),
  );
  // Stripe verifies the exact request bytes; this must stay before express.json().
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
  app.use('/payments/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(rateLimit());
  app.use(originCheck());

  mountApiRoutes(app);
  const api = express.Router();
  mountApiRoutes(api);
  app.use('/api', api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
