import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/repositories/query-keys';
import { fetchPlatformPublicStats, fetchVerifiedEmployers } from '@/repositories/public-stats.repository';

/** Live, DB-backed platform stats for the public homepage (no sample inflation). */
export function usePlatformPublicStats() {
  return useQuery({
    queryKey: queryKeys.publicStats.platform,
    queryFn: () => fetchPlatformPublicStats(),
    staleTime: 5 * 60 * 1000,
  });
}

/** Live verified employers for the public "Verified Employers" section. */
export function useVerifiedEmployers() {
  return useQuery({
    queryKey: queryKeys.publicStats.verifiedEmployers,
    queryFn: () => fetchVerifiedEmployers(),
    staleTime: 5 * 60 * 1000,
  });
}
