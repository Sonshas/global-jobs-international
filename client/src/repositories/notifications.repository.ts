import { supabase } from '@/lib/supabase';
import type { AppNotification } from '@/data/notifications';

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
  event_type: string;
};

function rowToAppNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    href: row.link_url ?? undefined,
    read: row.is_read,
    createdAt: row.created_at,
  };
}

export async function fetchNotificationsForUser(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, link_url, is_read, created_at, event_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as NotificationRow[]).map(rowToAppNotification);
}

export async function insertNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
}): Promise<AppNotification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.userId,
      title: input.title,
      body: input.body,
      link_url: input.href ?? null,
      channel: 'in_app',
      event_type: input.eventType ?? 'application_update',
      entity_type: input.entityType ?? 'application',
      entity_id: input.entityId ?? null,
    })
    .select('id, user_id, title, body, link_url, is_read, created_at, event_type')
    .single();
  if (error) throw error;
  return rowToAppNotification(data as NotificationRow);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}
