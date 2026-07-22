import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { featuredCountries } from '@/data/homepage';
import { countrySlug } from '@/data/country-pages';

export function FeaturedCountries() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="countries"
      aria-labelledby="countries-heading"
      className="bg-white py-16 sm:py-20 dark:bg-surface-elevated-dark"
    >
      <Container>
        <SectionHeading
          id="countries-heading"
          eyebrow={t('home.destinations')}
          title={t('home.featuredCountries')}
          description={t('home.featuredCountriesDesc')}
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {featuredCountries.map((country, index) => (
            <motion.article
              key={country.code}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              className="group overflow-hidden rounded-3xl border border-border/70 bg-white/80 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-lg dark:border-border-dark dark:bg-slate-900/50"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={country.image}
                  alt={country.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1 shadow-sm dark:bg-slate-900/90">
                  <img
                    src={`https://flagcdn.com/w40/${country.code}.png`}
                    srcSet={`https://flagcdn.com/w80/${country.code}.png 2x`}
                    width={20}
                    height={14}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="rounded-[2px]"
                  />
                  <span className="text-xs font-semibold text-ink dark:text-ink-dark">
                    {country.name}
                  </span>
                </div>
                {country.visaSponsorship ? (
                  <span className="absolute top-3 right-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold tracking-wide text-ink uppercase">
                    {t('home.visaSponsorship')}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark">
                      {t('home.openRoles')}
                    </p>
                    <p className="font-heading text-2xl font-bold text-brand dark:text-brand-light">
                      {country.openings.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase dark:text-ink-muted-dark">
                      {t('home.avgSalary')}
                    </p>
                    <p className="text-sm font-semibold text-ink dark:text-ink-dark">
                      {country.averageSalary}
                    </p>
                  </div>
                </div>

                <Button href={`/countries/${countrySlug(country.name)}`} variant="outline" className="w-full rounded-2xl">
                  {t('home.viewCountry')}
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
