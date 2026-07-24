import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { FormAlert } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import {
  clearAuthParamsFromUrl,
  completeAuthCallbackFromUrl,
} from '@/lib/auth-callback';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let active = true;

    const completeAuth = async () => {
      try {
        const outcome = await completeAuthCallbackFromUrl();
        if (!active) return;

        if (outcome.status === 'signed_in') {
          clearAuthParamsFromUrl();
          navigate(outcome.nextPath, { replace: true });
          return;
        }

        if (outcome.status === 'confirmed_needs_login') {
          clearAuthParamsFromUrl();
          setNeedsLogin(true);
          return;
        }

        setError(getAuthErrorMessage(new Error(outcome.message)));
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
    <AuthLayout title={t('auth.callbackTitle')} subtitle={t('auth.callbackSubtitle')}>
      <AuthCard>
        {needsLogin ? (
          <div className="space-y-4">
            <FormAlert variant="success">{t('auth.emailConfirmedSignIn')}</FormAlert>
            <Button href="/login" className="w-full rounded-2xl">
              {t('auth.goToSignIn')}
            </Button>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <FormAlert>{error}</FormAlert>
            <Button href="/login" className="w-full rounded-2xl">
              {t('auth.goToSignIn')}
            </Button>
            <p className="text-center text-sm text-ink-muted dark:text-ink-muted-dark">
              <Link to="/verify-email" className="underline underline-offset-2">
                {t('auth.resendVerification')}
              </Link>
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-ink-muted dark:text-ink-muted-dark">
            {t('auth.completingVerification')}
          </p>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
