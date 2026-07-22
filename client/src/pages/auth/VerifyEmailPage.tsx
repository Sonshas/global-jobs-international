import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormAlert } from '@/components/auth/FormFields';
import { RegistrationAtmosphere } from '@/components/auth/RegistrationAtmosphere';
import { RegistrationProgress } from '@/components/auth/RegistrationProgress';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { sendLifecycleEmail } from '@/data/email-automation';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const { user, resendVerification, isAuthenticated, isEmailVerified, signOut } = useAuth();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const email = useMemo(() => {
    return params.get('email') || user?.email || '';
  }, [params, user?.email]);

  const verifiedEmailSent = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !isEmailVerified || verifiedEmailSent.current) return;
    verifiedEmailSent.current = true;
    const name =
      typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '';
    if (user?.email) {
      sendLifecycleEmail('email_verified', { to: user.email, variables: { name } });
    }
  }, [isAuthenticated, isEmailVerified, user?.email, user?.user_metadata?.full_name]);

  if (isAuthenticated && isEmailVerified) {
    return (
      <VerifyShell>
        <RegistrationProgress currentStep={3} />
        <section className="rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <FormAlert variant="success" tone="glass">
            {t('auth.verified')}
          </FormAlert>
          <Button href="/dashboard" className="mt-4 w-full rounded-2xl">
            {t('auth.goToDashboard')}
          </Button>
        </section>
      </VerifyShell>
    );
  }

  const handleResend = async () => {
    if (!email) {
      setError(t('auth.verifyEmailMissing'));
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
    <VerifyShell>
      <RegistrationProgress currentStep={3} />
      <section className="rounded-[1.75rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
        <div className="space-y-4">
          <FormAlert variant="info" tone="glass">
            {email ? t('auth.verifyCheckEmail', { email }) : t('auth.verifyCheckInbox')}
          </FormAlert>

          {status === 'sent' ? (
            <FormAlert variant="success" tone="glass">
              {t('auth.verifyResent')}
            </FormAlert>
          ) : null}
          {error ? <FormAlert tone="glass">{error}</FormAlert> : null}

          <Button
            type="button"
            className="w-full rounded-2xl"
            disabled={status === 'sending' || !email}
            onClick={() => void handleResend()}
          >
            {status === 'sending' ? t('auth.resending') : t('auth.resendVerification')}
          </Button>

          <Button href="/login" variant="secondary" className="w-full rounded-2xl">
            {t('auth.backToSignIn')}
          </Button>

          {isAuthenticated ? (
            <button
              type="button"
              className="w-full text-sm font-medium text-slate-300 hover:text-white"
              onClick={() => void signOut()}
            >
              {t('nav.signOut')}
            </button>
          ) : (
            <p className="text-center text-sm text-slate-300">
              {t('auth.verifyWrongEmail')}{' '}
              <Link to="/register" className="font-semibold text-accent hover:underline">
                {t('auth.registerAgain')}
              </Link>
            </p>
          )}
        </div>
      </section>
    </VerifyShell>
  );
}

function VerifyShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen overflow-x-hidden text-white">
      <RegistrationAtmosphere />
      <div className="relative z-10">
        <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link to="/" className="font-heading text-lg font-bold tracking-tight text-white">
              Global Jobs <span className="text-accent">International</span>
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-200 transition hover:text-white"
            >
              {t('auth.signIn')}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-8 text-center sm:text-left">
            <p className="text-sm font-semibold tracking-[0.18em] text-accent uppercase">
              {t('auth.verifyEmailEyebrow')}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white">
              {t('auth.verifyTitle')}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              {t('auth.verifyActivateDesc')}
            </p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
