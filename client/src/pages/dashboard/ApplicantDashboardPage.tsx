import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function ApplicantDashboardPage() {
  const { user, signOut } = useAuth();
  const fullName =
    typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : user?.email?.split('@')[0] || 'Applicant';

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-40 border-b border-border bg-[var(--nav-bg)] backdrop-blur-md dark:border-border-dark">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link
            to="/"
            className="font-heading text-lg font-bold tracking-tight text-brand dark:text-brand-light"
          >
            Global Jobs International
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button type="button" variant="secondary" size="sm" onClick={() => void handleSignOut()}>
              Sign out
            </Button>
          </div>
        </Container>
      </header>

      <main>
        <Container className="py-10 sm:py-14">
          <div className="mb-8">
            <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
              Applicant dashboard
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-ink sm:text-4xl dark:text-ink-dark">
              Welcome, {fullName}
            </h1>
            <p className="mt-2 max-w-2xl text-ink-muted dark:text-ink-muted-dark">
              Your account is connected to Supabase Auth. Track applications, profile progress, and
              next steps from this workspace.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <section className="rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
              <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                Account
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">Email</dt>
                  <dd className="font-medium break-all">{user?.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">Status</dt>
                  <dd className="font-medium text-emerald-600 dark:text-emerald-400">Verified</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">Role</dt>
                  <dd className="font-medium">Applicant</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
              <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                Profile completion
              </h2>
              <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                Complete your profile to unlock stronger job matches.
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full w-1/4 rounded-full bg-brand" />
              </div>
              <p className="mt-2 text-xs font-medium text-ink-muted dark:text-ink-muted-dark">
                25% complete
              </p>
              <Button href="/#search" variant="outline" className="mt-5 w-full rounded-2xl">
                Continue profile
              </Button>
            </section>

            <section className="rounded-3xl border border-border bg-white p-6 dark:border-border-dark dark:bg-surface-elevated-dark">
              <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                Recommended next steps
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-muted dark:text-ink-muted-dark">
                <li>1. Upload your CV and certificates</li>
                <li>2. Choose preferred destination countries</li>
                <li>3. Browse featured international openings</li>
              </ul>
              <Button href="/#jobs" className="mt-5 w-full rounded-2xl">
                Explore jobs
              </Button>
            </section>
          </div>
        </Container>
      </main>
    </div>
  );
}
