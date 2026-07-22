import type { EmployerProfile, EmployerAccountStatus } from '@/data/employer';
import { supabase } from '@/lib/supabase';
import type { DbEmployerProfileRow, DbEmployerRow } from '@/lib/database.types';
import { employerProfileFromRows, asObject } from '@/repositories/mappers';

export async function getEmployerByOwnerUserId(userId: string): Promise<DbEmployerRow | null> {
  const { data, error } = await supabase
    .from('employers')
    .select('*')
    .eq('owner_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as DbEmployerRow | null;
}

export async function getOrCreateEmployerForUser(userId: string, companyName = 'New Employer'): Promise<DbEmployerRow> {
  const existing = await getEmployerByOwnerUserId(userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('employers')
    .insert({
      owner_user_id: userId,
      legal_name: companyName,
      status: 'pending',
      is_verified: false,
      metadata: { accountStatus: 'pending' },
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as DbEmployerRow;
}

export async function fetchEmployerProfile(userId: string): Promise<EmployerProfile | null> {
  const employer = await getEmployerByOwnerUserId(userId);
  if (!employer) return null;

  const { data: profile } = await supabase
    .from('employer_profiles')
    .select('about, logo_url, cover_image_url')
    .eq('employer_id', employer.id)
    .maybeSingle();

  return employerProfileFromRows(userId, employer, profile);
}

export async function upsertEmployerProfileRecord(
  userId: string,
  patch: Partial<Omit<EmployerProfile, 'userId' | 'createdAt'>>,
): Promise<EmployerProfile> {
  const employer = await getOrCreateEmployerForUser(userId, patch.companyName ?? 'New Employer');
  const meta = asObject(employer.metadata);
  const now = new Date().toISOString();

  const nextMeta = {
    ...meta,
    website: patch.website ?? meta.website,
    address: patch.address ?? meta.address,
    country: patch.country ?? meta.country,
    industry: patch.industry ?? meta.industry,
    employees: patch.employees ?? meta.employees,
    hiringStatus: patch.hiringStatus ?? meta.hiringStatus,
    // Account approval is an admin-only state transition; employer profile
    // edits must never be able to promote the owner through metadata.
    accountStatus: meta.accountStatus ?? 'pending',
    logoDataUrl: patch.logoDataUrl ?? meta.logoDataUrl,
    coverDataUrl: patch.coverDataUrl ?? meta.coverDataUrl,
    description: patch.description ?? meta.description,
    updatedAt: now,
    createdAt: meta.createdAt ?? now,
  };

  const { data: updatedEmployer, error: employerError } = await supabase
    .from('employers')
    .update({
      legal_name: patch.companyName ?? employer.legal_name,
      website_url: patch.website ?? employer.website_url,
      industry: patch.industry ?? employer.industry,
      company_size: patch.employees ?? employer.company_size,
      metadata: nextMeta,
    })
    .eq('id', employer.id)
    .select('*')
    .single();

  if (employerError) throw employerError;

  const { data: existingProfile } = await supabase
    .from('employer_profiles')
    .select('id')
    .eq('employer_id', employer.id)
    .maybeSingle();

  const profilePayload = {
    employer_id: employer.id,
    about: patch.description ?? (nextMeta.description as string) ?? '',
    logo_url: patch.logoDataUrl ?? null,
    cover_image_url: patch.coverDataUrl ?? null,
  };

  if (existingProfile?.id) {
    await supabase.from('employer_profiles').update(profilePayload).eq('id', existingProfile.id);
  } else {
    await supabase.from('employer_profiles').insert(profilePayload);
  }

  return employerProfileFromRows(userId, updatedEmployer as DbEmployerRow, {
    about: profilePayload.about,
    logo_url: profilePayload.logo_url,
    cover_image_url: profilePayload.cover_image_url,
  });
}

export async function setEmployerAccountStatusRecord(
  userId: string,
  accountStatus: EmployerAccountStatus,
): Promise<EmployerProfile | null> {
  const employer = await getEmployerByOwnerUserId(userId);
  if (!employer) return null;
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
  if (adminError) throw adminError;
  if (!isAdmin) throw new Error('Only administrators can change employer approval status.');

  const statusByAccountStatus: Record<EmployerAccountStatus, 'active' | 'rejected' | 'suspended' | 'pending'> = {
    approved: 'active',
    rejected: 'rejected',
    suspended: 'suspended',
    pending: 'pending',
  };
  const metadata = { ...asObject(employer.metadata), accountStatus };
  const { data: updatedEmployer, error } = await supabase
    .from('employers')
    .update({
      status: statusByAccountStatus[accountStatus],
      is_verified: accountStatus === 'approved',
      metadata,
    })
    .eq('id', employer.id)
    .select('*')
    .single();
  if (error) throw error;

  const { data: profile } = await supabase
    .from('employer_profiles')
    .select('about, logo_url, cover_image_url')
    .eq('employer_id', employer.id)
    .maybeSingle();
  return employerProfileFromRows(userId, updatedEmployer as DbEmployerRow, profile);
}

export async function listEmployerProfiles(): Promise<EmployerProfile[]> {
  const { data, error } = await supabase.from('employers').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as DbEmployerRow[];
  if (!rows.length) return [];

  // Fetch profile assets once for the page, avoiding a query per employer.
  const { data: profileData, error: profileError } = await supabase
    .from('employer_profiles')
    .select('employer_id, about, logo_url, cover_image_url')
    .in(
      'employer_id',
      rows.map((row) => row.id),
    );
  if (profileError) throw profileError;

  const profilesByEmployerId = new Map(
    ((profileData ?? []) as Pick<DbEmployerProfileRow, 'employer_id' | 'about' | 'logo_url' | 'cover_image_url'>[]).map(
      (profile) => [profile.employer_id, profile],
    ),
  );

  return rows.map((row) => employerProfileFromRows(row.owner_user_id, row, profilesByEmployerId.get(row.id) ?? null));
}
