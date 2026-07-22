import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/repositories/query-keys';
import { isJobSaved, listSavedJobs, toggleSavedJob } from '@/repositories/saved-jobs.repository';

export function useSavedJobs(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.savedJobs.forUser(userId ?? ''),
    queryFn: () => listSavedJobs(userId!),
    enabled: Boolean(userId),
  });
}

export function useIsJobSaved(userId: string | undefined, jobId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.savedJobs.isSaved(userId ?? '', jobId ?? ''),
    queryFn: () => isJobSaved(userId!, jobId!),
    enabled: Boolean(userId && jobId),
  });
}

export function useToggleSavedJobMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => toggleSavedJob(userId!, jobId),
    onSuccess: () => {
      if (!userId) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.savedJobs.forUser(userId) });
      void queryClient.invalidateQueries({ queryKey: ['savedJobs', 'isSaved', userId] });
    },
  });
}
