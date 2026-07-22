import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JobApplication, ApplicationStage, StageStatus } from '@/data/applications';
import { queryKeys } from '@/repositories/query-keys';
import {
  createApplicationRecord,
  fetchAllApplications,
  fetchApplicationById,
  fetchApplicationsForUser,
  fetchApplicationCountForListing,
  setApplicationStageRecord,
  updateApplicationRecord,
  deleteApplicationRecord,
} from '@/repositories/applications.repository';

export function useApplicationCountForJob(listingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.forJob(listingId ?? 'unknown'),
    queryFn: () => fetchApplicationCountForListing(listingId),
    enabled: Boolean(listingId),
  });
}

export function useApplicationsList(enabled = true) {
  return useQuery({
    queryKey: queryKeys.applications.list(),
    queryFn: () => fetchAllApplications(),
    enabled,
  });
}

export function useApplicationsForUser(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.forUser(userId ?? ''),
    queryFn: () => fetchApplicationsForUser(userId!),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });
}

export function useApplication(applicationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.applications.detail(applicationId ?? ''),
    queryFn: () => fetchApplicationById(applicationId!),
    enabled: Boolean(applicationId),
    refetchInterval: 30_000,
  });
}

function invalidateApplications(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.applications.all });
  void queryClient.invalidateQueries({ queryKey: ['notifications'] });
}

export function useCreateApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplicationRecord,
    onSuccess: () => invalidateApplications(queryClient),
  });
}

export function useUpdateApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<
        Pick<JobApplication, 'status' | 'currentStage' | 'stageStatuses' | 'recruiterNote' | 'cvPaid'>
      >;
    }) => updateApplicationRecord(id, patch),
    onSuccess: () => invalidateApplications(queryClient),
  });
}

export function useSetApplicationStageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      stage,
      status,
    }: {
      id: string;
      stage: ApplicationStage;
      status: StageStatus;
    }) => setApplicationStageRecord(id, stage, status),
    onSuccess: () => invalidateApplications(queryClient),
  });
}

export function useDeleteApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteApplicationRecord(id),
    onSuccess: () => invalidateApplications(queryClient),
  });
}
