import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCampaign,
  deleteCampaign,
  listActiveCampaigns,
  listAllCampaigns,
  updateCampaign,
} from '@/repositories/campaigns.repository';

const CAMPAIGNS_KEY = ['campaigns'] as const;

export function useAllCampaigns() {
  return useQuery({ queryKey: [...CAMPAIGNS_KEY, 'all'], queryFn: listAllCampaigns });
}

export function useActiveCampaigns() {
  return useQuery({ queryKey: [...CAMPAIGNS_KEY, 'active'], queryFn: listActiveCampaigns });
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createCampaign>[0]) => createCampaign(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}

export function useUpdateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof updateCampaign>[1] }) =>
      updateCampaign(id, patch),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}

export function useDeleteCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY }),
  });
}
