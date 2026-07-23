import { supabase } from '@/lib/supabase';

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  accountType: string;
  status: string;
  roles: string[];
  createdAt: string;
};

type UserRoleJoinRow = {
  id: string;
  email: string;
  full_name: string | null;
  account_type: string;
  status: string;
  created_at: string;
  user_roles: Array<{ is_active: boolean; roles: { slug: string } | { slug: string }[] | null }> | null;
};

/** Admin-only — RLS (`is_admin()`) allows admins/super_admins to list all users. */
export async function listAllUsers(limit = 200): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, account_type, status, created_at, user_roles(is_active, roles(slug))')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  return ((data ?? []) as unknown as UserRoleJoinRow[]).map((row) => {
    const roles = (row.user_roles ?? [])
      .filter((ur) => ur.is_active)
      .flatMap((ur) => {
        const role = ur.roles;
        if (!role) return [];
        return Array.isArray(role) ? role.map((r) => r.slug) : [role.slug];
      });
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      accountType: row.account_type,
      status: row.status,
      roles,
      createdAt: row.created_at,
    };
  });
}

export async function setUserStatus(userId: string, status: 'active' | 'suspended' | 'pending'): Promise<void> {
  const { error } = await supabase.from('users').update({ status }).eq('id', userId);
  if (error) throw error;
}

/** Role assignment must go through the server (service-role-only RPC). */
export async function assignUserRole(userId: string, roleSlug: string): Promise<void> {
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
  if (!apiBase) throw new Error('VITE_API_URL is required to assign roles.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in is required.');

  const response = await fetch(`${apiBase}/admin/users/${userId}/role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ roleSlug }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'Unable to assign role.');
  }
}

/** Permanently deletes auth + public user via server (service role). */
export async function deleteUserAccount(userId: string): Promise<void> {
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
  if (!apiBase) throw new Error('VITE_API_URL is required to delete users.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in is required.');

  const response = await fetch(`${apiBase}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'Failed to delete user.');
  }
}
