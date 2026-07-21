import { Router } from 'express';
import { API_VERSION } from '@gji/shared';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'global-jobs-international-api',
    apiVersion: API_VERSION,
    timestamp: new Date().toISOString(),
  });
});
