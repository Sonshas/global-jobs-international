import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field, FormAlert, TextInput } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';

export function RegisterPage() {
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const result = await signUp({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
    });

    if (result.error) {
      setFormError(result.error);
      return;
    }

    if (result.needsEmailVerification) {
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, { replace: true });
      return;
    }

    navigate('/dashboard', { replace: true });
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Global Jobs International and start your overseas career journey."
    >
      <AuthCard>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {!isConfigured ? (
            <FormAlert variant="info">
              Add your Supabase URL and anon key to <code>client/.env</code> to enable live
              authentication.
            </FormAlert>
          ) : null}

          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <Field id="fullName" label="Full name" error={errors.fullName?.message}>
            <TextInput
              id="fullName"
              type="text"
              autoComplete="name"
              hasError={Boolean(errors.fullName)}
              {...register('fullName')}
            />
          </Field>

          <Field id="email" label="Email" error={errors.email?.message}>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              hasError={Boolean(errors.email)}
              {...register('email')}
            />
          </Field>

          <Field
            id="password"
            label="Password"
            error={errors.password?.message}
            hint="At least 8 characters with letters and numbers."
          >
            <TextInput
              id="password"
              type="password"
              autoComplete="new-password"
              hasError={Boolean(errors.password)}
              {...register('password')}
            />
          </Field>

          <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword?.message}>
            <TextInput
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              hasError={Boolean(errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </Field>

          <div>
            <label className="flex items-start gap-3 text-sm text-ink dark:text-ink-dark">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
                {...register('acceptTerms')}
              />
              <span>
                I agree to the{' '}
                <a href="#terms" className="font-medium text-brand hover:underline dark:text-brand-light">
                  Terms of Use
                </a>{' '}
                and{' '}
                <a href="#privacy" className="font-medium text-brand hover:underline dark:text-brand-light">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            {errors.acceptTerms?.message ? (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.acceptTerms.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full rounded-2xl" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline dark:text-brand-light">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
