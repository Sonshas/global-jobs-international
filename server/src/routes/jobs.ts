import { Router } from 'express';
import type { Response } from 'express';
import { env } from '../config/env.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { getSupabaseUserClient, tryGetSupabaseAdmin } from '../lib/supabase.js';
import { deliverEmail } from '../email/deliver.js';
import { renderLifecycleEmail } from '../email/templates.js';

export const jobsRouter = Router();

type ApplicationMetadataShape = {
  applicationNumber?: string;
  userId?: string;
  profile?: { email?: string; fullName?: string };
};

/**
 * Authorizes either a trusted cron caller (`x-cron-secret` header matching
 * CRON_SECRET) or an authenticated admin/super_admin. When CRON_SECRET is not
 * configured and APP_ENV=development, the endpoint is reachable without a
 * secret so it can be exercised locally.
 *
 * Cron setup (production): schedule a daily/hourly HTTP call, e.g. with a
 * hosting provider's scheduled job or an external cron service:
 *   curl -X POST https://<api-host>/api/jobs/interview-reminders \
 *     -H "x-cron-secret: $CRON_SECRET"
 */
jobsRouter.post('/interview-reminders', async (req: AuthenticatedRequest, res, next) => {
  const provided = req.headers['x-cron-secret'];
  if (env.CRON_SECRET && provided === env.CRON_SECRET) {
    return runInterviewReminders(req, res);
  }
  // Cron-less local/production smoke: authenticated admin JWT is enough when
  // service role is unset; prefer service role when present for unattended cron.
  if (env.APP_ENV === 'development' && tryGetSupabaseAdmin() && !req.headers.authorization) {
    return runInterviewReminders(req, res);
  }

  return requireAuth(req, res, (err?: unknown) => {
    if (err) return next(err);
    return requireAdmin(req, res, () => runInterviewReminders(req, res));
  });
});

async function runInterviewReminders(req: AuthenticatedRequest, res: Response) {
  const service = tryGetSupabaseAdmin();
  const db = service ?? (req.authToken ? getSupabaseUserClient(req.authToken) : null);

  if (!db) {
    return res.status(503).json({
      error:
        'Interview reminders require SUPABASE_SERVICE_ROLE_KEY (cron) or an authenticated admin bearer token.',
    });
  }

  try {
    const nowIso = new Date().toISOString();
    const untilIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: interviews, error: interviewsError } = await db
      .from('interviews')
      .select('id, application_id, meeting_url, scheduled_start_at, metadata')
      .eq('status', 'scheduled')
      .gte('scheduled_start_at', nowIso)
      .lte('scheduled_start_at', untilIso);
    if (interviewsError) throw interviewsError;

    const due = (interviews ?? []).filter((row) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      return !metadata.reminder_sent_at;
    });

    let remindersSent = 0;
    let emailsSent = 0;
    let emailsSkippedByPreference = 0;

    for (const interview of due) {
      const { data: application } = await db
        .from('applications')
        .select('metadata')
        .eq('id', interview.application_id)
        .maybeSingle();
      const meta = (application?.metadata ?? {}) as ApplicationMetadataShape;
      const userId = meta.userId;
      const email = meta.profile?.email;
      const applicationNumber = meta.applicationNumber ?? interview.application_id;
      const when = new Date(interview.scheduled_start_at as string).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

      let notifyEmail = true;
      if (userId) {
        const { data: setting } = await db
          .from('settings')
          .select('value')
          .eq('user_id', userId)
          .eq('key', 'notify_email')
          .maybeSingle();
        if (setting?.value === false) notifyEmail = false;
      }

      if (userId) {
        await db.from('notifications').insert({
          user_id: userId,
          title: 'Interview reminder',
          body: `Your interview for ${applicationNumber} is scheduled for ${when}.`,
          channel: 'in_app',
          event_type: 'interview_reminder',
          entity_type: 'interview',
          entity_id: interview.id,
          link_url: `/dashboard/calendar`,
        });
      }

      if (email && notifyEmail) {
        const rendered = renderLifecycleEmail('interview_reminder', {
          applicationNumber,
          when,
          meetingUrl: interview.meeting_url ?? undefined,
        });
        try {
          await deliverEmail({ to: email, rendered });
          emailsSent += 1;
        } catch (emailError) {
          console.warn('[jobs] interview reminder email failed:', emailError);
        }
      } else if (email && !notifyEmail) {
        emailsSkippedByPreference += 1;
      }

      await db
        .from('interviews')
        .update({
          metadata: {
            ...((interview.metadata as Record<string, unknown>) ?? {}),
            reminder_sent_at: nowIso,
          },
        })
        .eq('id', interview.id);

      remindersSent += 1;
    }

    return res.json({
      checked: interviews?.length ?? 0,
      remindersSent,
      emailsSent,
      emailsSkippedByPreference,
      via: service ? 'service_role' : 'admin_jwt',
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to run interview reminders.' });
  }
}
