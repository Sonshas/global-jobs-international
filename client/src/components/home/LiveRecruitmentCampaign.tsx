import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { applicationSeason, featuredCountries } from '@/data/homepage';
import { getJobsByCountry } from '@/data/jobs-catalog';

function daysRemaining(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function LiveRecruitmentCampaign() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const closingDays = daysRemaining(applicationSeason.closesAt);
  const campaigns = featuredCountries.slice(0, 6).map((country, index) => {
    const jobs = getJobsByCountry(country.name).filter((job) => job.status === 'Open');
    const vacancies = jobs.reduce((sum, job) => sum + job.vacancies, 0);
    return {
      ...country,
      jobsCount: jobs.length,
      vacancies,
      closingIn: Math.max(8, closingDays - index * 4),
    };
  });

  return (
    <section
      id="live-recruitment"
      aria-labelledby="live-recruitment-heading"
      className="bg-white py-16 sm:py-20 dark:bg-surface-elevated-dark"
    >
      <Container>
        <SectionHeading
          id="live-recruitment-heading"
          eyebrow={t('home.liveCampaign.eyebrow')}
          title={t('home.liveCampaign.title')}
          description={t('home.liveCampaign.description')}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign, index) => (
            <motion.article
              key={campaign.code}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="rounded-3xl border border-border/70 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:from-slate-900 dark:to-slate-950"
            >
              <div className="flex items-center gap-2">
                <img
                  src={`https://flagcdn.com/w40/${campaign.code}.png`}
                  alt=""
                  width={22}
                  height={16}
                  loading="lazy"
                  decoding="async"
                  className="rounded-[2px]"
                />
                <h3 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {campaign.name}
                </h3>
              </div>
              <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {t('home.liveCampaign.applicationsOpen')}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">
                    {t('home.liveCampaign.availableJobs')}
                  </dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {campaign.jobsCount}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">{t('jobs.vacancies')}</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {campaign.vacancies}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">{t('jobs.closingDate')}</dt>
                  <dd className="font-semibold text-slate-900 dark:text-white">
                    {new Date(applicationSeason.closesAt).toLocaleDateString(i18n.language)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted dark:text-ink-muted-dark">
                    {t('home.liveCampaign.remaining')}
                  </dt>
                  <dd className="font-bold text-brand dark:text-brand-light">
                    {t('home.liveCampaign.remainingDays', { count: campaign.closingIn })}
                  </dd>
                </div>
              </dl>
              <Button
                href={`/jobs?country=${encodeURIComponent(campaign.name)}`}
                className="mt-5 w-full rounded-2xl"
              >
                {t('common.applyNow')}
              </Button>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
