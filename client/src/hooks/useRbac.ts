import { useQuery } from '@tanstack/react-query';
import { fetchUserRbac, type ResolvedRbac } from '@/repositories/rbac.repository';
import { queryKeys } from '@/repositories/query-keys';

export function useRbac(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.rbac.roles(userId) : ['rbac', 'none'],
    queryFn: () => fetchUserRbac(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export function useRbacOrEmpty(userId: string | undefined): ResolvedRbac | null {
  const { data } = useRbac(userId);
  return data ?? null;
}
