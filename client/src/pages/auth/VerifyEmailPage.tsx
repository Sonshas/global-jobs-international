import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormAlert } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function VerifyEmailPage() {
  const { user, resendVerification, isAuthenticated, isEmailVerified, signOut } = useAuth();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const email = useMemo(() => {
    return params.get('email') || user?.email || '';
  }, [params, user?.email]);

  if (isAuthenticated && isEmailVerified) {
    return (
      <AuthLayout title="Email verified" subtitle="Your account is ready.">
        <AuthCard>
          <FormAlert variant="success">Your email is verified. Continue to your dashboard.</FormAlert>
          <Button href="/dashboard" className="mt-4 w-full rounded-2xl">
            Go to dashboard
          </Button>
        </AuthCard>
      </AuthLayout>
    );
  }

  const handleResend = async () => {
    if (!email) {
      setError('Enter the email you used during registration, then try again from the sign-up page.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setError(null);
    const result = await resendVerification(email);
    if (result.error) {
      setError(result.error);
      setStatus('error');
      return;
    }
    setStatus('sent');
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a confirmation link to activate your applicant account."
    >
      <AuthCard>
        <div className="space-y-4">
          <FormAlert variant="info">
            {email ? (
              <>
                Check <strong>{email}</strong> for a verification message from Global Jobs
                International. Open the link to continue.
              </>
            ) : (
              <>Check your inbox for a verification message, then open the link to continue.</>
            )}
          </FormAlert>

          {status === 'sent' ? (
            <FormAlert variant="success">Verification email resent. Please check your inbox.</FormAlert>
          ) : null}
          {error ? <FormAlert>{error}</FormAlert> : null}

          <Button
            type="button"
            className="w-full rounded-2xl"
            disabled={status === 'sending' || !email}
            onClick={() => void handleResend()}
          >
            {status === 'sending' ? 'Resending…' : 'Resend verification email'}
          </Button>

          <Button href="/login" variant="secondary" className="w-full rounded-2xl">
            Back to sign in
          </Button>

          {isAuthenticated ? (
            <button
              type="button"
              className="w-full text-sm font-medium text-ink-muted hover:text-ink dark:text-ink-muted-dark dark:hover:text-ink-dark"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          ) : (
            <p className="text-center text-sm text-ink-muted dark:text-ink-muted-dark">
              Used the wrong email?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand hover:underline dark:text-brand-light"
              >
                Register again
              </Link>
            </p>
          )}
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
