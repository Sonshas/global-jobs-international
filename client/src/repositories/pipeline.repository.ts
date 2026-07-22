import { supabase } from '@/lib/supabase';
import type { TimelineEvent } from '@/data/recruitment-pipeline';
import { asObject, type ApplicationMetadata } from '@/repositories/mappers';

export const DEFAULT_VISA_TRACKER: Record<string, boolean> = {
  'Documents Received': false,
  'Medical Completed': false,
  'Interview Passed': false,
  'Visa Approved': false,
  'Ready To Travel': false,
};

export function recruitmentTimelineFromMeta(metadata: ApplicationMetadata): TimelineEvent[] {
  const raw = metadata.recruitmentTimeline;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is TimelineEvent => Boolean(item && typeof item === 'object' && 'label' in item))
    .sort((a, b) => a.at.localeCompare(b.at));
}

export function seedRecruitmentTimeline(applicationNumber: string): TimelineEvent[] {
  const at = new Date().toISOString();
  return [
    {
      id: crypto.randomUUID(),
      label: 'Application Submitted',
      status: 'completed',
      at,
      note: applicationNumber,
    },
    {
      id: crypto.randomUUID(),
      label: 'Application Under Review',
      status: 'in_progress',
      at,
    },
  ];
}

export async function appendRecruitmentTimelineEvent(
  applicationId: string,
  label: string,
  status: TimelineEvent['status'],
  note?: string,
): Promise<TimelineEvent[]> {
  const { data: existing, error: fetchError } = await supabase
    .from('applications')
    .select('metadata')
    .eq('id', applicationId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) throw new Error('Application not found');

  const meta = asObject(existing.metadata) as ApplicationMetadata;
  const events = recruitmentTimelineFromMeta(meta);
  const event: TimelineEvent = {
    id: crypto.randomUUID(),
    label,
    status,
    note,
    at: new Date().toISOString(),
  };
  const nextMeta: ApplicationMetadata = {
    ...meta,
    recruitmentTimeline: [...events, event],
  };

  const { error } = await supabase
    .from('applications')
    .update({ metadata: nextMeta })
    .eq('id', applicationId);
  if (error) throw error;
  return nextMeta.recruitmentTimeline as TimelineEvent[];
}


export async function getRecruitmentTimeline(applicationId: string): Promise<TimelineEvent[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('metadata')
    .eq('id', applicationId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return [];
  const meta = asObject(data.metadata) as ApplicationMetadata;
  return recruitmentTimelineFromMeta(meta);
}
