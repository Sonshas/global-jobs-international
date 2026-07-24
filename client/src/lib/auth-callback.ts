import type { EmailOtpType, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type AuthCallbackOutcome =
  | { status: 'signed_in'; session: Session; nextPath: string }
  | { status: 'confirmed_needs_login' }
  | { status: 'error'; message: string };

function authStorageKeyPrefix(): string | null {
  const raw = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!raw) return null;
  try {
    const ref = new URL(raw).hostname.split('.')[0];
    return `sb-${ref}-auth-token`;
  } catch {
    return null;
  }
}

/** True only when this browser started a PKCE auth flow (same device). */
export function hasPkceCodeVerifier(): boolean {
  if (typeof window === 'undefined') return false;
  const prefix = authStorageKeyPrefix();
  if (!prefix) return false;
  try {
    return Boolean(window.localStorage.getItem(`${prefix}-code-verifier`));
  } catch {
    return false;
  }
}

function hashParams(hash: string): URLSearchParams {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
}

function nextPathForAuthType(type: string | null | undefined): string {
  if (type === 'recovery') return '/auth/reset-password';
  return '/dashboard';
}

function isPkceVerifierError(message: string): boolean {
  return /pkce|code verifier/i.test(message);
}

/**
 * Completes email confirmation / recovery / OAuth redirect without requiring a
 * PKCE verifier on a different browser or device.
 *
 * Priority:
 * 1. token_hash + type → verifyOtp (cross-device; preferred for custom email templates)
 * 2. PKCE `code` → exchange only when a local verifier exists
 * 3. Implicit hash tokens → setSession
 * 4. Existing session from detectSessionInUrl
 */
export async function completeAuthCallbackFromUrl(
  href: string = typeof window !== 'undefined' ? window.location.href : '',
): Promise<AuthCallbackOutcome> {
  const url = new URL(href);
  const search = url.searchParams;
  const hash = hashParams(url.hash);

  const errorDescription =
    search.get('error_description') ||
    search.get('error') ||
    hash.get('error_description') ||
    hash.get('error');

  if (errorDescription) {
    return { status: 'error', message: errorDescription.replace(/\+/g, ' ') };
  }

  const tokenHash = search.get('token_hash');
  const otpType = (search.get('type') || hash.get('type')) as EmailOtpType | null;

  if (tokenHash && otpType) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    if (error) return { status: 'error', message: error.message };
    if (!data.session) return { status: 'confirmed_needs_login' };
    return {
      status: 'signed_in',
      session: data.session,
      nextPath: nextPathForAuthType(otpType),
    };
  }

  const code = search.get('code');
  if (code) {
    if (hasPkceCodeVerifier()) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        if (isPkceVerifierError(error.message)) {
          return { status: 'confirmed_needs_login' };
        }
        return { status: 'error', message: error.message };
      }
      if (data.session) {
        return {
          status: 'signed_in',
          session: data.session,
          nextPath: nextPathForAuthType(otpType),
        };
      }
    }
    // Supabase already verified the email when issuing the redirect; without a
    // local PKCE verifier we cannot create a session here — send them to login.
    return { status: 'confirmed_needs_login' };
  }

  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { status: 'error', message: error.message };
    if (data.session) {
      return {
        status: 'signed_in',
        session: data.session,
        nextPath: nextPathForAuthType(hash.get('type') || otpType),
      };
    }
  }

  const existing = await waitForExistingSession(hash.size > 0 || search.has('type'));
  if (existing) {
    return {
      status: 'signed_in',
      session: existing,
      nextPath: nextPathForAuthType(hash.get('type') || otpType),
    };
  }

  return {
    status: 'error',
    message: 'No authentication session found. The link may have expired.',
  };
}

function waitForExistingSession(allowWait: boolean): Promise<Session | null> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (session: Session | null) => {
      if (settled) return;
      settled = true;
      subscription.unsubscribe();
      window.clearTimeout(timer);
      resolve(session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish(session);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session);
      else if (!allowWait) finish(null);
    });

    const timer = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => finish(data.session));
    }, allowWait ? 2000 : 0);
  });
}

/** Strip auth params from the address bar after a successful callback. */
export function clearAuthParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const authQueryKeys = [
    'code',
    'token_hash',
    'type',
    'error',
    'error_description',
    'error_code',
  ];
  let mutated = false;
  for (const key of authQueryKeys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      mutated = true;
    }
  }
  if (url.hash) {
    url.hash = '';
    mutated = true;
  }
  if (mutated) {
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`);
  }
}
