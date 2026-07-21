import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field, FormAlert, TextInput } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';

export function LoginPage() {
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const from =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof (location.state as { from?: unknown }).from === 'string'
      ? (location.state as { from: string }).from
      : '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await signIn(values.email, values.password);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    navigate(from.startsWith('/') ? from : '/dashboard', { replace: true });
  });

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to your applicant dashboard.">
      <AuthCard>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {!isConfigured ? (
            <FormAlert variant="info">
              Add your Supabase URL and anon key to <code>client/.env</code> to enable live
              authentication.
            </FormAlert>
          ) : null}

          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <Field id="email" label="Email" error={errors.email?.message}>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </Field>

          <Field id="password" label="Password" error={errors.password?.message}>
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
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
          New to Global Jobs International?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline dark:text-brand-light">
            Create an account
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
