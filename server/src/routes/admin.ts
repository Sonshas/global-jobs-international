import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getSupabaseUserClient, tryGetSupabaseAdmin } from '../lib/supabase.js';

export const adminRouter = Router();

const roleSchema = z.object({
  roleSlug: z.enum(['super_admin', 'admin', 'employer', 'applicant', 'advisor']),
});

/**
 * POST /api/admin/users/:userId/role — assigns a platform role.
 * Prefer service-role `assign_user_role` when configured. Without a service-role
 * key, fall back to authenticated admin JWT inserts into `user_roles` /
 * `admin_users` (RLS already permits `is_admin()`).
 */
adminRouter.post('/users/:userId/role', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const targetUserId = req.params.userId;
  const roleSlug = parsed.data.roleSlug;
  const assignedBy = req.authUserId;

  try {
    const service = tryGetSupabaseAdmin();
    if (service) {
      const { data, error } = await service.rpc('assign_user_role', {
        p_user_id: targetUserId,
        p_role_slug: roleSlug,
        p_assigned_by: assignedBy,
      });
      if (error) throw error;
      return res.json({ ok: true, userRoleId: data, via: 'service_role' });
    }

    if (!req.authToken) {
      return res.status(401).json({ error: 'Missing access token.' });
    }

    const userClient = getSupabaseUserClient(req.authToken);
    const { data: roleRow, error: roleError } = await userClient
      .from('roles')
      .select('id')
      .eq('slug', roleSlug)
      .maybeSingle();
    if (roleError) throw roleError;
    if (!roleRow?.id) {
      return res.status(400).json({ error: `Unknown role slug: ${roleSlug}` });
    }

    const { data: userRole, error: insertError } = await userClient
      .from('user_roles')
      .upsert(
        {
          user_id: targetUserId,
          role_id: roleRow.id,
          assigned_by: assignedBy,
          is_active: true,
        },
        { onConflict: 'user_id,role_id' },
      )
      .select('id')
      .single();
    if (insertError) throw insertError;

    if (roleSlug === 'admin' || roleSlug === 'super_admin') {
      const { error: adminUpsertError } = await userClient.from('admin_users').upsert(
        {
          user_id: targetUserId,
          title: roleSlug === 'super_admin' ? 'Super Admin' : 'Admin',
          is_active: true,
          created_by: assignedBy,
        },
        { onConflict: 'user_id' },
      );
      if (adminUpsertError) throw adminUpsertError;
    }

    if (roleSlug === 'employer') {
      await userClient
        .from('users')
        .update({ account_type: 'employer' })
        .eq('id', targetUserId);
    }

    return res.json({ ok: true, userRoleId: userRole.id, via: 'admin_jwt' });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to assign role.' });
  }
});
