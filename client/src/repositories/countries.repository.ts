import { supabase } from '@/lib/supabase';

const countryCache = new Map<string, string>();

export async function resolveCountryId(countryName: string): Promise<string | null> {
  const key = countryName.trim().toLowerCase();
  if (!key) return null;
  if (countryCache.has(key)) return countryCache.get(key)!;

  const { data } = await supabase.from('countries').select('id, name').ilike('name', countryName).maybeSingle();
  if (data?.id) {
    countryCache.set(key, data.id);
    return data.id;
  }

  const { data: fallback } = await supabase.from('countries').select('id').limit(1).maybeSingle();
  return fallback?.id ?? null;
}

export async function resolveCountryName(countryId: string): Promise<string | null> {
  const { data } = await supabase.from('countries').select('name').eq('id', countryId).maybeSingle();
  return data?.name ?? null;
}

export async function resolveCountryCode(countryId: string): Promise<string> {
  const { data } = await supabase
    .from('countries')
    .select('iso_code')
    .eq('id', countryId)
    .maybeSingle();
  return (data?.iso_code ?? 'us').toLowerCase();
}

export type CountryRow = {
  id: string;
  isoCode: string;
  name: string;
  isActive: boolean;
  isFeatured: boolean;
};

/** Admin listing — RLS allows admins to see inactive countries too. */
export async function listAllCountries(): Promise<CountryRow[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('id, iso_code, name, is_active, is_featured')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id as string,
    isoCode: row.iso_code as string,
    name: row.name as string,
    isActive: row.is_active as boolean,
    isFeatured: row.is_featured as boolean,
  }));
}

export async function setCountryActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('countries').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

export async function setCountryFeatured(id: string, isFeatured: boolean): Promise<void> {
  const { error } = await supabase.from('countries').update({ is_featured: isFeatured }).eq('id', id);
  if (error) throw error;
}
