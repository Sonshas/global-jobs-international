import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';
import { getSupabaseUserClient, tryGetSupabaseAdmin } from '../lib/supabase.js';
import { deliverEmail } from '../email/deliver.js';
import { renderLifecycleEmail, type LifecycleEmailTemplateId } from '../email/templates.js';

const notifySchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  href: z.string().max(500).optional(),
  eventType: z.string().max(80).optional(),
  entityId: z.string().uuid().optional(),
});

const emailSchema = z.object({
  to: z.string().email(),
  userId: z.string().uuid().optional(),
  template: z.string().min(1),
  variables: z.record(z.string(), z.string()).optional(),
});

/** Returns false only when the recipient explicitly disabled email notifications. */
async function shouldSendEmail(accessToken: string, userId: string | undefined): Promise<boolean> {
  if (!userId) return true;
  try {
    const admin = tryGetSupabaseAdmin() ?? getSupabaseUserClient(accessToken);
    const { data } = await admin
      .from('settings')
      .select('value')
      .eq('user_id', userId)
      .eq('key', 'notify_email')
      .maybeSingle();
    return data?.value !== false;
  } catch {
    return true;
  }
}

async function callerIsPrivileged(accessToken: string, userId: string): Promise<boolean> {
  const client = getSupabaseUserClient(accessToken);
  const { data: roles, error: rolesError } = await client
    .from('user_roles')
    .select('roles(slug)')
    .eq('user_id', userId)
    .eq('is_active', true);
  if (rolesError) throw rolesError;
  const slugs = (roles ?? []).flatMap((row) => {
    const role = (row as { roles: { slug: string } | { slug: string }[] | null }).roles;
    if (!role) return [];
    return Array.isArray(role) ? role.map((r) => r.slug) : [role.slug];
  });
  if (slugs.some((slug) => ['admin', 'super_admin', 'advisor'].includes(slug))) return true;

  const { data: adminRow, error: adminError } = await client
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  if (adminError) throw adminError;
  if (adminRow?.id) return true;

  const { data: employer, error: employerError } = await client
    .from('employers')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();
  if (employerError) throw employerError;
  return Boolean(employer?.id);
}

export const commsRouter = Router();

commsRouter.post('/notify', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = notifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const callerId = req.authUserId!;
    const client = getSupabaseUserClient(req.authToken!);
    const privileged = await callerIsPrivileged(req.authToken!, callerId);
    if (!privileged && parsed.data.userId !== callerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let { data, error } = await client
      .from('notifications')
      .insert({
        user_id: parsed.data.userId,
        title: parsed.data.title,
        body: parsed.data.body,
        link_url: parsed.data.href ?? null,
        channel: 'in_app',
        event_type: parsed.data.eventType ?? 'application_update',
        entity_type: 'application',
        entity_id: parsed.data.entityId ?? null,
      })
      .select('id')
      .single();
    if (error) {
      const admin = tryGetSupabaseAdmin();
      if (admin) {
        ({ data, error } = await admin
          .from('notifications')
          .insert({
            user_id: parsed.data.userId,
            title: parsed.data.title,
            body: parsed.data.body,
            link_url: parsed.data.href ?? null,
            channel: 'in_app',
            event_type: parsed.data.eventType ?? 'application_update',
            entity_type: 'application',
            entity_id: parsed.data.entityId ?? null,
          })
          .select('id')
          .single());
      }
    }
    if (error) throw error;
    if (!data?.id) throw new Error('Notification insert did not return an id');
    return res.status(201).json({ id: data.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create notification';
    return res.status(500).json({ error: message });
  }
});

commsRouter.post('/email', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const callerId = req.authUserId!;
    const privileged = await callerIsPrivileged(req.authToken!, callerId);
    if (!privileged && parsed.data.to.toLowerCase() !== req.authEmail?.toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowed = await shouldSendEmail(req.authToken!, parsed.data.userId);
    if (!allowed) {
      console.info('[email] skipped — recipient disabled notify_email', parsed.data.userId);
      return res.status(200).json({ delivered: false, provider: 'skipped', detail: 'notify_email disabled' });
    }

    const rendered = renderLifecycleEmail(
      parsed.data.template as LifecycleEmailTemplateId,
      parsed.data.variables ?? {},
    );
    const result = await deliverEmail({ to: parsed.data.to, rendered });
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    return res.status(500).json({ error: message });
  }
});
