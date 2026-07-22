import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { getCountryPage } from '@/data/country-pages';
import { getJobsByCountry } from '@/data/jobs-catalog';

export function CountryDetailPage() {
  const { t } = useTranslation();
  const { countrySlug: slugParam } = useParams();
  const country = slugParam ? getCountryPage(slugParam) : null;
  if (!country) return <Navigate to="/countries" replace />;

  const jobs = getJobsByCountry(country.name)
    .filter((job) => job.status === 'Open')
    .slice(0, 8);

  const statCards = [
    [t('countries.averageSalary'), country.averageSalary],
    [t('jobs.currency'), country.currency],
    [t('countries.processingTime'), country.processingTime],
    [t('countries.costOfLiving'), country.costOfLiving],
  ] as const;

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-[var(--bg)]">
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#020617_0%,#0B1F44_50%,#102A56_100%)] py-14 text-white">
          <div className="hero-aurora pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <Container className="relative">
            <Link to="/countries" className="text-sm font-semibold text-accent hover:underline">
              {t('countries.allCountries')}
            </Link>
            <div className="mt-6 flex flex-wrap items-end gap-5">
              <img
                src={country.flagUrl}
                alt={t('countries.flagAlt', { country: country.name })}
                width={72}
                height={48}
                decoding="async"
                className="rounded-xl border border-white/20 shadow-lg"
                loading="eager"
              />
              <div>
                <h1 className="font-heading text-4xl font-bold sm:text-5xl">{country.name}</h1>
                <p className="mt-2 text-slate-300">
                  {t('countries.openRolesCurrency', {
                    count: country.openJobsCount,
                    currency: country.currency,
                  })}{' '}
                  · {country.applicationSeason}
                </p>
              </div>
            </div>
          </Container>
        </section>

        <Container className="py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-8">
              <section className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
                <h2 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                  {t('countries.overview')}
                </h2>
                <p className="mt-3 text-ink-muted dark:text-ink-muted-dark">{country.description}</p>
                <div className="mt-5 overflow-hidden rounded-2xl border border-border/60 dark:border-border-dark">
                  <img
                    src={`https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1200&q=60`}
                    alt={t('countries.mapAlt', { country: country.name })}
                    loading="lazy"
                    decoding="async"
                    className="h-48 w-full object-cover sm:h-64"
                  />
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                {statCards.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-border/70 bg-white/85 p-5 dark:border-border-dark dark:bg-slate-900/55"
                  >
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      {label}
                    </p>
                    <p className="mt-2 font-heading text-lg font-bold text-ink dark:text-ink-dark">
                      {value}
                    </p>
                  </div>
                ))}
              </section>

              <section className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
                <h2 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                  {t('countries.visaInformation')}
                </h2>
                <p className="mt-3 text-ink-muted dark:text-ink-muted-dark">
                  {country.visaInformation}
                </p>
                <h3 className="mt-6 font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {t('countries.workPermit')}
                </h3>
                <p className="mt-2 text-ink-muted dark:text-ink-muted-dark">
                  {country.workPermitInformation}
                </p>
              </section>

              <section className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
                <h2 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                  {t('countries.openJobsIn', { country: country.name })}
                </h2>
                <ul className="mt-4 space-y-3">
                  {jobs.map((job) => (
                    <li
                      key={job.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 dark:border-border-dark"
                    >
                      <div>
                        <p className="font-semibold text-ink dark:text-ink-dark">{job.title}</p>
                        <p className="text-xs text-ink-muted">
                          {job.city} · {job.salaryLabel}
                        </p>
                      </div>
                      <Button href={`/jobs/${job.id}`} size="sm" className="rounded-xl">
                        {t('common.view')}
                      </Button>
                    </li>
                  ))}
                </ul>
                <Button
                  href={`/jobs?country=${encodeURIComponent(country.name)}`}
                  variant="outline"
                  className="mt-4 rounded-2xl"
                >
                  {t('countries.viewAllJobs', { country: country.name })}
                </Button>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
                <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {t('countries.popularCities')}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {country.popularCities.map((city) => (
                    <li key={city}>• {city}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
                <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {t('countries.featuredEmployers')}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {country.featuredEmployers.map((employer) => (
                    <li key={employer}>• {employer}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
                <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {t('countries.requiredDocuments')}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {country.requiredDocuments.map((doc) => (
                    <li key={doc}>• {doc}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
                <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {t('countries.popularJobs')}
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {country.popularJobs.map((job) => (
                    <li key={job}>• {job}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/55">
                <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {t('countries.applicationSeason')}
                </h2>
                <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {country.applicationSeason}
                </p>
                <Button href="/register" className="mt-4 w-full rounded-2xl">
                  {t('countries.startApplication')}
                </Button>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
