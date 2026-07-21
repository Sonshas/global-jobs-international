import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { featuredJobs } from '@/data/homepage';

export function FeaturedJobs() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="jobs" aria-labelledby="jobs-heading" className="bg-[var(--bg)] py-16 sm:py-20">
      <Container>
        <SectionHeading
          id="jobs-heading"
          eyebrow="Opportunities"
          title="Featured jobs"
          description="Premium roles from verified employers across our partner destinations."
        />

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredJobs.map((job, index) => (
            <motion.article
              key={job.id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex flex-col rounded-3xl border border-border bg-white p-6 shadow-sm dark:border-border-dark dark:bg-surface-elevated-dark"
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                        {job.title}
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                        {job.company}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand dark:bg-brand/20 dark:text-brand-light">
                      {job.type}
                    </span>
                  </div>
                </div>
              </div>

              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg)] px-3 py-2.5 dark:bg-slate-900/40">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">Salary</dt>
                  <dd className="font-semibold text-ink dark:text-ink-dark">{job.salary}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--bg)] px-3 py-2.5 dark:bg-slate-900/40">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">Country</dt>
                  <dd className="font-semibold text-ink dark:text-ink-dark">{job.country}</dd>
                </div>
              </dl>

              <div className="mt-auto pt-5">
                <Button href={`#apply-${job.id}`} className="w-full rounded-2xl">
                  Apply
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
