/**
 * Client environment validation.
 * Staging/production builds fail closed when secrets are missing or placeholders.
 */
function isValidApiBase(value: string): boolean {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isLocalHostUrl(value: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(value);
}

export function validateClientEnv() {
  const issues: string[] = [];
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const siteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.trim();
  const appEnv = (import.meta.env.VITE_APP_ENV as string | undefined)?.toLowerCase();
  const privileged =
    import.meta.env.PROD || appEnv === 'production' || appEnv === 'staging';

  if (!url) {
    issues.push(
      'VITE_SUPABASE_URL (set in client/.env — Supabase → Project Settings → API → Project URL)',
    );
  }
  if (!anon) {
    issues.push(
      'VITE_SUPABASE_ANON_KEY (set in client/.env — Supabase → Project Settings → API → anon public)',
    );
  }
  if (url?.includes('your-') && url.includes('project')) {
    issues.push('VITE_SUPABASE_URL still looks like a placeholder');
  }
  if (anon && /your-.*anon|your-supabase|placeholder/i.test(anon)) {
    issues.push('VITE_SUPABASE_ANON_KEY still looks like a placeholder');
  }
  if (privileged && !apiUrl) {
    issues.push('VITE_API_URL (use /api for same-origin Nginx, or https://your-domain/api)');
  } else if (apiUrl && !isValidApiBase(apiUrl)) {
    issues.push('VITE_API_URL must be an absolute http(s) URL or a path like /api');
  }
  if (privileged) {
    if (!siteUrl) {
      issues.push(
        'VITE_PUBLIC_SITE_URL (canonical HTTPS origin for auth email redirects, e.g. https://globaljobsinternational.com)',
      );
    } else if (isLocalHostUrl(siteUrl)) {
      issues.push('VITE_PUBLIC_SITE_URL must not be localhost in staging/production');
    }
  }

  if (privileged && issues.length > 0) {
    const message = `[env] Missing or invalid client variables:\n${issues.map((item) => `  - ${item}`).join('\n')}`;
    console.error(message);
    throw new Error(message);
  }

  if (privileged) {
    const allowDemo = import.meta.env.VITE_ALLOW_DEMO_ADMIN;
    if (allowDemo === 'true') {
      throw new Error('[env] VITE_ALLOW_DEMO_ADMIN must not be true in staging/production');
    }
  }

  if (!privileged && issues.length > 0) {
    console.warn('[env] Client env incomplete (auth disabled until configured):\n', issues.join('\n'));
  }

  return issues;
}
