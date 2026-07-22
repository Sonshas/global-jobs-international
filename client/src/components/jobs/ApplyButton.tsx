import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

type ApplyButtonProps = {
  jobId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children?: ReactNode;
};

/** Routes guests to login (return to apply), authenticated users to the apply wizard. */
export function ApplyButton({
  jobId,
  className = 'rounded-2xl',
  variant = 'primary',
  size = 'md',
  children,
}: ApplyButtonProps) {
  const { t } = useTranslation();
  const { isAuthenticated, isEmailVerified, loading } = useAuth();
  const applyPath = `/apply/${jobId}`;
  const label = children ?? t('common.applyNow');

  if (loading) {
    return (
      <Button className={className} variant={variant} size={size} disabled>
        {t('app.loading')}
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        href={`/login?redirect=${encodeURIComponent(applyPath)}`}
        className={className}
        variant={variant}
        size={size}
      >
        {label}
      </Button>
    );
  }

  if (!isEmailVerified) {
    return (
      <Button href="/verify-email" className={className} variant={variant} size={size}>
        {t('apply.verifyEmailToApply')}
      </Button>
    );
  }

  return (
    <Button href={applyPath} className={className} variant={variant} size={size}>
      {label}
    </Button>
  );
}
