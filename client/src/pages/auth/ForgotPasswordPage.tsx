import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field, FormAlert, TextInput } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { createForgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth';

export function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const { resetPassword, isConfigured } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const schema = useMemo(() => createForgotPasswordSchema(), [i18n.language]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await resetPassword(values.email);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setSent(true);
  });

  return (
    <AuthLayout title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')}>
      <AuthCard>
        {sent ? (
          <div className="space-y-4">
            <FormAlert variant="success">
              {t('auth.forgotSuccess', { email: getValues('email') })}
            </FormAlert>
            <Button href="/login" className="w-full rounded-2xl">
              {t('auth.backToSignIn')}
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {!isConfigured ? (
              <FormAlert variant="info">{t('auth.forgotSupabaseMissing')}</FormAlert>
            ) : null}

            {formError ? <FormAlert>{formError}</FormAlert> : null}

            <Field id="email" label={t('common.email')} error={errors.email?.message}>
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                hasError={Boolean(errors.email)}
                {...register('email')}
              />
            </Field>

            <Button type="submit" className="w-full rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? t('auth.sending') : t('auth.sendResetLink')}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
          {t('auth.rememberedPassword')}{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline dark:text-brand-light">
            {t('auth.signIn')}
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
