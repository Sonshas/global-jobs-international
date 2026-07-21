import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field, FormAlert, TextInput } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth';

export function ForgotPasswordPage() {
  const { resetPassword, isConfigured } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
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
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we’ll send a secure reset link."
    >
      <AuthCard>
        {sent ? (
          <div className="space-y-4">
            <FormAlert variant="success">
              If an account exists for <strong>{getValues('email')}</strong>, a password reset link
              is on its way. Check your inbox and spam folder.
            </FormAlert>
            <Button href="/login" className="w-full rounded-2xl">
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {!isConfigured ? (
              <FormAlert variant="info">
                Add your Supabase URL and anon key to <code>client/.env</code> to enable password
                resets.
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

            <Button type="submit" className="w-full rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-muted dark:text-ink-muted-dark">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline dark:text-brand-light">
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
