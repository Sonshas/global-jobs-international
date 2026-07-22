import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JobListing } from '@/data/jobs-catalog';
import type { AdminJob } from '@/data/admin-jobs';
import type { EmployerJob, EmployerJobStatus } from '@/data/employer';
import { queryKeys } from '@/repositories/query-keys';
import {
  archiveAdminJobRecord,
  createAdminJobRecord,
  createEmployerJobRecord,
  deleteJobRecord,
  duplicateAdminJobRecord,
  fetchAdminJobs,
  fetchEmployerJobsForUser,
  resolveJobFromAllSources,
  searchAllJobsAsync,
  setAdminJobStatusRecord,
  updateAdminJobRecord,
  updateEmployerJobRecord,
} from '@/repositories/jobs.repository';

export function useJobSearch(filters: {
  country?: string;
  title?: string;
  category?: string;
  experience?: string;
  salaryMin?: number;
  visaSponsorship?: boolean;
  accommodation?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.jobs.search(filters),
    queryFn: () => searchAllJobsAsync(filters),
  });
}

export function useResolvedJob(jobId: string | undefined, trackView = false) {
  return useQuery({
    queryKey: queryKeys.jobs.detail(jobId ?? ''),
    queryFn: () => resolveJobFromAllSources(jobId!, { trackView }),
    enabled: Boolean(jobId),
  });
}

export function useEmployerJobs(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.jobs.employer(userId ?? ''),
    queryFn: () => fetchEmployerJobsForUser(userId!),
    enabled: Boolean(userId),
  });
}

export function useAdminJobs() {
  return useQuery({
    queryKey: queryKeys.jobs.admin(),
    queryFn: () => fetchAdminJobs(),
  });
}

function invalidateJobs(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
}

export function useCreateEmployerJobMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createEmployerJobRecord>[1]) =>
      createEmployerJobRecord(userId!, input),
    onSuccess: () => invalidateJobs(queryClient),
  });
}

export function useUpdateEmployerJobMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      patch,
    }: {
      jobId: string;
      patch: Partial<EmployerJob>;
    }) => updateEmployerJobRecord(jobId, userId!, patch),
    onSuccess: () => invalidateJobs(queryClient),
  });
}

export function useCreateAdminJobMutation(adminUserId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createAdminJobRecord>[1]) =>
      createAdminJobRecord(adminUserId!, input),
    onSuccess: () => invalidateJobs(queryClient),
  });
}

export function useUpdateAdminJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AdminJob> }) =>
      updateAdminJobRecord(id, patch),
    onSuccess: () => invalidateJobs(queryClient),
  });
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => deleteJobRecord(jobId),
    onSuccess: () => invalidateJobs(queryClient),
  });
}

export function useAdminJobActions(adminUserId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => invalidateJobs(queryClient);

  return {
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: EmployerJobStatus }) =>
        setAdminJobStatusRecord(id, status),
      onSuccess: invalidate,
    }),
    archive: useMutation({
      mutationFn: ({ id, archived }: { id: string; archived?: boolean }) =>
        archiveAdminJobRecord(id, archived),
      onSuccess: invalidate,
    }),
    duplicate: useMutation({
      mutationFn: (id: string) => duplicateAdminJobRecord(id, adminUserId!),
      onSuccess: invalidate,
    }),
    remove: useDeleteJobMutation(),
  };
}

export type { JobListing };
