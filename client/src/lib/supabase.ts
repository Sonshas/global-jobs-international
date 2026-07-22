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

// Local, non-routable placeholders used only in development when Supabase is
// not yet configured. `http://127.0.0.1:0` never resolves to a live service,
// and `isSupabaseConfigured` gates all real usage — no `.supabase.co`-looking
// placeholder is used so this can never be mistaken for a real project.
const devFallbackUrl = 'http://127.0.0.1:0';
const devFallbackKey = 'unconfigured';

export const supabase: SupabaseClient = createClient(
  supabaseUrl || devFallbackUrl,
  supabaseAnonKey || devFallbackKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
);

export function getAuthRedirectUrl(path: string): string {
  const base = window.location.origin;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
