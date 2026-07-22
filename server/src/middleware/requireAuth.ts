import type { NextFunction, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export type AuthenticatedRequest = Request & {
  authUserId?: string;
  authEmail?: string;
  authToken?: string;
};

/**
 * Verifies a Supabase JWT from Authorization: Bearer <token>.
 * In production/staging, missing Supabase config fails closed.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    if (env.NODE_ENV === 'production' || env.APP_ENV === 'staging' || env.APP_ENV === 'production') {
      return res.status(503).json({ error: 'Auth provider not configured' });
    }
    return res.status(503).json({ error: 'Supabase not configured on server' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Invalid bearer token' });
  }

  try {
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.authUserId = data.user.id;
    req.authEmail = data.user.email;
    req.authToken = token;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
