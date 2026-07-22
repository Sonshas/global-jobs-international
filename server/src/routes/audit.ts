import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getSupabaseUserClient, tryGetSupabaseAdmin } from '../lib/supabase.js';

const auditRouter = Router();

const auditEntrySchema = z.object({
  action: z.string().min(1).max(120),
  detail: z.string().max(2000).optional(),
});

/** GET /api/audit?limit=100 — admin-only activity log listing (server-backed). */
auditRouter.get('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
  try {
    const client = getSupabaseUserClient(req.authToken!);
    const { data, error } = await client
      .from('activity_logs')
      .select('id, actor_user_id, action, entity_type, entity_id, description, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return res.json({ entries: data ?? [] });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load audit log.' });
  }
});

const ACTION_MAP: Record<string, 'create' | 'update' | 'delete' | 'login' | 'logout' | 'status_change' | 'upload' | 'payment' | 'message' | 'other'> = {
  employer_status: 'status_change',
  job_status: 'status_change',
  payment: 'payment',
  upload: 'upload',
  login: 'login',
  logout: 'logout',
};

auditRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = auditEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid audit payload', details: parsed.error.flatten() });
  }

  const entry = parsed.data;
  const detail = entry.detail;
  const actorUserId = req.authUserId!;
  const mappedAction = ACTION_MAP[entry.action] ?? 'other';

  console.info('[audit]', {
    at: new Date().toISOString(),
    action: entry.action,
    detail,
    actorUserId,
  });

  let activityId: string | null = null;

  try {
    const userClient = getSupabaseUserClient(req.authToken!);
    const { data, error } = await userClient.rpc('write_activity_log', {
      p_action: mappedAction,
      p_entity_type: 'audit',
      p_entity_id: null,
      p_description: detail ?? entry.action,
      p_metadata: { action: entry.action, detail },
    });
    if (!error && data) activityId = data as string;
  } catch (error) {
    console.warn('[audit] write_activity_log skipped:', error);
  }

  if (!activityId) {
    const admin = tryGetSupabaseAdmin();
    if (admin) {
      try {
        const { data } = await admin
          .from('activity_logs')
          .insert({
            actor_user_id: actorUserId,
            action: mappedAction,
            entity_type: 'audit',
            entity_id: null,
            description: detail ?? entry.action,
            metadata: { action: entry.action, detail },
          })
          .select('id')
          .maybeSingle();
        activityId = data?.id ?? null;
      } catch (error) {
        console.warn('[audit] activity_logs insert skipped:', error);
      }
    }
  }

  return res.status(202).json({ ok: true, id: activityId });
});

export { auditRouter };
