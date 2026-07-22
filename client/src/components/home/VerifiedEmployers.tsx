import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { verifiedEmployers as sampleVerifiedEmployers } from '@/data/homepage';
import { allowSampleCatalog } from '@/lib/sample-catalog';
import { useVerifiedEmployers } from '@/hooks/queries/usePublicStatsQueries';

export function VerifiedEmployers() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { data: liveEmployers = [], isLoading } = useVerifiedEmployers();

  const isLive = liveEmployers.length > 0;
  const employers = isLive
    ? liveEmployers
    : !isLoading && allowSampleCatalog()
      ? sampleVerifiedEmployers
      : [];

  return (
    <section
      id="verified-employers"
      aria-labelledby="employers-heading"
      className="bg-white py-16 sm:py-20 dark:bg-surface-elevated-dark"
    >
      <Container>
        <SectionHeading
          id="employers-heading"
          eyebrow={t('home.employersEyebrow')}
          title={t('countries.featuredEmployers')}
          description={t('home.featuredEmployersDesc')}
        />

        {!isLive && employers.length > 0 ? (
          <p className="mb-6 text-center text-xs font-semibold tracking-wide text-amber-700 uppercase dark:text-amber-300">
            {t('home.sampleEmployerDisclaimer')}
          </p>
        ) : null}

        {employers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-white/60 p-10 text-center dark:border-border-dark dark:bg-slate-900/40">
            <p className="text-ink-muted dark:text-ink-muted-dark">{t('home.noVerifiedEmployersYet')}</p>
            <Button href="/register/employer" variant="outline" className="mt-5 rounded-2xl">
              {t('home.joinEmployerPartner')}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {employers.map((employer, index) => (
                <motion.article
                  key={employer.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={reduceMotion ? undefined : { y: -4 }}
                  className="rounded-3xl border border-border/70 bg-white/70 p-5 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-lg dark:border-border-dark dark:bg-slate-900/50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-heading text-sm font-bold text-white"
                      style={{ backgroundColor: employer.logoColor }}
                      aria-hidden="true"
                    >
                      {employer.logo}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading text-base font-semibold text-ink dark:text-ink-dark">
                        {employer.name}
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted dark:text-ink-muted-dark">
                        {employer.industry} · {employer.country}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-emerald-700 uppercase dark:text-emerald-300">
                      {t('home.verified')}
                    </span>
                    <span className="text-sm font-semibold text-ink dark:text-ink-dark">
                      {t('home.openingsCount', { count: employer.openings })}
                    </span>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button href="/register" variant="outline" className="rounded-2xl">
                {t('home.joinEmployerPartner')}
              </Button>
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
