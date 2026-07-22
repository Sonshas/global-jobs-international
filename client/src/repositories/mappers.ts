import type { JobListing } from '@/data/jobs-catalog';
import type { EmployerJob, EmployerJobStatus, EmployerProfile } from '@/data/employer';
import type { AdminJob } from '@/data/admin-jobs';
import type {
  ApplicationDocument,
  ApplicationProfileSnapshot,
  ApplicationStage,
  JobApplication,
  StageStatus,
} from '@/data/applications';
import { APPLICATION_STAGES } from '@/data/applications';
import type { DbApplicationRow, DbJobRow, Json } from '@/lib/database.types';

export type JobListingMetadata = {
  source?: 'employer' | 'admin' | 'catalog';
  employerUserId?: string;
  catalog_id?: string;
  listing?: Partial<JobListing>;
  archived?: boolean;
  assignedEmployer?: string;
  views?: number;
  employerJob?: Partial<EmployerJob>;
};

export function asObject(value: Json): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mapDbStatusToUi(status: DbJobRow['status']): EmployerJobStatus {
  if (status === 'published') return 'Open';
  if (status === 'closed' || status === 'archived') return 'Closed';
  return 'Draft';
}

export function mapUiStatusToDb(status: EmployerJobStatus): DbJobRow['status'] {
  if (status === 'Open') return 'published';
  if (status === 'Closed') return 'closed';
  return 'draft';
}

export function jobRowToListing(
  row: DbJobRow,
  extras: {
    countryName?: string;
    countryCode?: string;
    cityName?: string;
    companyName?: string;
  } = {},
): JobListing {
  const meta = asObject(row.metadata) as JobListingMetadata;
  const embedded = (meta.listing ?? meta.employerJob ?? {}) as Partial<JobListing>;

  const salaryMonthly =
    embedded.salaryMonthly ??
    (row.salary_max ? Number(row.salary_max) : row.salary_min ? Number(row.salary_min) : 3000);

  return {
    id: meta.catalog_id && meta.source === 'catalog' ? meta.catalog_id : row.id,
    title: embedded.title ?? row.title,
    country: embedded.country ?? extras.countryName ?? 'International',
    countryCode: embedded.countryCode ?? extras.countryCode ?? 'us',
    city: embedded.city ?? extras.cityName ?? '—',
    employer: embedded.employer ?? extras.companyName ?? 'Verified Employer',
    salaryMonthly,
    currency: embedded.currency ?? row.salary_currency ?? 'USD',
    salaryLabel:
      embedded.salaryLabel ??
      `${row.salary_currency} ${salaryMonthly.toLocaleString()}/month`,
    visaSponsorship: embedded.visaSponsorship ?? row.visa_sponsorship,
    accommodation: embedded.accommodation ?? false,
    medicalInsurance: embedded.medicalInsurance ?? false,
    contractDuration: embedded.contractDuration ?? '24 months',
    workingHours: embedded.workingHours ?? '40 hours / week',
    description: embedded.description ?? row.description,
    benefits: embedded.benefits ?? (row.benefits ? row.benefits.split('\n').filter(Boolean) : []),
    requirements: embedded.requirements ?? [],
    vacancies: embedded.vacancies ?? row.vacancies,
    applicationDeadline:
      embedded.applicationDeadline ??
      row.application_deadline ??
      new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    status: mapDbStatusToUi(row.status) === 'Open' ? 'Open' : 'Closed',
    category: embedded.category ?? 'General',
    experience: embedded.experience ?? 'Mid level',
    logo: embedded.logo ?? 'GJ',
    logoColor: embedded.logoColor ?? '#0052CC',
  };
}

export function employerJobToJobInsertPayload(
  job: Omit<EmployerJob, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'logo' | 'logoColor'> & {
    companyName: string;
  },
  employerId: string,
  countryId: string,
): Partial<DbJobRow> & { employer_id: string; country_id: string; title: string; slug: string; description: string } {
  const slug = job.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return {
    employer_id: employerId,
    country_id: countryId,
    title: job.title,
    slug: `${slug}-${crypto.randomUUID().slice(0, 8)}`,
    description: job.description,
    summary: job.description.slice(0, 500),
    benefits: job.benefits.join('\n'),
    employment_type: 'full_time',
    experience_level: 'mid',
    status: mapUiStatusToDb(job.status),
    vacancies: job.maxApplicants,
    salary_min: job.salaryMonthly,
    salary_max: job.salaryMonthly,
    salary_currency: job.currency,
    visa_sponsorship: job.visaSponsorship,
    application_deadline: job.applicationDeadline,
    published_at: job.status === 'Open' ? new Date().toISOString() : null,
    metadata: {
      source: 'employer',
      employerUserId: job.employerUserId,
      views: 0,
      listing: {
        title: job.title,
        country: job.country,
        countryCode: job.countryCode,
        city: job.city,
        employer: job.companyName,
        salaryMonthly: job.salaryMonthly,
        currency: job.currency,
        salaryLabel: job.salaryLabel,
        visaSponsorship: job.visaSponsorship,
        accommodation: job.accommodation,
        medicalInsurance: job.medicalInsurance,
        transport: job.transport,
        workingHours: job.workingHours,
        contractDuration: job.contractDuration,
        requirements: job.requirements,
        benefits: job.benefits,
        description: job.description,
        applicationDeadline: job.applicationDeadline,
        category: job.category,
        experience: job.experience,
        vacancies: job.maxApplicants,
        jobType: job.jobType,
        education: job.education,
      },
      employerJob: job,
    },
  };
}

export function jobRowToEmployerJob(
  row: DbJobRow,
  employerUserId: string,
  companyName: string,
): EmployerJob {
  const meta = asObject(row.metadata) as JobListingMetadata;
  const listing = (meta.listing ?? {}) as Partial<EmployerJob>;
  const views = typeof meta.views === 'number' ? meta.views : 0;

  return {
    id: row.id,
    employerUserId: meta.employerUserId ?? employerUserId,
    companyName,
    title: listing.title ?? row.title,
    country: listing.country ?? 'International',
    countryCode: listing.countryCode ?? 'us',
    city: listing.city ?? '—',
    salaryMonthly: listing.salaryMonthly ?? Number(row.salary_max ?? row.salary_min ?? 3000),
    currency: listing.currency ?? row.salary_currency,
    salaryLabel: listing.salaryLabel ?? `${row.salary_currency} / month`,
    jobType: listing.jobType ?? 'Full-time',
    experience: listing.experience ?? 'Mid level',
    education: listing.education ?? 'High school',
    accommodation: listing.accommodation ?? false,
    visaSponsorship: listing.visaSponsorship ?? row.visa_sponsorship,
    medicalInsurance: listing.medicalInsurance ?? false,
    transport: listing.transport ?? false,
    workingHours: listing.workingHours ?? '40 hours / week',
    contractDuration: listing.contractDuration ?? '24 months',
    requirements: listing.requirements ?? [],
    benefits: listing.benefits ?? [],
    description: listing.description ?? row.description,
    applicationDeadline:
      listing.applicationDeadline ??
      row.application_deadline ??
      new Date().toISOString().slice(0, 10),
    maxApplicants: listing.maxApplicants ?? row.vacancies,
    status: mapDbStatusToUi(row.status),
    views,
    logo: listing.logo ?? 'GJ',
    logoColor: listing.logoColor ?? '#0052CC',
    category: listing.category ?? 'General',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function jobRowToAdminJob(
  row: DbJobRow,
  companyName: string,
): AdminJob {
  const base = jobRowToEmployerJob(row, 'admin', companyName);
  const meta = asObject(row.metadata) as JobListingMetadata;
  return {
    ...base,
    employerUserId: meta.employerUserId ?? 'admin',
    archived: Boolean(meta.archived),
    assignedEmployer: meta.assignedEmployer,
  };
}

export type ApplicationMetadata = {
  applicationNumber?: string;
  userId?: string;
  uiStatus?: JobApplication['status'];
  currentStage?: ApplicationStage;
  stageStatuses?: Record<ApplicationStage, StageStatus>;
  profile?: ApplicationProfileSnapshot;
  documents?: ApplicationDocument[];
  cvRequired?: boolean;
  cvPaid?: boolean;
  cvPriceLabel?: string;
  recruiterNote?: string;
  jobSnapshot?: Partial<JobListing>;
  recruitmentTimeline?: Array<{
    id: string;
    label: string;
    status: import('@/data/applications').StageStatus | 'waiting';
    at: string;
    note?: string;
  }>;
  visaTracker?: Record<
    | 'Documents Received'
    | 'Medical Completed'
    | 'Interview Passed'
    | 'Visa Approved'
    | 'Ready To Travel',
    boolean
  >;
};

function defaultStageStatuses(): Record<ApplicationStage, StageStatus> {
  return APPLICATION_STAGES.reduce(
    (acc, stage) => {
      acc[stage] =
        stage === 'Submitted'
          ? 'completed'
          : stage === 'Employer Review'
            ? 'in_progress'
            : 'pending';
      return acc;
    },
    {} as Record<ApplicationStage, StageStatus>,
  );
}

export function mapUiAppStatusToDb(
  status: JobApplication['status'],
): DbApplicationRow['status'] {
  if (status === 'approved') return 'hired';
  if (status === 'rejected') return 'rejected';
  if (status === 'in_progress') return 'under_review';
  return 'submitted';
}

export function mapDbAppStatusToUi(
  status: DbApplicationRow['status'],
  metaUi?: JobApplication['status'],
): JobApplication['status'] {
  if (metaUi) return metaUi;
  if (status === 'hired' || status === 'accepted') return 'approved';
  if (status === 'rejected' || status === 'withdrawn') return 'rejected';
  if (status === 'under_review' || status === 'shortlisted' || status === 'interview') {
    return 'in_progress';
  }
  return 'submitted';
}

export function applicationRowToJobApplication(
  row: DbApplicationRow,
  job?: JobListing | null,
): JobApplication {
  const meta = asObject(row.metadata) as ApplicationMetadata;
  const snapshot = meta.jobSnapshot ?? {};
  const stageStatuses = meta.stageStatuses ?? defaultStageStatuses();

  return {
    id: row.id,
    applicationNumber: meta.applicationNumber ?? row.id.slice(0, 8).toUpperCase(),
    userId: meta.userId ?? '',
    jobId: job?.id ?? meta.jobSnapshot?.id ?? row.job_id,
    jobTitle: job?.title ?? snapshot.title ?? 'Role',
    country: job?.country ?? snapshot.country ?? '—',
    city: job?.city ?? snapshot.city ?? '—',
    employer: job?.employer ?? snapshot.employer ?? '—',
    salaryLabel: job?.salaryLabel ?? snapshot.salaryLabel ?? '—',
    visaSponsorship: job?.visaSponsorship ?? snapshot.visaSponsorship ?? false,
    accommodation: job?.accommodation ?? snapshot.accommodation ?? false,
    medicalInsurance: job?.medicalInsurance ?? snapshot.medicalInsurance ?? false,
    status: mapDbAppStatusToUi(row.status, meta.uiStatus),
    currentStage: meta.currentStage ?? 'Employer Review',
    stageStatuses,
    profile: meta.profile ?? {
      fullName: '',
      email: '',
      phone: '',
      countryOfResidence: '',
      preferredCategory: '',
    },
    documents: meta.documents ?? [],
    cvRequired: meta.cvRequired ?? false,
    cvPaid: meta.cvPaid ?? false,
    cvPriceLabel: meta.cvPriceLabel,
    recruiterNote: meta.recruiterNote,
    recruitmentTimeline: Array.isArray(meta.recruitmentTimeline)
      ? (meta.recruitmentTimeline as JobApplication['recruitmentTimeline'])
      : [],
    visaTracker: meta.visaTracker ?? {
      'Documents Received': false,
      'Medical Completed': false,
      'Interview Passed': false,
      'Visa Approved': false,
      'Ready To Travel': false,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function employerProfileFromRows(
  userId: string,
  employer: {
    legal_name: string;
    metadata: Json;
    is_verified: boolean;
    status: string;
    subscription_plan?: string;
    subscription_status?: string;
  },
  profile?: { about: string | null; logo_url: string | null; cover_image_url: string | null } | null,
): EmployerProfile {
  const meta = asObject(employer.metadata);
  return {
    userId,
    companyName: employer.legal_name,
    logoDataUrl: profile?.logo_url ?? (meta.logoDataUrl as string) ?? '',
    coverDataUrl: profile?.cover_image_url ?? (meta.coverDataUrl as string) ?? '',
    description: profile?.about ?? (meta.description as string) ?? '',
    website: (meta.website as string) ?? '',
    address: (meta.address as string) ?? '',
    country: (meta.country as string) ?? 'United Arab Emirates',
    industry: (meta.industry as string) ?? 'Recruitment',
    employees: (meta.employees as string) ?? '11-50',
    verified: employer.is_verified,
    hiringStatus: (meta.hiringStatus as EmployerProfile['hiringStatus']) ?? 'hiring',
    accountStatus:
      (meta.accountStatus as EmployerProfile['accountStatus']) ??
      (employer.status === 'active'
        ? 'approved'
        : employer.status === 'rejected' || employer.status === 'suspended' || employer.status === 'pending'
          ? employer.status
          : 'pending'),
    subscriptionPlan: employer.subscription_plan ?? 'free',
    subscriptionStatus: employer.subscription_status ?? 'none',
    createdAt: (meta.createdAt as string) ?? new Date().toISOString(),
    updatedAt: (meta.updatedAt as string) ?? new Date().toISOString(),
  };
}
