import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/repositories/query-keys';
import {
  createInterview,
  listAllForStaff,
  listForApplicantUser,
  listForEmployer,
  updateInterviewStatus,
} from '@/repositories/interviews.repository';

export function useInterviewsForApplicant(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.interviews.forApplicant(userId ?? ''),
    queryFn: () => listForApplicantUser(userId!),
    enabled: Boolean(userId),
  });
}

export function useInterviewsForEmployer(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.interviews.forEmployer(userId ?? ''),
    queryFn: () => listForEmployer(userId!),
    enabled: Boolean(userId),
  });
}

export function useInterviewsAllForStaff(enabled = true) {
  return useQuery({
    queryKey: queryKeys.interviews.allStaff(),
    queryFn: () => listAllForStaff(),
    enabled,
  });
}

export function useCreateInterviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createInterview>[0]) => createInterview(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}

export function useUpdateInterviewStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      interviewId,
      status,
      extra,
    }: {
      interviewId: string;
      status: Parameters<typeof updateInterviewStatus>[1];
      extra?: Parameters<typeof updateInterviewStatus>[2];
    }) => updateInterviewStatus(interviewId, status, extra),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
  });
}
