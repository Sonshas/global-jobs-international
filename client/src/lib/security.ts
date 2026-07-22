import type { User } from '@supabase/supabase-js';
import type { ResolvedRbac } from '@/repositories/rbac.repository';

export type PlatformRole = 'applicant' | 'employer' | 'staff' | 'admin' | 'super_admin';

/** @deprecated Use ResolvedRbac.platformRoles */
export type UserRole = 'applicant' | 'employer' | 'admin';

const rateBuckets = new Map<string, { count: number; reset: number }>();

function appEnv(): string {
  return (
    (import.meta.env.VITE_APP_ENV as string | undefined) ||
    (import.meta.env.MODE as string | undefined) ||
    'development'
  ).toLowerCase();
}

/** Production and staging never allow demo privilege escalation. */
export function isPrivilegedEnv(): boolean {
  if (import.meta.env.PROD) return true;
  const env = appEnv();
  return env === 'production' || env === 'staging';
}

/**
 * Strict RBAC is the default for staging/production.
 * Local development may opt out with VITE_STRICT_RBAC=false AND VITE_ALLOW_DEMO_ADMIN=true.
 */
export function isStrictRbac(): boolean {
  if (isPrivilegedEnv()) return true;
  return import.meta.env.VITE_STRICT_RBAC !== 'false';
}

/** Demo admin is opt-in and never available outside local development. */
function demoAdminAllowed(): boolean {
  if (isPrivilegedEnv()) return false;
  if (isStrictRbac()) return false;
  return import.meta.env.VITE_ALLOW_DEMO_ADMIN === 'true';
}

function rolesFromMetadata(user: User | null): PlatformRole[] {
  if (!user) return ['applicant'];
  const meta = user.user_metadata || {};
  const raw =
    (typeof meta.role === 'string' && meta.role) ||
    (typeof meta.account_type === 'string' && meta.account_type) ||
    'applicant';
  if (raw === 'super_admin') return ['super_admin'];
  if (raw === 'admin') return ['admin'];
  if (raw === 'employer') return ['employer'];
  if (raw === 'advisor' || raw === 'staff') return ['staff'];
  return ['applicant'];
}

/**
 * Prefer DB-resolved roles. In strict mode, elevated roles from user_metadata alone
 * are ignored — they must come from public.user_roles / admin_users.
 */
export function getPlatformRoles(user: User | null, rbac?: ResolvedRbac | null): PlatformRole[] {
  if (rbac?.platformRoles?.length) {
    return rbac.platformRoles;
  }

  const metaRoles = rolesFromMetadata(user);
  if (!isStrictRbac()) return metaRoles;

  // Strict: only applicant/employer from metadata until DB roles load.
  return metaRoles.filter((role) => role === 'applicant' || role === 'employer');
}

/** @deprecated Use getPlatformRoles */
export function getUserRole(user: User | null): UserRole {
  const roles = getPlatformRoles(user);
  if (roles.includes('admin') || roles.includes('super_admin')) return 'admin';
  if (roles.includes('employer')) return 'employer';
  return 'applicant';
}

/** Staff pipeline (applications, documents) — advisor + admins. */
export function canAccessStaff(user: User | null, rbac?: ResolvedRbac | null): boolean {
  if (!user) return false;
  const roles = getPlatformRoles(user, rbac);
  if (roles.includes('staff') || roles.includes('admin') || roles.includes('super_admin')) {
    return true;
  }
  return Boolean(
    rbac?.permissionSlugs.includes('applications.manage') ||
      rbac?.permissionSlugs.includes('applications.read'),
  );
}

/**
 * Operational admin area (/admin/applications, jobs, employers, reports).
 * Staff may access pipeline pages; super_admin and admin always may.
 */
export function canAccessAdmin(user: User | null, rbac?: ResolvedRbac | null): boolean {
  if (!user) return false;
  if (canAccessStaff(user, rbac)) return true;
  return demoAdminAllowed();
}

/** Super Admin control plane only (/admin, /admin/super). */
export function canAccessSuperAdmin(user: User | null, rbac?: ResolvedRbac | null): boolean {
  if (!user) return false;
  const roles = getPlatformRoles(user, rbac);
  if (roles.includes('super_admin')) return true;
  // Operational admins (not staff-only) may open super dashboard for V1
  if (roles.includes('admin')) return true;
  return demoAdminAllowed();
}

export function canAccessEmployer(user: User | null, rbac?: ResolvedRbac | null): boolean {
  if (!user) return false;
  const roles = getPlatformRoles(user, rbac);
  if (roles.includes('super_admin') || roles.includes('admin')) return true;
  return roles.includes('employer');
}

export function canAccessApplicant(user: User | null): boolean {
  return Boolean(user);
}

export type AuditEntry = {
  id: string;
  at: string;
  actorUserId?: string;
  action: string;
  detail?: string;
};

/** Server-backed audit trail. No localStorage — `activity_logs` is the source of truth. */
export function logAudit(entry: Omit<AuditEntry, 'id' | 'at'>) {
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;
  if (!apiBase || !entry.action) return;

  void (async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      await fetch(`${apiBase.replace(/\/$/, '')}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: entry.action,
          detail: entry.detail,
        }),
      });
    } catch {
      // best-effort
    }
  })();
}

export type AuditLogRow = {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/** Admin-only: fetches recent activity log entries from the server (GET /api/audit). */
export async function listAuditLog(limit = 100): Promise<AuditLogRow[]> {
  const apiBase = import.meta.env.VITE_API_URL as string | undefined;
  if (!apiBase) return [];
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return [];
    const response = await fetch(`${apiBase.replace(/\/$/, '')}/audit?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    const json = (await response.json()) as { entries?: AuditLogRow[] };
    return json.entries ?? [];
  } catch {
    return [];
  }
}

/** Client-side throttle for sensitive actions (in-memory only; server enforces real limits). */
export function checkRateLimit(bucket: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const current = rateBuckets.get(bucket);
  if (!current || now > current.reset) {
    rateBuckets.set(bucket, { count: 1, reset: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  rateBuckets.set(bucket, current);
  return true;
}

const ALLOWED_UPLOAD_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function validateSecureUpload(file: File): string | null {
  if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
    return 'File type not allowed. Use PDF, JPG, PNG, or Word documents.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'File is too large (max 8 MB).';
  }
  if (/\.(exe|js|sh|bat|cmd|php)$/i.test(file.name)) {
    return 'This file extension is not permitted.';
  }
  return null;
}
