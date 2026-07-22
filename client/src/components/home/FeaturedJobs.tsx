import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { ApplyButton } from '@/components/jobs/ApplyButton';
import {
  featuredCountries,
  featuredJobs,
  getJobsForCountry,
  MANDATORY_JOB_TITLES,
  type JobListing,
} from '@/data/homepage';
import { jobCatalogStats } from '@/data/jobs-catalog';

type FeaturedJobsProps = {
  selectedCountry: string | null;
  onSelectCountry: (countryName: string | null) => void;
};

export function FeaturedJobs({ selectedCountry, onSelectCountry }: FeaturedJobsProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  const jobs = useMemo(() => {
    if (selectedCountry) {
      return getJobsForCountry(selectedCountry).filter((job) => job.status === 'Open').slice(0, 24);
    }
    return featuredJobs;
  }, [selectedCountry]);

  return (
    <section id="jobs" aria-labelledby="jobs-heading" className="bg-[var(--bg)] py-16 sm:py-20">
      <Container>
        <SectionHeading
          id="jobs-heading"
          eyebrow={t('home.opportunities')}
          title={t('home.featuredJobs')}
          description={t('home.featuredJobsDesc')}
        />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <FilterChip
            active={!selectedCountry}
            onClick={() => onSelectCountry(null)}
            label={t('home.allFeatured')}
          />
          {featuredCountries.map((country) => (
            <FilterChip
              key={country.code}
              active={selectedCountry === country.name}
              onClick={() =>
                onSelectCountry(selectedCountry === country.name ? null : country.name)
              }
              label={country.name === 'United Arab Emirates' ? 'UAE' : country.name}
            />
          ))}
        </div>

        <p className="mb-5 text-sm font-medium text-slate-700 dark:text-slate-300" role="status">
          {t('home.showingRoles', { count: jobs.length })}
          {selectedCountry
            ? ` ${t('home.inCountry', { country: selectedCountry })}`
            : ` ${t('home.acrossFeaturedDestinations')}`}
          {!selectedCountry
            ? ` ${t('home.sampleListingsWorldwide', {
                total: jobCatalogStats.totalJobs.toLocaleString(),
              })}`
            : null}
          .
        </p>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job, index) => (
            <JobCard key={job.id} job={job} index={index} reduceMotion={Boolean(reduceMotion)} />
          ))}
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-border/70 bg-white/70 p-5 backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/40">
          <p className="text-sm font-semibold text-ink dark:text-ink-dark">
            {t('home.mandatoryRolesTitle')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {MANDATORY_JOB_TITLES.map((title) => (
              <span
                key={title}
                className="rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-semibold text-brand dark:border-brand-light/30 dark:text-brand-light"
              >
                {title}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <Button href="/jobs" variant="outline" className="rounded-2xl">
              {t('home.browseAllJobsCount', {
                total: jobCatalogStats.totalJobs.toLocaleString(),
              })}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'border-brand bg-brand text-white shadow-sm'
          : 'border-slate-300 bg-white text-slate-800 hover:border-brand/50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

function Benefit({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
      <span className={ok ? 'font-bold text-emerald-600' : 'font-bold text-slate-400'} aria-hidden>
        {ok ? '✔' : '–'}
      </span>
      {label}
    </li>
  );
}

function JobCard({
  job,
  index,
  reduceMotion,
}: {
  job: JobListing;
  index: number;
  reduceMotion: boolean;
}) {
  const { t } = useTranslation();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04 }}
      className="flex flex-col rounded-3xl border border-border/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-lg dark:border-border-dark dark:bg-slate-900/55"
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-heading text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: job.logoColor }}
          aria-hidden="true"
        >
          {job.logo}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
            {job.title}
          </h3>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
            {job.employer} · {job.city}
          </p>
          <p className="mt-1 text-sm font-semibold text-brand dark:text-brand-light">{job.country}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-slate-950/40">
          <dt className="text-slate-600 dark:text-slate-400">{t('common.salary')}</dt>
          <dd className="font-semibold text-slate-900 dark:text-white">{job.salaryLabel}</dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-1.5">
        <Benefit ok={job.accommodation} label={t('jobs.accommodation')} />
        <Benefit ok={job.visaSponsorship} label={t('home.visaSponsorship')} />
        <Benefit ok={job.medicalInsurance} label={t('jobs.medicalInsurance')} />
      </ul>

      <div className="mt-auto flex gap-2 pt-5">
        <Button href={`/jobs/${job.id}`} variant="outline" className="flex-1 rounded-2xl">
          {t('common.details')}
        </Button>
        <ApplyButton jobId={job.id} className="flex-1 rounded-2xl" />
      </div>
    </motion.article>
  );
}
