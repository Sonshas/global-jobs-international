import { supabase } from '@/lib/supabase';

export type PlatformPublicStats = {
  publishedJobs: number;
  verifiedEmployers: number;
  countriesWithJobs: number;
};

async function countRows(table: 'jobs' | 'employers', filters: Record<string, unknown>): Promise<number> {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

async function countCountriesWithPublishedJobs(): Promise<number> {
  const { data, error } = await supabase
    .from('jobs')
    .select('country_id')
    .eq('status', 'published');
  if (error || !data) return 0;
  return new Set(data.map((row) => row.country_id)).size;
}

/**
 * Live, non-inflated platform stats sourced directly from the database.
 * Used on the public homepage instead of hardcoded/sample-inflated numbers.
 */
export async function fetchPlatformPublicStats(): Promise<PlatformPublicStats> {
  const [publishedJobs, verifiedEmployers, countriesWithJobs] = await Promise.all([
    countRows('jobs', { status: 'published' }),
    countRows('employers', { is_verified: true, status: 'active' }),
    countCountriesWithPublishedJobs(),
  ]);

  return { publishedJobs, verifiedEmployers, countriesWithJobs };
}

export type VerifiedEmployerSummary = {
  id: string;
  name: string;
  industry: string;
  country: string;
  logo: string;
  logoColor: string;
  openings: number;
};

/** Live verified + active employers for the public "Verified Employers" section. */
export async function fetchVerifiedEmployers(limit = 8): Promise<VerifiedEmployerSummary[]> {
  const { data, error } = await supabase
    .from('employers')
    .select('id, legal_name, trading_name, industry, metadata')
    .eq('is_verified', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data || data.length === 0) return [];

  const employerIds = data.map((row) => row.id as string);
  const { data: jobCounts } = await supabase
    .from('jobs')
    .select('employer_id')
    .eq('status', 'published')
    .in('employer_id', employerIds);

  const openingsByEmployer = new Map<string, number>();
  for (const row of jobCounts ?? []) {
    const id = row.employer_id as string;
    openingsByEmployer.set(id, (openingsByEmployer.get(id) ?? 0) + 1);
  }

  return data.map((row) => {
    const name = (row.trading_name as string | null) ?? (row.legal_name as string);
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    const initials = name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
    return {
      id: row.id as string,
      name,
      industry: (row.industry as string | null) ?? 'International Recruitment',
      country: (metadata.country as string | undefined) ?? 'International',
      logo: initials || 'GJ',
      logoColor: '#0052CC',
      openings: openingsByEmployer.get(row.id as string) ?? 0,
    };
  });
}
