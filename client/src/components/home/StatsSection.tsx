import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { stats } from '@/data/homepage';
import { usePlatformPublicStats } from '@/hooks/queries/usePublicStatsQueries';

const STAT_LABEL_KEYS: Record<string, string> = {
  jobs: 'home.availableJobs',
  countries: 'home.countriesCount',
  employers: 'home.verifiedEmployers',
  applicants: 'home.applicants',
  interviews: 'home.interviewsScheduled',
  placements: 'home.successfulPlacements',
};

export function StatsSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { data: liveStats } = usePlatformPublicStats();

  // Overlay live, DB-backed counts for jobs/countries/employers once loaded.
  // Other stats (applicants, interviews, placements) keep their configured values.
  const liveValueById: Partial<Record<string, number>> = liveStats
    ? {
        jobs: liveStats.publishedJobs,
        countries: liveStats.countriesWithJobs,
        employers: liveStats.verifiedEmployers,
      }
    : {};

  return (
    <section
      id="stats"
      aria-labelledby="stats-heading"
      className="relative z-10 -mt-4 border-y border-border/60 bg-white/70 backdrop-blur-xl dark:border-border-dark dark:bg-slate-950/55"
    >
      <Container className="py-12 sm:py-14">
        <h2 id="stats-heading" className="sr-only">
          {t('home.platformStatistics')}
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="rounded-3xl border border-border/60 bg-white/80 px-3 py-5 text-center shadow-sm backdrop-blur-md dark:border-border-dark dark:bg-slate-900/50"
            >
              <AnimatedCounter
                value={liveValueById[stat.id] ?? stat.value}
                suffix={stat.suffix}
                format={stat.format}
              />
              <p className="mt-2 text-[11px] font-medium tracking-wide text-ink-muted uppercase sm:text-xs dark:text-ink-muted-dark">
                {t(STAT_LABEL_KEYS[stat.id] ?? stat.label)}
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
