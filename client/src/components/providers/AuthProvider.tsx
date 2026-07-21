import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { getAuthRedirectUrl, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { AuthContext, type AuthContextValue, type SignUpInput } from '@/components/providers/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [session, setSession] = useState<AuthContextValue['session']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error('[auth] getSession failed:', error.message);
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: getAuthErrorMessage(new Error('invalid api key')) };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? getAuthErrorMessage(error) : null };
  }, []);

  const signUp = useCallback(async ({ email, password, fullName }: SignUpInput) => {
    if (!isSupabaseConfigured) {
      return {
        error: getAuthErrorMessage(new Error('invalid api key')),
        needsEmailVerification: false,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'applicant',
        },
        emailRedirectTo: getAuthRedirectUrl('/auth/callback'),
      },
    });

    if (error) {
      return { error: getAuthErrorMessage(error), needsEmailVerification: false };
    }

    return { error: null, needsEmailVerification: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error: error ? getAuthErrorMessage(error) : null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: getAuthErrorMessage(new Error('invalid api key')) };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl('/auth/reset-password'),
    });
    return { error: error ? getAuthErrorMessage(error) : null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? getAuthErrorMessage(error) : null };
  }, []);

  const resendVerification = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: getAuthErrorMessage(new Error('invalid api key')) };
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAuthRedirectUrl('/auth/callback'),
      },
    });
    return { error: error ? getAuthErrorMessage(error) : null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isConfigured: isSupabaseConfigured,
      isAuthenticated: Boolean(session?.user),
      isEmailVerified: Boolean(user?.email_confirmed_at),
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      resendVerification,
    }),
    [
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      resendVerification,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
