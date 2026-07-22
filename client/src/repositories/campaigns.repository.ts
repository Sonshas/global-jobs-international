import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';

export type Campaign = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  countryId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  metadata: Json;
  createdAt: string;
  updatedAt: string;
};

type DbCampaignRow = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  country_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

function rowToCampaign(row: DbCampaignRow): Campaign {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    countryId: row.country_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isActive: row.is_active,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Admin/staff listing — RLS also allows this to include inactive campaigns for them. */
export async function listAllCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as DbCampaignRow[]).map(rowToCampaign);
}

export async function listActiveCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as DbCampaignRow[]).map(rowToCampaign);
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function createCampaign(input: {
  title: string;
  summary?: string;
  countryId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
}): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      title: input.title,
      slug: `${slugify(input.title)}-${Date.now().toString(36)}`,
      summary: input.summary ?? null,
      country_id: input.countryId ?? null,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
      is_active: input.isActive ?? true,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToCampaign(data as DbCampaignRow);
}

export async function updateCampaign(
  id: string,
  patch: Partial<{
    title: string;
    summary: string | null;
    countryId: string | null;
    startsAt: string | null;
    endsAt: string | null;
    isActive: boolean;
  }>,
): Promise<Campaign> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.summary !== undefined) dbPatch.summary = patch.summary;
  if (patch.countryId !== undefined) dbPatch.country_id = patch.countryId;
  if (patch.startsAt !== undefined) dbPatch.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) dbPatch.ends_at = patch.endsAt;
  if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive;

  const { data, error } = await supabase.from('campaigns').update(dbPatch).eq('id', id).select('*').single();
  if (error) throw error;
  return rowToCampaign(data as DbCampaignRow);
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}
