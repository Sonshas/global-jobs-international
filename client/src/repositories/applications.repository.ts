import type { JobListing } from '@/data/jobs-catalog';
import { getJobById } from '@/data/jobs-catalog';
import type {
  ApplicationDocument,
  ApplicationProfileSnapshot,
  ApplicationStage,
  JobApplication,
  StageStatus,
} from '@/data/applications';
import { APPLICATION_STAGES } from '@/data/applications';
import { sendLifecycleEmail } from '@/data/email-automation';
import { supabase } from '@/lib/supabase';
import type { DbApplicationRow } from '@/lib/database.types';
import {
  applicationRowToJobApplication,
  asObject,
  mapUiAppStatusToDb,
  type ApplicationMetadata,
} from '@/repositories/mappers';
import { linkDocumentsToApplication } from '@/repositories/documents.repository';
import { seedRecruitmentTimeline } from '@/repositories/pipeline.repository';
import { ensureVisaProgressRow } from '@/repositories/visa.repository';
import { dispatchNotification } from '@/lib/comms';
import { ensureCatalogJobForListing, resolveJobFromAllSources } from '@/repositories/jobs.repository';

export async function getApplicantIdForUser(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('applicants')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data?.id) return data.id;

  const { data: created, error: createError } = await supabase
    .from('applicants')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id;
}

async function hydrateApplication(row: DbApplicationRow): Promise<JobApplication> {
  const job = await resolveJobFromAllSources(row.job_id);
  const meta = asObject(row.metadata) as ApplicationMetadata;
  if (!job && meta.jobSnapshot?.id) {
    const byCatalog = await resolveJobFromAllSources(meta.jobSnapshot.id);
    return applicationRowToJobApplication(row, byCatalog);
  }
  return applicationRowToJobApplication(row, job);
}

export async function fetchAllApplications(): Promise<JobApplication[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as DbApplicationRow[];
  return Promise.all(rows.map((row) => hydrateApplication(row)));
}

export async function fetchApplicationsForUser(userId: string): Promise<JobApplication[]> {
  const applicantId = await getApplicantIdForUser(userId);
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('applicant_id', applicantId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as DbApplicationRow[];
  return Promise.all(rows.map((row) => hydrateApplication(row)));
}

export async function fetchApplicationById(id: string): Promise<JobApplication | null> {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return hydrateApplication(data as DbApplicationRow);
}

export async function fetchApplicationCountForListing(listingId: string | undefined): Promise<number> {
  if (!listingId) return 0;
  const dbIds = await resolveJobDbIdsForListing(listingId);
  if (!dbIds.length) return 0;
  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('job_id', dbIds);
  if (error) return 0;
  return count ?? 0;
}

async function resolveJobDbIdsForListing(listingId: string): Promise<string[]> {
  const { data: byCatalog } = await supabase
    .from('jobs')
    .select('id')
    .eq('metadata->>catalog_id', listingId);
  const catalogIds = (byCatalog ?? []).map((row) => row.id as string);
  if (catalogIds.length) return catalogIds;

  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(listingId);
  if (!uuidLike) return [];

  const { data: byId } = await supabase.from('jobs').select('id').eq('id', listingId).maybeSingle();
  return byId?.id ? [byId.id as string] : [];
}

export async function fetchApplicationsForJobIds(jobIds: string[]): Promise<JobApplication[]> {
  if (!jobIds.length) return [];
  const { data, error } = await supabase.from('applications').select('*').in('job_id', jobIds);
  if (error) throw error;
  const rows = (data ?? []) as DbApplicationRow[];
  return Promise.all(rows.map((row) => hydrateApplication(row)));
}

export async function createApplicationRecord(input: {
  userId: string;
  job: JobListing;
  profile: ApplicationProfileSnapshot;
  documents: ApplicationDocument[];
  cvRequired: boolean;
  cvPaid: boolean;
  cvPriceLabel?: string;
  residenceCountry?: string;
}): Promise<JobApplication> {
  const applicantId = await getApplicantIdForUser(input.userId);

  let jobDbId: string;
  if (getJobById(input.job.id)) {
    jobDbId = await ensureCatalogJobForListing(input.job);
  } else {
    const { data: existingJob } = await supabase.from('jobs').select('id').eq('id', input.job.id).maybeSingle();
    if (!existingJob?.id) {
      throw new Error('Job not found. It may have been closed or removed.');
    }
    jobDbId = existingJob.id;
  }

  const { data: appNumberData, error: numberError } = await supabase.rpc('next_gji_application_number');
  if (numberError) throw numberError;
  const applicationNumber = appNumberData as string;

  const metadata: ApplicationMetadata = {
    applicationNumber,
    userId: input.userId,
    uiStatus: 'submitted',
    currentStage: 'Employer Review',
    visaTracker: {
      'Documents Received': false,
      'Medical Completed': false,
      'Interview Passed': false,
      'Visa Approved': false,
      'Ready To Travel': false,
    },
    recruitmentTimeline: seedRecruitmentTimeline(applicationNumber),
    stageStatuses: APPLICATION_STAGES.reduce(
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
    ),
    profile: input.profile,
    documents: input.documents,
    cvRequired: input.cvRequired,
    cvPaid: input.cvPaid,
    cvPriceLabel: input.cvPriceLabel,
    jobSnapshot: input.job,
  };

  const { data, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobDbId,
      applicant_id: applicantId,
      status: 'submitted',
      source: 'website',
      metadata,
    })
    .select('*')
    .single();

  if (error) throw error;

  const documentIds = input.documents
    .map((doc) => doc.documentId)
    .filter((id): id is string => Boolean(id));
  if (documentIds.length) {
    await linkDocumentsToApplication(data.id, documentIds);
  }

  const { data: jobRow } = await supabase
    .from('jobs')
    .select('country_id')
    .eq('id', jobDbId)
    .maybeSingle();
  if (jobRow?.country_id) {
    await ensureVisaProgressRow({
      applicationId: data.id,
      applicantId,
      countryId: jobRow.country_id as string,
    });
  }

  const app = await hydrateApplication(data as DbApplicationRow);

  await dispatchNotification({
    userId: input.userId,
    title: 'Application submitted',
    body: `${app.applicationNumber}: ${app.jobTitle} in ${app.country}`,
    href: `/dashboard/applications/${app.id}`,
    eventType: 'application_submitted',
    entityId: app.id,
  });

  sendLifecycleEmail('application_submitted', {
    to: input.profile.email,
    userId: input.userId,
    variables: {
      name: input.profile.fullName,
      applicationNumber: app.applicationNumber,
      jobTitle: app.jobTitle,
      country: app.country,
    },
  });

  return app;
}

export async function updateApplicationRecord(
  id: string,
  patch: Partial<
    Pick<JobApplication, 'status' | 'currentStage' | 'stageStatuses' | 'recruiterNote' | 'cvPaid'>
  >,
): Promise<JobApplication | null> {
  const { data: existing, error: fetchError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) return null;

  const row = existing as DbApplicationRow;
  const meta = asObject(row.metadata) as ApplicationMetadata;
  const nextMeta: ApplicationMetadata = {
    ...meta,
    uiStatus: patch.status ?? meta.uiStatus,
    currentStage: patch.currentStage ?? meta.currentStage,
    stageStatuses: patch.stageStatuses ?? meta.stageStatuses,
    recruiterNote: patch.recruiterNote ?? meta.recruiterNote,
    cvPaid: patch.cvPaid ?? meta.cvPaid,
  };

  const status = patch.status ? mapUiAppStatusToDb(patch.status) : row.status;

  const { data, error } = await supabase
    .from('applications')
    .update({
      status,
      metadata: nextMeta,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  const previousApp = await hydrateApplication(row);
  const nextApp = await hydrateApplication(data as DbApplicationRow);

  const stageChanged = Boolean(patch.currentStage && patch.currentStage !== previousApp.currentStage);
  const statusChanged = Boolean(patch.status && patch.status !== previousApp.status);

  if (stageChanged && patch.currentStage) {
    await dispatchNotification({
      userId: previousApp.userId,
      title: 'Application stage updated',
      body: `${nextApp.applicationNumber}: ${patch.currentStage}`,
      href: `/dashboard/applications/${id}`,
      eventType: 'stage_updated',
      entityId: id,
    });
    if (patch.currentStage === 'Shortlisted') {
      sendLifecycleEmail('shortlisted', {
        to: previousApp.profile.email,
        userId: previousApp.userId,
        variables: {
          applicationNumber: nextApp.applicationNumber,
          jobTitle: nextApp.jobTitle,
          country: nextApp.country,
        },
      });
    }
  }

  if (statusChanged && patch.status === 'rejected') {
    await dispatchNotification({
      userId: previousApp.userId,
      title: 'Application update',
      body: `${nextApp.applicationNumber} was not successful at this stage.`,
      href: `/dashboard/applications/${id}`,
      eventType: 'application_rejected',
      entityId: id,
    });
    sendLifecycleEmail('rejected', {
      to: previousApp.profile.email,
      userId: previousApp.userId,
      variables: { applicationNumber: nextApp.applicationNumber, note: '' },
    });
  }

  return nextApp;
}

export async function setApplicationStageRecord(
  id: string,
  stage: ApplicationStage,
  stageStatus: StageStatus,
): Promise<JobApplication | null> {
  const app = await fetchApplicationById(id);
  if (!app) return null;

  const stageStatuses = { ...app.stageStatuses, [stage]: stageStatus };
  const currentStage =
    stageStatus === 'in_progress' || stageStatus === 'completed' ? stage : app.currentStage;

  let appStatus = app.status;
  if (stageStatus === 'rejected') appStatus = 'rejected';
  if (stage === 'Employment Started' && stageStatus === 'completed') appStatus = 'approved';
  if (stageStatus === 'in_progress' && appStatus === 'submitted') appStatus = 'in_progress';

  return updateApplicationRecord(id, { stageStatuses, currentStage, status: appStatus });
}

export async function deleteApplicationRecord(id: string): Promise<void> {
  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) throw error;
}
