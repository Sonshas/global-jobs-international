import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ApplyButton } from '@/components/jobs/ApplyButton';
import { SaveJobButton } from '@/components/jobs/SaveJobButton';
import { useResolvedJob } from '@/hooks/queries/useJobsQueries';
import { useApplicationCountForJob } from '@/hooks/queries/useApplicationsQueries';
import { countrySlug } from '@/data/country-pages';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function JobDetailPage() {
  const { t } = useTranslation();
  const { jobId } = useParams();
  const { data: job, isLoading } = useResolvedJob(jobId, true);
  useDocumentTitle(job ? `${job.title} | ${t('app.name')}` : t('app.name'));
  const { data: applicantCount = 0 } = useApplicationCountForJob(job?.id ?? jobId);

  const benefitPool = job ? [...job.benefits] : [];
  const meals = benefitPool.some((b) => /meal|food/i.test(b)) || Boolean(job?.accommodation);
  const transport = benefitPool.some((b) => /transport|shuttle/i.test(b));
  const overtime =
    job && (/overtime|OT/i.test(job.description) || job.category === 'Manufacturing');
  const language =
    job && (job.country === 'Japan' || job.country === 'South Korea')
      ? t('jobs.languageEnglishPreferred')
      : t('jobs.languageEnglishWorking');
  const education =
    job && /nurse|teacher|engineer|accountant/i.test(job.title)
      ? t('jobs.educationDiploma')
      : t('jobs.educationHighSchool');

  const detailRows = useMemo(() => {
    if (!job) return [];
    const yesNo = (value: boolean) => (value ? t('common.yes') : t('common.no'));
    const included = (value: boolean) => (value ? t('jobs.included') : t('jobs.notIncluded'));
    return [
      [t('common.country'), job.country],
      [t('common.city'), job.city],
      [t('common.salary'), job.salaryLabel],
      [t('jobs.currency'), job.currency],
      [t('jobs.contractLength'), job.contractDuration],
      [t('jobs.workingHours'), job.workingHours],
      [t('jobs.experience'), job.experience],
      [t('jobs.education'), education],
      [t('jobs.language'), language],
      [t('jobs.vacancies'), String(job.vacancies)],
      [t('jobs.applicants'), String(applicantCount)],
      [t('jobs.closingDate'), job.applicationDeadline],
      [t('jobs.accommodation'), included(job.accommodation)],
      [t('jobs.meals'), meals ? t('jobs.mealsAvailable') : t('jobs.mealsNotSpecified')],
      [t('jobs.transport'), transport ? t('jobs.transportProvided') : t('jobs.notIncluded')],
      [t('jobs.medicalInsurance'), included(job.medicalInsurance)],
      [t('jobs.visaSponsorship'), yesNo(job.visaSponsorship)],
      [
        t('jobs.overtime'),
        overtime ? t('jobs.overtimeAvailable') : t('jobs.overtimeRoleDependent'),
      ],
    ] as const;
  }, [job, applicantCount, education, language, meals, transport, overtime, t]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main id="main-content" className="min-h-screen bg-[var(--bg)] py-16">
          <Container>
            <p className="text-ink-muted dark:text-ink-muted-dark">{t('common.loading')}</p>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  if (!job) {
    return <Navigate to="/jobs" replace />;
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-[var(--bg)]">
        <section
          className="relative overflow-hidden border-b border-border/60 bg-[linear-gradient(120deg,#0B1F44_0%,#0052CC_55%,#0F766E_100%)] py-16 text-white dark:border-border-dark"
          aria-label="Company banner"
        >
          <div className="hero-aurora pointer-events-none absolute inset-0 opacity-35" aria-hidden />
          <Container className="relative">
            <Link to="/jobs" className="text-sm font-semibold text-accent hover:underline">
              {t('jobs.backToJobs')}
            </Link>
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                  {job.category} · {job.status}
                </p>
                <h1 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">{job.title}</h1>
                <p className="mt-3 text-lg text-slate-200">
                  {job.employer} · {job.city}, {job.country}
                </p>
              </div>
              <div
                className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 font-heading text-2xl font-bold backdrop-blur-md"
                style={{ boxShadow: `0 0 0 4px ${job.logoColor}33` }}
                aria-hidden
              >
                {job.logo}
              </div>
            </div>
          </Container>
        </section>

        <Container className="max-w-5xl py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <section className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/60">
                <h2 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                  {t('jobs.employerProfile')}
                </h2>
                <p className="mt-3 text-ink-muted dark:text-ink-muted-dark">
                  {t('jobs.employerProfileDesc', {
                    employer: job.employer,
                    category: job.category.toLowerCase(),
                    country: job.country,
                  })}
                </p>
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  {detailRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-border/60 bg-slate-50 px-4 py-3 dark:border-border-dark dark:bg-slate-950/40"
                    >
                      <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        {label}
                      </dt>
                      <dd className="mt-1 font-semibold text-ink dark:text-ink-dark">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/60">
                <h2 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                  {t('jobs.roleOverview')}
                </h2>
                <p className="mt-3 text-ink-muted dark:text-ink-muted-dark">{job.description}</p>
              </section>

              <section className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/60">
                  <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                    {t('jobs.benefits')}
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                    {job.benefits.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 dark:border-border-dark dark:bg-slate-900/60">
                  <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                    {t('jobs.requirements')}
                  </h2>
                  <ul className="mt-3 space-y-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                    {job.requirements.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[1.75rem] border border-border/70 bg-white/90 p-6 shadow-lg backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/70">
                <p className="text-xs font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
                  {t('jobs.readyToApply')}
                </p>
                <p className="mt-2 font-heading text-2xl font-bold text-ink dark:text-ink-dark">
                  {job.salaryLabel}
                </p>
                <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {t('jobs.closesVacancies', {
                    date: job.applicationDeadline,
                    count: job.vacancies,
                  })}
                </p>
                <ApplyButton jobId={job.id} size="lg" className="mt-5 w-full rounded-2xl" />
                <SaveJobButton jobId={job.id} size="lg" className="mt-3 w-full rounded-2xl" />
                <Button
                  href={`/countries/${countrySlug(job.country)}`}
                  variant="outline"
                  className="mt-3 w-full rounded-2xl"
                >
                  {t('jobs.exploreCountry', { country: job.country })}
                </Button>
                <Button href="/#jobs" variant="secondary" className="mt-3 w-full rounded-2xl">
                  {t('common.moreJobs')}
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
