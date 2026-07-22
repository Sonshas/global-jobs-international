import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useIsJobSaved, useToggleSavedJobMutation } from '@/hooks/queries/useSavedJobsQueries';

type SaveJobButtonProps = {
  jobId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
};

/** Toggles a saved job for the signed-in applicant; guests are routed to login. */
export function SaveJobButton({ jobId, className = 'rounded-2xl', size = 'md' }: SaveJobButtonProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated, isEmailVerified } = useAuth();
  const { data: saved = false, isLoading } = useIsJobSaved(user?.id, jobId);
  const toggleMutation = useToggleSavedJobMutation(user?.id);

  if (!isAuthenticated || !isEmailVerified) {
    return (
      <Button
        href={`/login?redirect=${encodeURIComponent(`/jobs/${jobId}`)}`}
        variant="outline"
        size={size}
        className={className}
      >
        {t('jobs.saveJob')}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={saved ? 'secondary' : 'outline'}
      size={size}
      className={className}
      disabled={isLoading || toggleMutation.isPending}
      onClick={() => void toggleMutation.mutateAsync(jobId)}
    >
      {saved ? t('jobs.jobSaved') : t('jobs.saveJob')}
    </Button>
  );
}
