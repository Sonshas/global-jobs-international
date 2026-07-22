import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { ApplyButton } from '@/components/jobs/ApplyButton';
import { applicationSeason, featuredCountries, verifiedEmployers } from '@/data/homepage';
import { jobCatalogStats, getJobsByCountry } from '@/data/jobs-catalog';
import { useJobSearch } from '@/hooks/queries/useJobsQueries';

function daysLeft(iso: string) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

const successStoryIds = ['amina', 'daniel', 'fatima', 'james', 'maria'] as const;
const successStoryFlags: Record<(typeof successStoryIds)[number], string> = {
  amina: 'ca',
  daniel: 'ie',
  fatima: 'ae',
  james: 'au',
  maria: 'de',
};

const visaApprovalIds = ['mwangi', 'silva', 'hassan', 'okoro'] as const;

/** Premium homepage momentum strip: live hiring signals, newest jobs, and social proof. */
export function PremiumHomeExtras() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { data: allJobs = [] } = useJobSearch({});
  const newest = useMemo(
    () => allJobs.filter((job) => job.status === 'Open').slice(0, 6),
    [allJobs],
  );
  const employerLogos = useMemo(
    () => [
      ...verifiedEmployers,
      ...allJobs
        .filter((job) => job.status === 'Open')
        .slice(0, 4)
        .map((job) => ({
          id: job.id,
          name: job.employer,
          logo: job.logo,
          logoColor: job.logoColor,
          industry: job.category,
          country: job.country,
          openings: 1,
        })),
    ],
    [allJobs],
  );
  const countriesHiring = featuredCountries.map((country) => ({
    ...country,
    vacancies: getJobsByCountry(country.name)
      .filter((job) => job.status === 'Open')
      .reduce((sum, job) => sum + job.vacancies, 0),
  }));
  const deadlineDays = daysLeft(applicationSeason.closesAt);

  const statCards = [
    {
      key: 'vacancies',
      label: t('home.todaysVacancies'),
      value: jobCatalogStats.openJobs.toLocaleString(),
    },
    {
      key: 'countries',
      label: t('home.countriesHiringToday'),
      value: String(countriesHiring.length),
    },
    {
      key: 'added',
      label: t('home.jobsAddedToday'),
      value: String(jobCatalogStats.jobsAddedToday),
    },
    {
      key: 'season',
      label: t('home.seasonCloses'),
      value: t('home.premiumBlock.seasonClosesDays', { count: deadlineDays }),
    },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#020617_0%,#0B1F44_45%,#102A56_100%)] py-14 text-white">
        <div className="hero-aurora pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <Container className="relative">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.key}
                className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-lg backdrop-blur-xl"
              >
                <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                  {card.label}
                </p>
                <p className="mt-2 font-heading text-3xl font-bold">{card.value}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-[var(--bg)] py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow={t('home.liveNetwork')}
            title={t('home.countriesHiringToday')}
            description={t('home.premiumBlock.liveNetworkDesc')}
          />
          <div className="flex flex-wrap justify-center gap-3">
            {countriesHiring.map((country, index) => (
              <motion.div
                key={country.code}
                initial={reduceMotion ? false : { y: 12, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
                transition={{
                  duration: 4 + (index % 3),
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.1,
                }}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/60"
              >
                <img
                  src={`https://flagcdn.com/w40/${country.code}.png`}
                  alt=""
                  width={20}
                  height={14}
                  loading="lazy"
                  decoding="async"
                  className="rounded-[2px]"
                />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {country.name}
                </span>
                <span className="text-xs font-bold text-brand dark:text-brand-light">
                  {t('home.premiumBlock.vacanciesCount', { count: country.vacancies })}
                </span>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20 dark:bg-surface-elevated-dark">
        <Container>
          <SectionHeading
            eyebrow={t('home.newestJobs')}
            title={t('home.premiumBlock.newestJobsTitle')}
            description={t('home.premiumBlock.newestJobsDesc')}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {newest.map((job) => (
              <article
                key={job.id}
                className="rounded-3xl border border-border/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
              >
                <h3 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {job.title}
                </h3>
                <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {job.employer} · {job.country}
                </p>
                <p className="mt-3 text-sm font-semibold text-brand dark:text-brand-light">
                  {job.salaryLabel}
                </p>
                <p className="mt-2 text-xs text-ink-muted dark:text-ink-muted-dark">
                  {t('home.premiumBlock.deadline', { date: job.applicationDeadline })}
                </p>
                <div className="mt-4">
                  <ApplyButton jobId={job.id} className="w-full rounded-2xl" size="sm" />
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="overflow-hidden bg-[var(--bg)] py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow={t('home.premiumBlock.employerCarouselEyebrow')}
            title={t('home.premiumBlock.employerCarouselTitle')}
            description={t('home.premiumBlock.employerCarouselDesc')}
          />
          <div className="relative overflow-hidden">
            <motion.div
              className="flex gap-4"
              animate={reduceMotion ? undefined : { x: ['0%', '-50%'] }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
              {[...employerLogos, ...employerLogos].map((employer, index) => (
                <div
                  key={`${employer.id}-${index}`}
                  className="flex min-w-[14rem] items-center gap-3 rounded-3xl border border-border/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold text-white"
                    style={{ backgroundColor: employer.logoColor }}
                  >
                    {employer.logo}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink dark:text-ink-dark">{employer.name}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                      {employer.country}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20 dark:bg-surface-elevated-dark">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeading
                align="left"
                eyebrow={t('home.premiumBlock.successEyebrow')}
                title={t('home.recentSuccessful')}
                description={t('home.premiumBlock.successDesc')}
              />
              <ul className="space-y-3">
                {successStoryIds.map((id) => (
                  <li
                    key={id}
                    className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/80 px-4 py-3 dark:border-border-dark dark:bg-slate-900/55"
                  >
                    <img
                      src={`https://flagcdn.com/w40/${successStoryFlags[id]}.png`}
                      alt=""
                      width={22}
                      height={16}
                      loading="lazy"
                      decoding="async"
                      className="rounded-[2px]"
                    />
                    <div>
                      <p className="font-semibold text-ink dark:text-ink-dark">
                        {t(`home.premiumBlock.successStories.${id}.name`)}
                      </p>
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                        {t(`home.premiumBlock.successStories.${id}.role`)} ·{' '}
                        {t(`home.premiumBlock.successStories.${id}.country`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading
                align="left"
                eyebrow={t('home.premiumBlock.visaEyebrow')}
                title={t('home.premiumBlock.visaTitle')}
                description={t('home.premiumBlock.visaDesc')}
              />
              <ul className="space-y-3">
                {visaApprovalIds.map((id) => (
                  <li
                    key={id}
                    className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                  >
                    <p className="font-semibold text-ink dark:text-ink-dark">
                      {t(`home.premiumBlock.visaApprovals.${id}.applicant`)} →{' '}
                      {t(`home.premiumBlock.visaApprovals.${id}.destination`)}
                    </p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300">
                      {t('home.premiumBlock.visaApproved', {
                        visa: t(`home.premiumBlock.visaApprovals.${id}.visa`),
                      })}
                    </p>
                  </li>
                ))}
              </ul>
              <Button href="/register" className="mt-5 rounded-2xl">
                {t('home.premiumBlock.startApplication')}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
