import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field, FormAlert, TextInput } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { createResetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const { updatePassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const schema = useMemo(() => createResetPasswordSchema(), [i18n.language]);

  useEffect(() => {
    let mounted = true;

    const prepare = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session || isAuthenticated) {
        setReady(true);
        return;
      }

      setLinkError(t('auth.resetLinkInvalid'));
      setReady(true);
    };

    void prepare();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setLinkError(null);
        setReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isAuthenticated, t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await updatePassword(values.password);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setSuccess(true);
    window.setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
  });

  return (
    <AuthLayout title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
      <AuthCard>
        {!ready ? (
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{t('auth.validatingResetLink')}</p>
        ) : linkError ? (
          <div className="space-y-4">
            <FormAlert>{linkError}</FormAlert>
            <Button href="/forgot-password" className="w-full rounded-2xl">
              {t('auth.requestNewLink')}
            </Button>
          </div>
        ) : success ? (
          <FormAlert variant="success">{t('auth.passwordUpdatedRedirect')}</FormAlert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {formError ? <FormAlert>{formError}</FormAlert> : null}

            <Field id="password" label={t('auth.newPassword')} error={errors.password?.message}>
              <TextInput
                id="password"
                type="password"
                autoComplete="new-password"
                hasError={Boolean(errors.password)}
                {...register('password')}
              />
            </Field>

            <Field
              id="confirmPassword"
              label={t('auth.confirmNewPassword')}
              error={errors.confirmPassword?.message}
            >
              <TextInput
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                hasError={Boolean(errors.confirmPassword)}
                {...register('confirmPassword')}
              />
            </Field>

            <Button type="submit" className="w-full rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? t('auth.updating') : t('auth.updatePassword')}
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
