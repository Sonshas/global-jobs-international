import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/repositories/query-keys';
import { getUserSetting, upsertUserSetting } from '@/repositories/settings.repository';

export function useUserSetting<T = unknown>(userId: string | undefined, key: string) {
  return useQuery({
    queryKey: queryKeys.settings.forUser(userId ?? '', key),
    queryFn: () => getUserSetting<T>(userId!, key),
    enabled: Boolean(userId),
  });
}

export function useUpsertUserSettingMutation(userId: string | undefined, key: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value: unknown) => upsertUserSetting(userId!, key, value as never),
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.settings.forUser(userId, key) });
      }
    },
  });
}
