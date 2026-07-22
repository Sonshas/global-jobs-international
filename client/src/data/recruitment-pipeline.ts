import type { JobApplication } from '@/data/applications';
import { timelineFromApplication } from '@/data/applications';
import {
  getApplicationById,
  updateApplication,
  type ApplicationDocumentKind,
  type JobApplication as JobApplicationType,
  type StageStatus,
} from '@/data/applications';
import { markApplicantDocumentRequested } from '@/repositories/documents.repository';
import { appendRecruitmentTimelineEvent } from '@/repositories/pipeline.repository';
import { setVisaTrackerStep } from '@/repositories/visa.repository';
import { dispatchNotification } from '@/lib/comms';
import { sendLifecycleEmail } from '@/data/email-automation';
import { logAudit } from '@/lib/security';
import { createInterview, resolveInterviewContext } from '@/repositories/interviews.repository';
import { supabase } from '@/lib/supabase';

export const PIPELINE_STEPS = [
  'Account Created',
  'Email Verified',
  'CV Uploaded',
  'Application Submitted',
  'Application Under Review',
  'Shortlisted',
  'Documents Required',
  'CV Review',
  'CV Payment',
  'Police Clearance Required',
  'Medical Examination Required',
  'Interview Scheduled',
  'Interview Passed',
  'Visa Processing',
  'Work Permit Processing',
  'Flight Booking',
  'Departure Preparation',
  'Travel Date Assigned',
  'Arrived',
  'Employed',
] as const;

export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export const VISA_TRACKER_STEPS = [
  'Documents Received',
  'Medical Completed',
  'Interview Passed',
  'Visa Approved',
  'Ready To Travel',
] as const;

export type VisaTrackerStep = (typeof VISA_TRACKER_STEPS)[number];

export type DocumentReviewStatus = 'pending' | 'uploaded' | 'approved' | 'rejected';

export type ApplicantDocumentKind =
  | ApplicationDocumentKind
  | 'academic_certificates'
  | 'police_clearance'
  | 'medical_report'
  | 'passport_photo'
  | 'ielts';

export type TimelineEvent = {
  id: string;
  label: string;
  status: StageStatus | 'waiting';
  at: string;
  note?: string;
};

export type DocumentRecord = {
  kind: ApplicantDocumentKind;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  status: DocumentReviewStatus;
  adminNote?: string;
  documentId?: string;
  storagePath?: string;
};

export type EligibilityAnswers = {
  hasPassport: boolean;
  hasExperience: boolean;
  willingToRelocate: boolean;
  willingMedical: boolean;
  education: string;
};

export type EligibilityResult = {
  eligible: boolean;
  message: string;
};

export function evaluateEligibility(answers: EligibilityAnswers): EligibilityResult {
  const missing: string[] = [];
  if (!answers.hasPassport) missing.push('passport');
  if (!answers.hasExperience) missing.push('relevant work experience');
  if (!answers.willingToRelocate) missing.push('willingness to relocate');
  if (!answers.willingMedical) missing.push('medical examination consent');
  if (!answers.education.trim()) missing.push('education level');

  if (missing.length === 0) {
    return {
      eligible: true,
      message: 'Eligible to Apply — all key requirements appear to be met.',
    };
  }

  return {
    eligible: false,
    message: `Application may require additional documents or review (${missing.join(', ')}). This does not guarantee employment or visa approval.`,
  };
}

export function documentKindLabel(kind: ApplicantDocumentKind): string {
  const labels: Record<ApplicantDocumentKind, string> = {
    passport: 'Passport',
    cv: 'CV',
    certificates: 'Certificates',
    national_id: 'National ID',
    driving_licence: "Driver's Licence",
    academic_certificates: 'Academic Certificates',
    police_clearance: 'Police Clearance',
    medical_report: 'Medical Report',
    passport_photo: 'Passport Photo',
    ielts: 'IELTS Certificate',
  };
  return labels[kind];
}

export const APPLICANT_DOCUMENT_KINDS: ApplicantDocumentKind[] = [
  'passport',
  'national_id',
  'cv',
  'academic_certificates',
  'certificates',
  'police_clearance',
  'medical_report',
  'passport_photo',
  'driving_licence',
  'ielts',
];

export {
  createSignedDocumentUrl,
  fetchApplicantDocuments,
  uploadApplicantDocument,
} from '@/repositories/documents.repository';

export function getTimeline(applicationId: string, apps?: JobApplication[]): TimelineEvent[] {
  const app = apps?.find((item) => item.id === applicationId);
  if (!app) return [];
  return ensureApplicationTimeline(app);
}

export async function addTimelineEvent(
  applicationId: string,
  label: string,
  status: TimelineEvent['status'],
  note?: string,
): Promise<TimelineEvent[]> {
  return appendRecruitmentTimelineEvent(applicationId, label, status, note);
}

export function ensureApplicationTimeline(app: JobApplication): TimelineEvent[] {
  if (app.recruitmentTimeline.length) {
    return [...app.recruitmentTimeline].sort((a, b) => a.at.localeCompare(b.at));
  }
  return timelineFromApplication(app);
}

export function getVisaTracker(applicationId: string, apps?: JobApplication[]) {
  const app = apps?.find((item) => item.id === applicationId);
  if (app) return app.visaTracker;
  return {
    'Documents Received': false,
    'Medical Completed': false,
    'Interview Passed': false,
    'Visa Approved': false,
    'Ready To Travel': false,
  };
}

export async function setVisaTrackerStepForApplication(
  applicationId: string,
  step: VisaTrackerStep,
  done: boolean,
) {
  return setVisaTrackerStep(applicationId, step, done);
}

export function visaProgressPercent(applicationId: string, apps?: JobApplication[]): number {
  const tracker = getVisaTracker(applicationId, apps);
  const done = VISA_TRACKER_STEPS.filter((step) => tracker[step]).length;
  return Math.round((done / VISA_TRACKER_STEPS.length) * 100);
}

export async function notifyApplicantAction(input: {
  app: JobApplicationType;
  title: string;
  body: string;
  emailSubject?: string;
  emailTemplate?: Parameters<typeof sendLifecycleEmail>[0];
  emailVariables?: Record<string, string>;
}) {
  await dispatchNotification({
    userId: input.app.userId,
    title: input.title,
    body: input.body,
    href: `/dashboard/applications/${input.app.id}`,
    eventType: 'application_update',
    entityId: input.app.id,
  });
  if (input.emailTemplate) {
    sendLifecycleEmail(input.emailTemplate, {
      to: input.app.profile.email,
      userId: input.app.userId,
      variables: input.emailVariables,
    });
  } else if (input.emailSubject) {
    sendLifecycleEmail('status_update', {
      to: input.app.profile.email,
      userId: input.app.userId,
      variables: { subject: input.emailSubject, body: input.body },
    });
  }
}

/** Parses an ISO 8601 datetime embedded in a free-text scheduling note, if present. */
function parseIsoDateFromNote(note?: string): Date | null {
  if (!note) return null;
  const match = note.match(/\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?/);
  if (!match) return null;
  const candidate = new Date(match[0].replace(' ', 'T'));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

/**
 * Best-effort insert of an `interviews` row alongside the existing timeline-based
 * scheduling flow. Never throws — the timeline event remains the source of truth
 * for the applicant/admin UI even if the structured interview record fails.
 */
function parseMeetingUrlFromNote(note?: string): string | null {
  if (!note) return null;
  const match = note.match(/https?:\/\/\S+/i);
  return match?.[0]?.replace(/[),.;]+$/, '') ?? null;
}

async function scheduleInterviewRecord(app: JobApplicationType, note?: string): Promise<void> {
  try {
    const context = await resolveInterviewContext(app.id);
    if (!context) return;

    const parsedStart = parseIsoDateFromNote(note);
    const scheduledStartAt = (parsedStart ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)).toISOString();
    const scheduledEndAt = new Date(
      new Date(scheduledStartAt).getTime() + 60 * 60 * 1000,
    ).toISOString();
    const meetingUrl = parseMeetingUrlFromNote(note);

    const { data: authData } = await supabase.auth.getUser();

    await createInterview({
      applicationId: context.applicationId,
      jobId: context.jobId,
      applicantId: context.applicantId,
      employerId: context.employerId,
      scheduledBy: authData.user?.id,
      scheduledStartAt,
      scheduledEndAt,
      mode: 'video',
      status: 'scheduled',
      meetingUrl,
    });
  } catch (error) {
    console.warn('[recruitment-pipeline] Interview record insert skipped:', error);
  }
}

export async function adminAdvancePipeline(
  app: JobApplicationType,
  action:
    | 'approve'
    | 'reject'
    | 'request_passport'
    | 'request_cv'
    | 'request_medical'
    | 'request_police'
    | 'schedule_interview'
    | 'mark_interview_passed'
    | 'start_visa'
    | 'upload_work_permit'
    | 'upload_flight'
    | 'mark_travelled'
    | 'mark_employed'
    | 'shortlist'
    | 'documents_received',
  extraNote?: string,
) {
  const note = extraNote?.trim();

  switch (action) {
    case 'approve':
    case 'shortlist':
      await updateApplication(app.id, { status: 'approved', currentStage: 'Shortlisted' });
      await addTimelineEvent(app.id, 'Shortlisted', 'completed', note);
      await addTimelineEvent(app.id, 'Interview Scheduled', 'waiting');
      break;
    case 'reject':
      await updateApplication(app.id, { status: 'rejected' });
      await addTimelineEvent(app.id, 'Application Rejected', 'rejected', note);
      break;
    case 'request_passport':
      await markApplicantDocumentRequested(app.userId, 'passport', note);
      await addTimelineEvent(app.id, 'Passport Requested', 'in_progress', note);
      await notifyApplicantAction({
        app,
        title: 'Passport required',
        body: `Please upload your Passport for ${app.applicationNumber}.${note ? ` ${note}` : ''}`,
      });
      break;
    case 'request_cv':
      await markApplicantDocumentRequested(app.userId, 'cv', note);
      await addTimelineEvent(app.id, 'CV Requested', 'in_progress', note);
      await notifyApplicantAction({
        app,
        title: 'CV required',
        body: `Please upload your CV for ${app.applicationNumber}.`,
      });
      break;
    case 'request_medical':
      await markApplicantDocumentRequested(app.userId, 'medical_report', note);
      await addTimelineEvent(app.id, 'Medical Examination Required', 'in_progress', note);
      await updateApplication(app.id, { currentStage: 'Medical' });
      await notifyApplicantAction({
        app,
        title: 'Medical examination required',
        body: `Medical documents are required for ${app.applicationNumber}.`,
        emailTemplate: 'medical_requested',
        emailVariables: { applicationNumber: app.applicationNumber },
      });
      break;
    case 'request_police':
      await markApplicantDocumentRequested(app.userId, 'police_clearance', note);
      await addTimelineEvent(app.id, 'Police Clearance Required', 'in_progress', note);
      await updateApplication(app.id, { currentStage: 'Police Clearance' });
      await notifyApplicantAction({
        app,
        title: 'Police clearance required',
        body: `Please upload police clearance for ${app.applicationNumber}.`,
        emailTemplate: 'police_clearance_requested',
        emailVariables: { applicationNumber: app.applicationNumber },
      });
      break;
    case 'schedule_interview':
      await updateApplication(app.id, { currentStage: 'Interview', status: 'in_progress' });
      await addTimelineEvent(
        app.id,
        'Interview Scheduled',
        'in_progress',
        note || 'Interview date assigned by admin',
      );
      await scheduleInterviewRecord(app, note);
      sendLifecycleEmail('interview_scheduled', {
        to: app.profile.email,
        userId: app.userId,
        variables: { applicationNumber: app.applicationNumber, note: note || '' },
      });
      logAudit({
        actorUserId: app.userId,
        action: 'schedule_interview',
        detail: `${app.applicationNumber}${note ? `: ${note}` : ''}`,
      });
      break;
    case 'mark_interview_passed':
      await setVisaTrackerStepForApplication(app.id, 'Interview Passed', true);
      await addTimelineEvent(app.id, 'Interview Passed', 'completed', note);
      await notifyApplicantAction({
        app,
        title: 'Interview passed',
        body: `You passed the interview for ${app.applicationNumber}.`,
      });
      break;
    case 'documents_received':
      await setVisaTrackerStepForApplication(app.id, 'Documents Received', true);
      await addTimelineEvent(app.id, 'Documents Received', 'completed', note);
      break;
    case 'start_visa':
      await updateApplication(app.id, { currentStage: 'Visa Processing', status: 'in_progress' });
      await addTimelineEvent(app.id, 'Visa Processing', 'in_progress', note);
      sendLifecycleEmail('visa_processing_started', {
        to: app.profile.email,
        userId: app.userId,
        variables: { applicationNumber: app.applicationNumber },
      });
      break;
    case 'upload_work_permit':
      await addTimelineEvent(app.id, 'Work Permit Processing', 'completed', note);
      await setVisaTrackerStepForApplication(app.id, 'Visa Approved', true);
      await notifyApplicantAction({
        app,
        title: 'Work permit / visa update',
        body: `Work permit documentation was updated for ${app.applicationNumber}.`,
        emailTemplate: 'visa_approved',
        emailVariables: { applicationNumber: app.applicationNumber },
      });
      break;
    case 'upload_flight':
      await updateApplication(app.id, { currentStage: 'Flight Booking' });
      await addTimelineEvent(app.id, 'Flight Booking', 'completed', note);
      await setVisaTrackerStepForApplication(app.id, 'Ready To Travel', true);
      await notifyApplicantAction({
        app,
        title: 'Flight booked',
        body: `Flight details were uploaded for ${app.applicationNumber}.${note ? ` ${note}` : ''}`,
        emailTemplate: 'flight_booked',
        emailVariables: { applicationNumber: app.applicationNumber, note: note || '' },
      });
      break;
    case 'mark_travelled':
      await updateApplication(app.id, { currentStage: 'Arrived' });
      await addTimelineEvent(app.id, 'Arrived', 'completed', note);
      await notifyApplicantAction({
        app,
        title: 'Travel confirmed',
        body: `${app.applicationNumber} marked as travelled / arrived.`,
        emailTemplate: 'welcome_after_arrival',
        emailVariables: { applicationNumber: app.applicationNumber, country: app.country },
      });
      break;
    case 'mark_employed':
      await updateApplication(app.id, { currentStage: 'Employment Started', status: 'approved' });
      await addTimelineEvent(app.id, 'Employed', 'completed', note);
      await notifyApplicantAction({
        app,
        title: 'Employment started',
        body: `Congratulations — ${app.applicationNumber} is marked as employed.`,
      });
      break;
  }

  return await getApplicationById(app.id);
}

export function buildApplicantProgress(
  user: {
    id: string;
    email?: string | null;
    email_confirmed_at?: string | null;
    user_metadata?: Record<string, unknown>;
  },
  apps: JobApplication[],
  docs: DocumentRecord[] = [],
) {
  const latest = apps[0];
  const hasCvDoc = docs.some((doc) => doc.kind === 'cv' && doc.status !== 'pending');
  const hasCvMeta = user.user_metadata?.has_cv === 'yes' || user.user_metadata?.has_cv === true;
  const timeline = latest ? ensureApplicationTimeline(latest) : [];

  const steps: Array<{ label: string; done: boolean }> = [
    { label: 'Account Created', done: true },
    { label: 'Email Verified', done: Boolean(user.email_confirmed_at) },
    { label: 'CV Uploaded', done: hasCvDoc || hasCvMeta },
    { label: 'Application Submitted', done: apps.length > 0 },
    {
      label: 'Shortlisted',
      done: timeline.some((event) => event.label === 'Shortlisted' && event.status === 'completed'),
    },
    {
      label: 'Medical Pending',
      done: timeline.some((event) => event.label.includes('Medical') && event.status === 'completed'),
    },
    {
      label: 'Police Clearance Pending',
      done: timeline.some((event) => event.label.includes('Police') && event.status === 'completed'),
    },
    {
      label: 'Interview Pending',
      done: timeline.some((event) => event.label.includes('Interview') && event.status === 'completed'),
    },
    {
      label: 'Visa Processing',
      done: Boolean(latest && latest.visaTracker['Visa Approved']),
    },
    {
      label: 'Flight Booking',
      done: timeline.some((event) => event.label === 'Flight Booking' && event.status === 'completed'),
    },
    {
      label: 'Departure',
      done: timeline.some((event) => event.label === 'Arrived' && event.status === 'completed'),
    },
  ];

  return { steps, latest, timeline, docs };
}
