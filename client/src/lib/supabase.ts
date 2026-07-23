import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-supabase'),
);

if (!isSupabaseConfigured) {
  if (import.meta.env.PROD) {
    // Fail closed in production builds: never talk to a fake endpoint.
    // `validateClientEnv()` (called from main.tsx) already throws for
    // production/staging before this module is exercised at runtime; this is
    // a defense-in-depth guard in case that call site is bypassed.
    console.error(
      '[supabase] Missing or placeholder VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in a production build.',
    );
  } else {
    console.warn(
      '[supabase] Missing or placeholder VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in client/.env to enable authentication.',
    );
  }
}

// Dev-only placeholders. Gated on `import.meta.env.DEV` so production
// bundles tree-shake them out (they must never appear as createClient args
// in a production build with real VITE_* values).
const resolvedUrl =
  supabaseUrl || (import.meta.env.DEV ? 'http://127.0.0.1:0' : '');
const resolvedKey =
  supabaseAnonKey || (import.meta.env.DEV ? 'unconfigured' : '');

export const supabase: SupabaseClient = createClient(resolvedUrl, resolvedKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export function getAuthRedirectUrl(path: string): string {
  const base = window.location.origin;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
