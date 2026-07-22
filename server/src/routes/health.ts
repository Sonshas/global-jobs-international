import { Router } from 'express';
import { API_VERSION } from '@gji/shared';
import { env, hasResendKey, hasServiceRoleKey, hasStripeKey } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'global-jobs-international-api',
    apiVersion: API_VERSION,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    appEnv: env.APP_ENV,
    checks: {
      clientOriginConfigured: Boolean(env.CLIENT_ORIGIN),
      supabaseAnonConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY),
      serviceRoleConfigured: hasServiceRoleKey(),
      resendConfigured: hasResendKey(),
      stripeConfigured: hasStripeKey() && Boolean(env.STRIPE_WEBHOOK_SECRET),
      publicAppUrlConfigured: Boolean(env.PUBLIC_APP_URL),
    },
  });
});
