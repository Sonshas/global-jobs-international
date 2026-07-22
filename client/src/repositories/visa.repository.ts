import type { VisaTrackerStep } from '@/data/recruitment-pipeline';
import { DEFAULT_VISA_TRACKER } from '@/repositories/pipeline.repository';
import { supabase } from '@/lib/supabase';
import { asObject, type ApplicationMetadata } from '@/repositories/mappers';

export type VisaTrackerState = Record<VisaTrackerStep, boolean>;

type VisaMetadata = {
  tracker?: Partial<Record<VisaTrackerStep, boolean>>;
};

function normalizeTracker(meta: VisaMetadata | null | undefined): VisaTrackerState {
  const tracker = meta?.tracker ?? {};
  return {
    'Documents Received': Boolean(tracker['Documents Received']),
    'Medical Completed': Boolean(tracker['Medical Completed']),
    'Interview Passed': Boolean(tracker['Interview Passed']),
    'Visa Approved': Boolean(tracker['Visa Approved']),
    'Ready To Travel': Boolean(tracker['Ready To Travel']),
  };
}

export async function ensureVisaProgressRow(input: {
  applicationId: string;
  applicantId: string;
  countryId: string;
}): Promise<void> {
  const { data: existing } = await supabase
    .from('visa_progress')
    .select('id')
    .eq('application_id', input.applicationId)
    .maybeSingle();
  if (existing?.id) return;

  const { error } = await supabase.from('visa_progress').insert({
    application_id: input.applicationId,
    applicant_id: input.applicantId,
    country_id: input.countryId,
    stage: 'documents_collection',
    metadata: { tracker: DEFAULT_VISA_TRACKER },
  });
  if (error) throw error;
}

export async function fetchVisaTracker(applicationId: string): Promise<VisaTrackerState> {
  const { data, error } = await supabase
    .from('visa_progress')
    .select('metadata')
    .eq('application_id', applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return normalizeTracker(undefined);
  }
  return normalizeTracker((data.metadata ?? {}) as VisaMetadata);
}

export async function setVisaTrackerStep(
  applicationId: string,
  step: VisaTrackerStep,
  done: boolean,
): Promise<VisaTrackerState> {
  const { data: row, error: fetchError } = await supabase
    .from('visa_progress')
    .select('id, metadata')
    .eq('application_id', applicationId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!row?.id) {
    const empty = normalizeTracker(undefined);
    empty[step] = done;
    return empty;
  }

  const meta = (row.metadata ?? {}) as VisaMetadata;
  const tracker = normalizeTracker(meta);
  tracker[step] = done;
  const nextMeta: VisaMetadata = { ...meta, tracker };

  const { error } = await supabase
    .from('visa_progress')
    .update({ metadata: nextMeta })
    .eq('id', row.id);
  if (error) throw error;

  const { data: appRow } = await supabase
    .from('applications')
    .select('metadata')
    .eq('id', applicationId)
    .maybeSingle();
  if (appRow) {
    const appMeta = asObject(appRow.metadata) as ApplicationMetadata;
    await supabase
      .from('applications')
      .update({
        metadata: {
          ...appMeta,
          visaTracker: tracker,
        },
      })
      .eq('id', applicationId);
  }

  return tracker;
}

export function visaProgressPercentFromTracker(tracker: VisaTrackerState): number {
  const steps: VisaTrackerStep[] = [
    'Documents Received',
    'Medical Completed',
    'Interview Passed',
    'Visa Approved',
    'Ready To Travel',
  ];
  const done = steps.filter((step) => tracker[step]).length;
  return Math.round((done / steps.length) * 100);
}
