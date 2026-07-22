import { supabase } from '@/lib/supabase';
import type { DbConversationRow, DbMessageRow } from '@/lib/database.types';
import { insertNotification } from '@/repositories/notifications.repository';

export type Conversation = {
  id: string;
  subject: string | null;
  jobId: string | null;
  applicationId: string | null;
  applicantUserId: string | null;
  employerUserId: string;
  employerId: string | null;
  kind: 'application' | 'support';
  staffUserId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  applicantName?: string;
  employerName?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  attachmentDocumentId: string | null;
  isRead: boolean;
  createdAt: string;
};

function rowToConversation(row: DbConversationRow): Conversation {
  return {
    id: row.id,
    subject: row.subject,
    jobId: row.job_id,
    applicationId: row.application_id,
    applicantUserId: row.applicant_user_id,
    employerUserId: row.employer_user_id,
    employerId: row.employer_id,
    kind: row.kind,
    staffUserId: row.staff_user_id,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMessage(row: DbMessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderUserId: row.sender_user_id,
    body: row.body,
    attachmentDocumentId: row.attachment_document_id,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

/**
 * Best-effort participant labels. RLS on public.users only exposes the caller's own
 * row, so we additionally resolve employer legal names (publicly readable when
 * verified) and fall back to generic role labels otherwise.
 */
async function attachParticipantNames(conversations: Conversation[]): Promise<Conversation[]> {
  if (!conversations.length) return conversations;
  const userIds = [
    ...new Set(
      conversations.flatMap((c) => [c.applicantUserId, c.employerUserId, c.staffUserId]).filter(
        (id): id is string => Boolean(id),
      ),
    ),
  ];
  const employerIds = [
    ...new Set(conversations.map((c) => c.employerId).filter((id): id is string => Boolean(id))),
  ];

  const [{ data: userRows }, { data: employerRows }] = await Promise.all([
    supabase.from('users').select('id, full_name').in('id', userIds),
    employerIds.length
      ? supabase.from('employers').select('id, legal_name').in('id', employerIds)
      : Promise.resolve({ data: [] as { id: string; legal_name: string }[] }),
  ]);

  const nameById = new Map((userRows ?? []).map((row) => [row.id as string, row.full_name as string]));
  const employerNameById = new Map(
    (employerRows ?? []).map((row) => [row.id as string, row.legal_name as string]),
  );

  return conversations.map((conversation) => ({
    ...conversation,
    applicantName:
      conversation.kind === 'support'
        ? 'Support'
        : (conversation.applicantUserId ? nameById.get(conversation.applicantUserId) : undefined) ?? 'Applicant',
    employerName:
      nameById.get(conversation.employerUserId) ??
      (conversation.employerId ? employerNameById.get(conversation.employerId) : undefined) ??
      'Employer',
  }));
}

export async function listConversationsForUser(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`applicant_user_id.eq.${userId},employer_user_id.eq.${userId},staff_user_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  const conversations = ((data ?? []) as DbConversationRow[]).map(rowToConversation);
  return attachParticipantNames(conversations);
}

/** Admin/staff support inbox — all `kind = 'support'` threads (RLS restricts to staff/admin). */
export async function listSupportConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('kind', 'support')
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  const conversations = ((data ?? []) as DbConversationRow[]).map(rowToConversation);
  return attachParticipantNames(conversations);
}

/**
 * Returns the employer's single open support thread, creating it if needed.
 * `staffUserId` is optional — the thread is unassigned until a staff member
 * opens it (support inbox may claim it later by updating `staff_user_id`).
 */
export async function getOrCreateSupportConversation(input: {
  employerUserId: string;
  staffUserId?: string;
}): Promise<Conversation> {
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('kind', 'support')
    .eq('employer_user_id', input.employerUserId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return rowToConversation(existing as DbConversationRow);

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      kind: 'support',
      employer_user_id: input.employerUserId,
      staff_user_id: input.staffUserId ?? null,
      subject: 'Support',
    })
    .select('*')
    .single();

  if (error) throw error;
  return rowToConversation(data as DbConversationRow);
}

/** Staff claims an unassigned support thread so replies are attributed to them. */
export async function claimSupportConversation(conversationId: string, staffUserId: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .update({ staff_user_id: staffUserId })
    .eq('id', conversationId)
    .eq('kind', 'support')
    .select('*')
    .single();
  if (error) throw error;
  return rowToConversation(data as DbConversationRow);
}

export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToConversation(data as DbConversationRow) : null;
}

export type ApplicationParticipants = {
  applicationId: string;
  applicantUserId: string;
  employerUserId: string;
  employerId: string | null;
  jobId: string;
};

/** Resolves the applicant/employer user ids behind an application for messaging. */
export async function resolveApplicationParticipants(
  applicationId: string,
): Promise<ApplicationParticipants | null> {
  const { data: application, error } = await supabase
    .from('applications')
    .select('id, job_id, applicant_id, metadata')
    .eq('id', applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!application) return null;

  // Prefer metadata (readable by both applicant and employer via applications RLS);
  // the applicants table itself is only readable by its owner, admins, and staff.
  const metaUserId =
    application.metadata && typeof application.metadata === 'object'
      ? ((application.metadata as Record<string, unknown>).userId as string | undefined)
      : undefined;

  const [{ data: applicant }, { data: job }] = await Promise.all([
    metaUserId
      ? Promise.resolve({ data: { user_id: metaUserId } })
      : supabase.from('applicants').select('user_id').eq('id', application.applicant_id).maybeSingle(),
    supabase.from('jobs').select('employer_id').eq('id', application.job_id).maybeSingle(),
  ]);

  if (!applicant?.user_id || !job?.employer_id) return null;

  const { data: employer } = await supabase
    .from('employers')
    .select('id, owner_user_id')
    .eq('id', job.employer_id)
    .maybeSingle();
  if (!employer?.owner_user_id) return null;

  return {
    applicationId: application.id,
    applicantUserId: applicant.user_id as string,
    employerUserId: employer.owner_user_id as string,
    employerId: employer.id as string,
    jobId: application.job_id as string,
  };
}

export async function getOrCreateConversationForApplication(input: {
  applicationId: string;
  applicantUserId: string;
  employerUserId: string;
  employerId?: string | null;
  jobId?: string | null;
  subject?: string;
}): Promise<Conversation> {
  const { data: existing, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('application_id', input.applicationId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return rowToConversation(existing as DbConversationRow);

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      application_id: input.applicationId,
      applicant_user_id: input.applicantUserId,
      employer_user_id: input.employerUserId,
      employer_id: input.employerId ?? null,
      job_id: input.jobId ?? null,
      subject: input.subject ?? 'Application discussion',
    })
    .select('*')
    .single();

  if (error) throw error;
  return rowToConversation(data as DbConversationRow);
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as DbMessageRow[]).map(rowToMessage);
}

/** Latest messages for an application conversation (staff/participant readable). */
export async function listMessagesForApplication(applicationId: string): Promise<Message[]> {
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (error) throw error;
  if (!conversation?.id) return [];
  return listMessages(conversation.id as string);
}

export async function sendMessage(
  conversationId: string,
  senderUserId: string,
  body: string,
  attachmentDocumentId?: string | null,
): Promise<Message> {
  const trimmed = body.trim();
  if (!trimmed && !attachmentDocumentId) throw new Error('Message body cannot be empty.');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_user_id: senderUserId,
      body: trimmed || 'Sent an attachment',
      attachment_document_id: attachmentDocumentId ?? null,
    })
    .select('*')
    .single();

  if (error) throw error;
  const message = rowToMessage(data as DbMessageRow);

  const conversation = await getConversationById(conversationId);
  if (conversation) {
    const recipientId =
      conversation.kind === 'support'
        ? senderUserId === conversation.employerUserId
          ? conversation.staffUserId
          : conversation.employerUserId
        : conversation.applicantUserId === senderUserId
          ? conversation.employerUserId
          : conversation.applicantUserId;
    if (recipientId && recipientId !== senderUserId) {
      try {
        await insertNotification({
          userId: recipientId,
          title: 'New message',
          body: trimmed.slice(0, 140),
          href: `/dashboard/messages?conversationId=${conversationId}`,
          eventType: 'message_received',
          entityType: 'conversation',
          entityId: conversationId,
        });
      } catch {
        // Notification is best-effort; message send should not fail because of it.
      }
    }
  }

  return message;
}

export async function markConversationRead(conversationId: string, readerUserId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_user_id', readerUserId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function countUnreadMessages(userId: string): Promise<number> {
  const conversations = await listConversationsForUser(userId);
  if (!conversations.length) return 0;

  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', conversations.map((c) => c.id))
    .eq('is_read', false)
    .neq('sender_user_id', userId);

  if (error) throw error;
  return count ?? 0;
}
