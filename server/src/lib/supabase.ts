import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let supabaseAdmin: SupabaseClient | null = null;

function isUsableServiceRoleKey(value: string | undefined): value is string {
  return Boolean(value)
    && !/your-project|your-supabase|placeholder|service-role-key/i.test(value ?? '');
}

export function getSupabaseUserClient(accessToken: string): SupabaseClient {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL and anon key must be configured.');
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Returns a service-role client only when a real service key is configured.
 * Development and JWT-authorized routes must work when this is null.
 */
export function tryGetSupabaseAdmin(): SupabaseClient | null {
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !isUsableServiceRoleKey(serviceRoleKey)) {
    return null;
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(env.SUPABASE_URL, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseAdmin;
}

/**
 * Returns a Supabase client using the service role key.
 * Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before use.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const client = tryGetSupabaseAdmin();
  if (!client) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.',
    );
  }
  return client;
}
