import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/repositories/query-keys';
import {
  countUnreadMessages,
  getOrCreateConversationForApplication,
  getOrCreateSupportConversation,
  listConversationsForUser,
  listMessages,
  listSupportConversations,
  markConversationRead,
  resolveApplicationParticipants,
  sendMessage,
} from '@/repositories/messaging.repository';

export function useApplicationParticipants(applicationId: string | undefined) {
  return useQuery({
    queryKey: ['messaging', 'participants', applicationId ?? ''],
    queryFn: () => resolveApplicationParticipants(applicationId!),
    enabled: Boolean(applicationId),
  });
}

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversations.forUser(userId ?? ''),
    queryFn: () => listConversationsForUser(userId!),
    enabled: Boolean(userId),
    refetchInterval: 20_000,
  });
}

export function useUnreadMessageCount(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.conversations.unreadCount(userId ?? ''),
    queryFn: () => countUnreadMessages(userId!),
    enabled: Boolean(userId),
    refetchInterval: 20_000,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages.forConversation(conversationId ?? ''),
    queryFn: () => listMessages(conversationId!),
    enabled: Boolean(conversationId),
  });
}

/** Subscribes to Postgres changes for a conversation's messages while it is open. */
export function useMessagesRealtime(conversationId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.messages.forConversation(conversationId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.forUser(userId ?? '') });
          if (userId) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.unreadCount(userId) });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, userId, queryClient]);
}

export function useGetOrCreateConversationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof getOrCreateConversationForApplication>[0]) =>
      getOrCreateConversationForApplication(input),
    onSuccess: (conversation) => {
      if (conversation.applicantUserId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.forUser(conversation.applicantUserId),
        });
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.forUser(conversation.employerUserId),
      });
    },
  });
}

/** Admin/staff support inbox — all support threads (RLS restricts to staff/admin). */
export function useSupportConversations(enabled = true) {
  return useQuery({
    queryKey: ['messaging', 'support-conversations'],
    queryFn: () => listSupportConversations(),
    enabled,
    refetchInterval: 20_000,
  });
}

export function useGetOrCreateSupportConversationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof getOrCreateSupportConversation>[0]) =>
      getOrCreateSupportConversation(input),
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.forUser(conversation.employerUserId),
      });
    },
  });
}

export function useSendMessageMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      body,
      attachmentDocumentId,
    }: {
      conversationId: string;
      body: string;
      attachmentDocumentId?: string | null;
    }) => sendMessage(conversationId, userId!, body, attachmentDocumentId),
    onSuccess: (_message, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages.forConversation(variables.conversationId),
      });
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.forUser(userId) });
      }
    },
  });
}

export function useMarkConversationReadMutation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId, userId!),
    onSuccess: (_result, conversationId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.forConversation(conversationId) });
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.unreadCount(userId) });
      }
    },
  });
}
