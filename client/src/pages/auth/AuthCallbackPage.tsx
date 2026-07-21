import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormAlert } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const completeAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        const errorDescription =
          url.searchParams.get('error_description') || url.searchParams.get('error');

        if (errorDescription) {
          throw new Error(errorDescription);
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!data.session) {
            throw new Error('No authentication session found. The link may have expired.');
          }
        }

        if (!active) return;
        navigate('/dashboard', { replace: true });
      } catch (err) {
        if (!active) return;
        setError(getAuthErrorMessage(err));
      }
    };

    void completeAuth();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <AuthLayout
      title="Confirming your email"
      subtitle="Please wait while we securely finish signing you in."
    >
      <AuthCard>
        {error ? (
          <div className="space-y-4">
            <FormAlert>{error}</FormAlert>
            <Button href="/login" className="w-full rounded-2xl">
              Go to sign in
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-ink-muted dark:text-ink-muted-dark">
            Completing verification…
          </p>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
