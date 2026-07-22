import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/repositories/query-keys';
import {
  fetchNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/repositories/notifications.repository';

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.notifications.forUser(userId ?? ''),
    queryFn: () => fetchNotificationsForUser(userId!),
    enabled: Boolean(userId),
    refetchInterval: 15_000,
  });
}

export function useMarkNotificationReadMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.forUser(userId) });
      }
    },
  });
}

export function useMarkAllNotificationsReadMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Not signed in');
      return markAllNotificationsRead(userId);
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.forUser(userId) });
      }
    },
  });
}
