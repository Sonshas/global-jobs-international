import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Returns a Supabase client using the service role key.
 * Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before use.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.',
    );
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}
