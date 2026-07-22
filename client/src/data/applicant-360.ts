import type { JobApplication } from '@/data/applications';
import { fetchAllApplications } from '@/repositories/applications.repository';
import {
  ensureApplicationTimeline,
  visaProgressPercent,
} from '@/data/recruitment-pipeline';
import type { DocumentRecord } from '@/data/recruitment-pipeline';
import { listMessagesForApplication } from '@/repositories/messaging.repository';
import { supabase } from '@/lib/supabase';

export type ApplicantNote = {
  id: string;
  applicationId: string;
  body: string;
  createdAt: string;
  author: string;
};

export type Applicant360Message = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type Applicant360Payment = {
  label: string;
  amount: string;
  status: string;
};

export type Applicant360 = {
  application: JobApplication;
  documents: DocumentRecord[];
  timeline: ReturnType<typeof ensureApplicationTimeline>;
  visa: JobApplication['visaTracker'];
  visaPercent: number;
  messages: Applicant360Message[];
  payments: Applicant360Payment[];
  notes: ApplicantNote[];
};

type StaffNoteRow = {
  id: string;
  application_id: string;
  author_user_id: string | null;
  body: string;
  created_at: string;
};

/** Staff/admin-only notes, backed by `public.staff_notes` (RLS enforced). */
export async function listApplicantNotes(applicationId: string): Promise<ApplicantNote[]> {
  const { data, error } = await supabase
    .from('staff_notes')
    .select('id, application_id, author_user_id, body, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });
  if (error) return [];

  const rows = (data ?? []) as StaffNoteRow[];
  const authorIds = [...new Set(rows.map((row) => row.author_user_id).filter((id): id is string => Boolean(id)))];
  const authorNameById = new Map<string, string>();
  if (authorIds.length) {
    const { data: authors } = await supabase.from('users').select('id, full_name').in('id', authorIds);
    for (const row of authors ?? []) {
      authorNameById.set(row.id as string, (row.full_name as string) || 'Staff');
    }
  }

  return rows.map((row) => ({
    id: row.id,
    applicationId: row.application_id,
    body: row.body,
    createdAt: row.created_at,
    author: row.author_user_id ? authorNameById.get(row.author_user_id) ?? 'Staff' : 'Staff',
  }));
}

export async function addApplicantNote(
  applicationId: string,
  body: string,
  authorUserId?: string,
): Promise<ApplicantNote[]> {
  const trimmed = body.trim();
  if (trimmed) {
    const { error } = await supabase.from('staff_notes').insert({
      application_id: applicationId,
      author_user_id: authorUserId ?? null,
      body: trimmed,
    });
    if (error) throw error;
  }
  return listApplicantNotes(applicationId);
}

/** Real payment rows for the applicant behind this application (from `public.payments`). */
async function loadApplicantPayments(application: JobApplication): Promise<Applicant360Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('status, amount, currency, metadata, created_at')
    .eq('user_id', application.userId)
    .order('created_at', { ascending: false });
  if (error || !data?.length) return [];

  return data.map((row) => {
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const label = (metadata.serviceName as string | undefined) ?? 'Service payment';
    const status = String(row.status);
    return {
      label,
      amount: `${row.currency} ${Number(row.amount).toLocaleString()}`,
      status: status === 'succeeded' ? 'paid' : status,
    };
  });
}

export async function buildApplicant360(
  application: JobApplication,
  documents: DocumentRecord[],
): Promise<Applicant360> {
  let messages: Applicant360Message[] = [];
  try {
    const rows = await listMessagesForApplication(application.id);
    messages = rows
      .slice(-20)
      .reverse()
      .map((row) => ({
        id: row.id,
        title: row.body.slice(0, 48) || 'Message',
        body: row.body,
        createdAt: row.createdAt,
      }));
  } catch {
    messages = [];
  }

  const [payments, notes] = await Promise.all([
    loadApplicantPayments(application),
    listApplicantNotes(application.id),
  ]);

  return {
    application,
    documents,
    timeline: ensureApplicationTimeline(application),
    visa: application.visaTracker,
    visaPercent: visaProgressPercent(application.id, [application]),
    messages,
    payments,
    notes,
  };
}

export async function listApplicantsFor360(): Promise<JobApplication[]> {
  const apps = await fetchAllApplications();
  return apps.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
