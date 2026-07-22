import { supabase } from '@/lib/supabase';
import type { DbInterviewMode, DbInterviewRow, DbInterviewStatus } from '@/lib/database.types';

export type Interview = {
  id: string;
  applicationId: string;
  jobId: string;
  applicantId: string;
  employerId: string;
  status: DbInterviewStatus;
  mode: DbInterviewMode;
  scheduledStartAt: string;
  scheduledEndAt: string | null;
  timezone: string;
  meetingUrl: string | null;
  locationText: string | null;
  createdAt: string;
};

function rowToInterview(row: DbInterviewRow): Interview {
  return {
    id: row.id,
    applicationId: row.application_id,
    jobId: row.job_id,
    applicantId: row.applicant_id,
    employerId: row.employer_id,
    status: row.status,
    mode: row.mode,
    scheduledStartAt: row.scheduled_start_at,
    scheduledEndAt: row.scheduled_end_at,
    timezone: row.timezone,
    meetingUrl: row.meeting_url,
    locationText: row.location_text,
    createdAt: row.created_at,
  };
}

export async function listForApplicantUser(userId: string): Promise<Interview[]> {
  const { data: applicant } = await supabase
    .from('applicants')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!applicant?.id) return [];

  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('applicant_id', applicant.id)
    .order('scheduled_start_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as DbInterviewRow[]).map(rowToInterview);
}

export async function listForEmployer(userId: string): Promise<Interview[]> {
  const { data: employer } = await supabase
    .from('employers')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle();
  if (!employer?.id) return [];

  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('employer_id', employer.id)
    .order('scheduled_start_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as DbInterviewRow[]).map(rowToInterview);
}

export async function listAllForStaff(): Promise<Interview[]> {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('scheduled_start_at', { ascending: true });

  if (error) throw error;
  return ((data ?? []) as DbInterviewRow[]).map(rowToInterview);
}

export type InterviewApplicationContext = {
  applicationId: string;
  jobId: string;
  applicantId: string;
  employerId: string;
};

/** Resolves DB ids needed to schedule an interview from an application id. */
export async function resolveInterviewContext(
  applicationId: string,
): Promise<InterviewApplicationContext | null> {
  const { data: application, error } = await supabase
    .from('applications')
    .select('id, job_id, applicant_id')
    .eq('id', applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!application?.job_id || !application?.applicant_id) return null;

  const { data: job } = await supabase
    .from('jobs')
    .select('employer_id')
    .eq('id', application.job_id)
    .maybeSingle();
  if (!job?.employer_id) return null;

  return {
    applicationId: application.id,
    jobId: application.job_id as string,
    applicantId: application.applicant_id as string,
    employerId: job.employer_id as string,
  };
}

export async function createInterview(input: {
  applicationId: string;
  jobId: string;
  applicantId: string;
  employerId: string;
  scheduledBy?: string;
  scheduledStartAt: string;
  scheduledEndAt?: string | null;
  mode?: DbInterviewMode;
  status?: DbInterviewStatus;
  meetingUrl?: string | null;
  locationText?: string | null;
  timezone?: string;
}): Promise<Interview> {
  const { data, error } = await supabase
    .from('interviews')
    .insert({
      application_id: input.applicationId,
      job_id: input.jobId,
      applicant_id: input.applicantId,
      employer_id: input.employerId,
      scheduled_by: input.scheduledBy ?? null,
      scheduled_start_at: input.scheduledStartAt,
      scheduled_end_at: input.scheduledEndAt ?? null,
      mode: input.mode ?? 'video',
      status: input.status ?? 'scheduled',
      meeting_url: input.meetingUrl ?? null,
      location_text: input.locationText ?? null,
      timezone: input.timezone ?? 'UTC',
    })
    .select('*')
    .single();

  if (error) throw error;
  return rowToInterview(data as DbInterviewRow);
}

export async function updateInterviewStatus(
  interviewId: string,
  status: DbInterviewStatus,
  extra?: { feedback?: string; rating?: number; cancellationReason?: string },
): Promise<Interview> {
  const patch: Record<string, unknown> = { status };
  if (status === 'completed') patch.completed_at = new Date().toISOString();
  if (status === 'cancelled') {
    patch.cancelled_at = new Date().toISOString();
    if (extra?.cancellationReason) patch.cancellation_reason = extra.cancellationReason;
  }
  if (extra?.feedback) patch.feedback = extra.feedback;
  if (typeof extra?.rating === 'number') patch.rating = extra.rating;

  const { data, error } = await supabase
    .from('interviews')
    .update(patch)
    .eq('id', interviewId)
    .select('*')
    .single();

  if (error) throw error;
  return rowToInterview(data as DbInterviewRow);
}
