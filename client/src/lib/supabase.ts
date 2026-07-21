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
  console.warn(
    '[supabase] Missing or placeholder VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in client/.env to enable authentication.',
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
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
