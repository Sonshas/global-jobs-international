import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ApplyButton } from '@/components/jobs/ApplyButton';
import { SaveJobButton } from '@/components/jobs/SaveJobButton';
import { jobCatalogStats } from '@/data/jobs-catalog';
import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useJobSearch } from '@/hooks/queries/useJobsQueries';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function JobsBrowsePage() {
  const { t } = useTranslation();
  useDocumentTitle(`${t('jobs.internationalOpenings')} | ${t('app.name')}`);
  const [params] = useSearchParams();
  const country = params.get('country') || undefined;
  const q = params.get('q') || undefined;
  const category = params.get('category') || undefined;
  const experience = params.get('experience') || undefined;
  const salaryMinRaw = params.get('salaryMin');
  const salaryMin = salaryMinRaw ? Number(salaryMinRaw) : undefined;

  const searchFilters = useMemo(
    () => ({
      country,
      title: q,
      category,
      experience,
      salaryMin: Number.isFinite(salaryMin) ? salaryMin : undefined,
    }),
    [country, q, category, experience, salaryMin],
  );
  const { data: searchResults = [], isLoading } = useJobSearch(searchFilters);
  const results = useMemo(
    () => searchResults.filter((job) => job.status === 'Open'),
    [searchResults],
  );

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-[var(--bg)] py-10 sm:py-14">
        <Container>
          <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
            {t('jobs.jobSearch')}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-ink sm:text-4xl dark:text-ink-dark">
            {t('jobs.internationalOpenings')}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-muted dark:text-ink-muted-dark">
            {t('jobs.catalogSummary', {
              count: results.length.toLocaleString(),
              total: jobCatalogStats.totalJobs.toLocaleString(),
              countries: jobCatalogStats.totalCountries,
            })}
          </p>

          {isLoading ? (
            <p className="mt-8 text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.slice(0, 60).map((job) => (
              <article
                key={job.id}
                className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
              >
                <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {job.title}
                </h2>
                <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {job.employer} · {job.city}, {job.country}
                </p>
                <p className="mt-3 text-sm font-semibold text-brand dark:text-brand-light">
                  {job.salaryLabel}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button href={`/jobs/${job.id}`} variant="outline" className="flex-1 rounded-2xl">
                    {t('common.details')}
                  </Button>
                  <ApplyButton jobId={job.id} className="flex-1 rounded-2xl">
                    {t('common.apply')}
                  </ApplyButton>
                </div>
                <SaveJobButton jobId={job.id} size="sm" className="mt-2 w-full rounded-2xl" />
              </article>
            ))}
          </div>

          {results.length === 0 ? (
            <p className="mt-8 text-ink-muted dark:text-ink-muted-dark">
              {t('jobs.noFilterMatches')}{' '}
              <Link to="/jobs" className="font-semibold text-brand hover:underline">
                {t('jobs.clearSearch')}
              </Link>
            </p>
          ) : null}

          {results.length > 60 ? (
            <p className="mt-6 text-sm text-ink-muted dark:text-ink-muted-dark">
              {t('jobs.showingLimited', { total: results.length.toLocaleString() })}
            </p>
          ) : null}
        </Container>
      </main>
      <Footer />
    </>
  );
}
