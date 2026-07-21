import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCard } from '@/components/auth/AuthCard';
import { Field, FormAlert, TextInput } from '@/components/auth/FormFields';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth';
import { supabase } from '@/lib/supabase';

export function ResetPasswordPage() {
  const { updatePassword, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const prepare = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session || isAuthenticated) {
        setReady(true);
        return;
      }

      setLinkError(
        'This reset link is invalid or has expired. Request a new password reset email.',
      );
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
  }, [isAuthenticated]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
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
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account.">
      <AuthCard>
        {!ready ? (
          <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Validating reset link…</p>
        ) : linkError ? (
          <div className="space-y-4">
            <FormAlert>{linkError}</FormAlert>
            <Button href="/forgot-password" className="w-full rounded-2xl">
              Request a new link
            </Button>
          </div>
        ) : success ? (
          <FormAlert variant="success">Password updated. Redirecting to your dashboard…</FormAlert>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {formError ? <FormAlert>{formError}</FormAlert> : null}

            <Field id="password" label="New password" error={errors.password?.message}>
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
              label="Confirm new password"
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
              {isSubmitting ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
