import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field, FormAlert, TextInput } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { createLoginSchema, type LoginFormValues } from '@/schemas/auth';

function safeRedirect(path: string | null | undefined, fallback = '/dashboard') {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback;
  return path;
}

export function LoginPage() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(`${t('auth.loginTitle')} | ${t('app.name')}`);
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const schema = useMemo(() => createLoginSchema(), [i18n.language]);

  const fromState =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : null;

  const from = safeRedirect(params.get('redirect') || fromState);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await signIn(values.email, values.password);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    navigate(from, { replace: true });
  });

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <AuthCard>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {!isConfigured ? (
            <FormAlert variant="info">{t('auth.supabaseMissing')}</FormAlert>
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

          <Field id="password" label={t('common.password')} error={errors.password?.message}>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              hasError={Boolean(errors.password)}
              {...register('password')}
            />
          </Field>

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand hover:underline dark:text-brand-light"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button type="submit" className="w-full rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline dark:text-brand-light">
            {t('auth.createAccount')}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
          <Link
            to="/register/employer"
            className="font-semibold text-brand hover:underline dark:text-brand-light"
          >
            {t('auth.registerAsEmployer')}
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
