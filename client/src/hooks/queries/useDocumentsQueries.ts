import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApplicationDocumentKind } from '@/data/applications';
import type { ApplicantDocumentKind } from '@/data/recruitment-pipeline';
import { queryKeys } from '@/repositories/query-keys';
import {
  createSignedDocumentUrl,
  fetchApplicantDocuments,
  uploadApplicantDocument,
} from '@/repositories/documents.repository';

export function useApplicantDocuments(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.documents.forUser(userId ?? ''),
    queryFn: () => fetchApplicantDocuments(userId!),
    enabled: Boolean(userId),
  });
}

export function useUploadApplicantDocumentMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      kind: ApplicantDocumentKind | ApplicationDocumentKind;
      file: File;
      applicationId?: string;
    }) => {
      if (!userId) throw new Error('Not signed in.');
      return uploadApplicantDocument({ userId, ...input });
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.documents.forUser(userId) });
      }
    },
  });
}

export function useDocumentDownloadMutation() {
  return useMutation({
    mutationFn: (documentId: string) => createSignedDocumentUrl(documentId),
  });
}
