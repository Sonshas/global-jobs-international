import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmployerProfile, EmployerAccountStatus } from '@/data/employer';
import { queryKeys } from '@/repositories/query-keys';
import {
  fetchEmployerProfile,
  listEmployerProfiles,
  setEmployerAccountStatusRecord,
  upsertEmployerProfileRecord,
} from '@/repositories/employers.repository';

export function useEmployerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employers.profile(userId ?? ''),
    queryFn: () => fetchEmployerProfile(userId!),
    enabled: Boolean(userId),
  });
}

export function useEmployerProfilesList() {
  return useQuery({
    queryKey: ['employers', 'all-profiles'],
    queryFn: () => listEmployerProfiles(),
  });
}

export function useUpsertEmployerProfileMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Omit<EmployerProfile, 'userId' | 'createdAt'>>) =>
      upsertEmployerProfileRecord(userId!, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employers.profile(userId ?? '') });
    },
  });
}

export function useSetEmployerAccountStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: EmployerAccountStatus;
    }) => setEmployerAccountStatusRecord(userId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employers'] });
    },
  });
}
