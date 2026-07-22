import type { JobListing } from '@/data/jobs-catalog';
import { getCvOrderFromPayments } from '@/data/cv-services';

export const APPLICATION_STAGES = [
  'Submitted',
  'Employer Review',
  'Shortlisted',
  'Interview',
  'Medical',
  'Police Clearance',
  'Visa Processing',
  'Flight Booking',
  'Departure',
  'Arrived',
  'Employment Started',
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];
export type StageStatus = 'pending' | 'completed' | 'rejected' | 'in_progress';

export type ApplicationDocumentKind =
  | 'passport'
  | 'cv'
  | 'certificates'
  | 'national_id'
  | 'driving_licence';

export type ApplicationDocument = {
  kind: ApplicationDocumentKind;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  documentId?: string;
  storagePath?: string;
};

export type ApplicationProfileSnapshot = {
  fullName: string;
  email: string;
  phone: string;
  countryOfResidence: string;
  preferredCategory: string;
};

export type JobApplication = {
  id: string;
  applicationNumber: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  country: string;
  city: string;
  employer: string;
  salaryLabel: string;
  visaSponsorship: boolean;
  accommodation: boolean;
  medicalInsurance: boolean;
  status: 'submitted' | 'approved' | 'rejected' | 'in_progress';
  currentStage: ApplicationStage;
  stageStatuses: Record<ApplicationStage, StageStatus>;
  profile: ApplicationProfileSnapshot;
  documents: ApplicationDocument[];
  cvRequired: boolean;
  cvPaid: boolean;
  cvPriceLabel?: string;
  recruiterNote?: string;
  createdAt: string;
  updatedAt: string;
  recruitmentTimeline: Array<{
    id: string;
    label: string;
    status: StageStatus | 'waiting';
    at: string;
    note?: string;
  }>;
  visaTracker: Record<
    | 'Documents Received'
    | 'Medical Completed'
    | 'Interview Passed'
    | 'Visa Approved'
    | 'Ready To Travel',
    boolean
  >;
};

export {
  createApplicationRecord as createApplication,
  fetchAllApplications as listApplications,
  fetchApplicationsForUser as listApplicationsForUser,
  fetchApplicationById as getApplicationById,
  updateApplicationRecord as updateApplication,
  setApplicationStageRecord as setApplicationStage,
} from '@/repositories/applications.repository';

export async function applicantNeedsCvPayment(user: {
  id: string;
  user_metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const hasCv = user.user_metadata?.has_cv;
  if (hasCv === 'yes' || hasCv === true) return false;
  const order = await getCvOrderFromPayments(user.id);
  return !(order && (order.status === 'completed' || order.status === 'in_progress'));
}

export function getUserApplicationStats(apps: JobApplication[]) {
  return {
    submitted: apps.length,
    approved: apps.filter((app) => app.status === 'approved').length,
    pendingReview: apps.filter(
      (app) => app.status === 'submitted' || app.currentStage === 'Employer Review',
    ).length,
    interviews: apps.filter(
      (app) =>
        app.stageStatuses.Interview === 'completed' ||
        app.stageStatuses.Interview === 'in_progress',
    ).length,
    documents: apps.reduce((sum, app) => sum + app.documents.length, 0),
  };
}

export function requiredDocumentsForJob(job: JobListing): ApplicationDocumentKind[] {
  const docs: ApplicationDocumentKind[] = ['passport', 'cv', 'certificates', 'national_id'];
  if (/driver|truck|bus|taxi|delivery/i.test(job.title)) {
    docs.push('driving_licence');
  }
  return docs;
}

export function documentLabel(kind: ApplicationDocumentKind): string {
  switch (kind) {
    case 'passport':
      return 'Passport';
    case 'cv':
      return 'CV';
    case 'certificates':
      return 'Certificates';
    case 'national_id':
      return 'National ID';
    case 'driving_licence':
      return 'Driving Licence';
  }
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 Day Ago';
  return `${days} Days Ago`;
}

/** Build applicant-visible timeline from Supabase-backed application metadata (no localStorage). */
export function timelineFromApplication(app: JobApplication): Array<{
  id: string;
  label: string;
  status: StageStatus | 'waiting';
  at: string;
  note?: string;
}> {
  return APPLICATION_STAGES.map((stage) => ({
    id: `${app.id}-${stage}`,
    label: stage,
    status: app.stageStatuses[stage],
    at: app.updatedAt,
  }));
}

export function employerShortlistPatch(app: JobApplication): Partial<
  Pick<JobApplication, 'status' | 'currentStage' | 'stageStatuses'>
> {
  return {
    status: 'in_progress',
    currentStage: 'Shortlisted',
    stageStatuses: {
      ...app.stageStatuses,
      'Employer Review': 'completed',
      Shortlisted: 'completed',
      Interview: 'in_progress',
    },
  };
}

export function employerRejectPatch(app: JobApplication): Partial<
  Pick<JobApplication, 'status' | 'currentStage' | 'stageStatuses'>
> {
  return {
    status: 'rejected',
    currentStage: app.currentStage,
    stageStatuses: {
      ...app.stageStatuses,
      [app.currentStage]: 'rejected',
    },
  };
}

export function employerReviewPatch(app: JobApplication): Partial<
  Pick<JobApplication, 'status' | 'currentStage' | 'stageStatuses'>
> {
  return {
    status: 'in_progress',
    currentStage: 'Employer Review',
    stageStatuses: {
      ...app.stageStatuses,
      Submitted: 'completed',
      'Employer Review': 'in_progress',
    },
  };
}
