import type { DbRoleSlug } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type ResolvedRbac = {
  roleSlugs: DbRoleSlug[];
  /** Normalized platform roles used by route guards */
  platformRoles: Array<'applicant' | 'employer' | 'staff' | 'admin' | 'super_admin'>;
  permissionSlugs: string[];
  source: 'database' | 'fallback';
};

function normalizePlatformRoles(
  slugs: DbRoleSlug[],
  accountType?: string,
): ResolvedRbac['platformRoles'] {
  const set = new Set<ResolvedRbac['platformRoles'][number]>();
  for (const slug of slugs) {
    if (slug === 'super_admin') set.add('super_admin');
    if (slug === 'admin') set.add('admin');
    if (slug === 'employer') set.add('employer');
    if (slug === 'applicant') set.add('applicant');
    if (slug === 'advisor') set.add('staff');
  }
  if (accountType === 'employer') set.add('employer');
  if (accountType === 'admin') set.add('admin');
  if (!set.size) set.add('applicant');
  return [...set];
}

/**
 * Resolves roles from Postgres (user_roles + admin_users + users.account_type).
 * Elevated privileges must come from the database — not JWT metadata alone.
 */
export async function fetchUserRbac(userId: string): Promise<ResolvedRbac> {
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', userId)
    .maybeSingle();

  const { data: roleRows, error: rolesError } = await supabase
    .from('user_roles')
    .select('roles ( slug )')
    .eq('user_id', userId)
    .eq('is_active', true);

  const roleSlugs = (roleRows ?? [])
    .map((row) => {
      const roles = row.roles as { slug?: string } | { slug?: string }[] | null;
      if (Array.isArray(roles)) return roles[0]?.slug;
      return roles?.slug;
    })
    .filter((slug): slug is DbRoleSlug => Boolean(slug)) as DbRoleSlug[];

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (adminRow && !roleSlugs.includes('admin') && !roleSlugs.includes('super_admin')) {
    roleSlugs.push('admin');
  }

  const permissionSlugs: string[] = [];
  const checks = [
    'applications.read',
    'applications.manage',
    'jobs.manage',
    'employers.manage',
    'users.manage',
    'applicants.read',
    'settings.manage',
  ] as const;

  await Promise.all(
    checks.map(async (slug) => {
      const { data: allowed } = await supabase.rpc('has_permission', { permission_slug: slug });
      if (allowed === true) permissionSlugs.push(slug);
    }),
  );

  // Probe staff helper when migration 13+ is applied (ignore if missing)
  let isStaff = false;
  try {
    const { data } = await supabase.rpc('is_staff');
    isStaff = data === true;
  } catch {
    isStaff = false;
  }

  const dbReachable = !userError && !rolesError;
  const platformRoles = normalizePlatformRoles(roleSlugs, userRow?.account_type);

  if (
    isStaff &&
    !platformRoles.includes('staff') &&
    !platformRoles.includes('admin') &&
    !platformRoles.includes('super_admin')
  ) {
    platformRoles.push('staff');
  }

  return {
    roleSlugs,
    platformRoles,
    permissionSlugs,
    source: dbReachable ? 'database' : 'fallback',
  };
}
