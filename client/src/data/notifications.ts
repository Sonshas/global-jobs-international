export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
};

export {
  fetchNotificationsForUser as listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/repositories/notifications.repository';

export async function unreadCount(userId: string): Promise<number> {
  const { fetchNotificationsForUser } = await import('@/repositories/notifications.repository');
  const items = await fetchNotificationsForUser(userId);
  return items.filter((item) => !item.read).length;
}

export async function addNotification(input: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}): Promise<AppNotification> {
  const { dispatchNotification } = await import('@/lib/comms');
  await dispatchNotification({
    userId: input.userId,
    title: input.title,
    body: input.body,
    href: input.href,
    eventType: 'manual',
  });
  const { fetchNotificationsForUser } = await import('@/repositories/notifications.repository');
  const items = await fetchNotificationsForUser(input.userId);
  return (
    items[0] ?? {
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
      createdAt: new Date().toISOString(),
      read: false,
    }
  );
}
