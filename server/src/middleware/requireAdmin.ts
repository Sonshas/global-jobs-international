import type { NextFunction, Response } from 'express';
import { getSupabaseUserClient } from '../lib/supabase.js';
import type { AuthenticatedRequest } from './requireAuth.js';

/**
 * Must run after requireAuth. Confirms the caller is admin/super_admin via the
 * DB-backed `is_admin()` helper (never trusts JWT metadata alone).
 */
export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const client = getSupabaseUserClient(req.authToken!);
    const { data, error } = await client.rpc('is_admin');
    if (error || data !== true) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
  } catch {
    return res.status(403).json({ error: 'Admin access required' });
  }
}

/** Must run after requireAuth. Allows staff (advisor/admin/super_admin). */
export async function requireStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const client = getSupabaseUserClient(req.authToken!);
    const { data, error } = await client.rpc('is_staff');
    if (error || data !== true) {
      return res.status(403).json({ error: 'Staff access required' });
    }
    return next();
  } catch {
    return res.status(403).json({ error: 'Staff access required' });
  }
}
