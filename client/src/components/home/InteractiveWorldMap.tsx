import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { featuredCountries, getJobsForCountry, mapLocations } from '@/data/homepage';

type InteractiveWorldMapProps = {
  selectedCountry: string | null;
  onSelectCountry: (countryName: string | null) => void;
};

export function InteractiveWorldMap({
  selectedCountry,
  onSelectCountry,
}: InteractiveWorldMapProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="world-map"
      aria-labelledby="world-map-heading"
      className="bg-[var(--bg)] py-16 sm:py-20"
    >
      <Container>
        <SectionHeading
          id="world-map-heading"
          eyebrow={t('home.worldMapEyebrow')}
          title={t('home.worldMapTitle')}
          description={t('home.worldMapDesc')}
        />

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-slate-950 via-[#0B1F44] to-[#102A56] p-4 shadow-xl shadow-brand/10 sm:p-6 dark:border-border-dark"
          >
            <svg
              viewBox="0 0 1000 500"
              className="h-auto w-full"
              role="img"
              aria-label={t('home.mapAriaLabel')}
            >
              <defs>
                <linearGradient id="mapOcean" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0B1F44" />
                  <stop offset="100%" stopColor="#123A78" />
                </linearGradient>
                <filter id="mapPinGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <rect width="1000" height="500" fill="url(#mapOcean)" rx="24" />

              <g fill="rgba(148,163,184,0.28)" stroke="rgba(148,163,184,0.35)" strokeWidth="0.6">
                <path d="M95 120c35-42 95-58 155-42 42 11 78 8 112-10 28-15 58-12 78 8 18 18 42 28 68 22l18 34c-28 18-58 14-88 2-36-14-72-8-104 14-40 28-88 34-136 18-34-11-68-4-98 18-16 12-36 10-52-4-22-20-18-46 5-60 16-10 22-28 24-48z" />
                <path d="M268 268c28-8 52 4 68 26 14 20 34 30 56 28 8 22-2 44-22 56-24 14-46 8-66-6-22-16-44-14-66 2-14 10-30 8-40-6-14-20-8-44 12-56 18-10 24-28 58-44z" />
                <path d="M470 118c28-16 62-14 88 4 18 12 40 14 58 4 14 18 8 40-10 52-24 16-50 12-74 2-28-12-56-8-80 8-12 8-28 6-38-6-14-16-10-38 8-48 14-8 22-18 48-16z" />
                <path d="M500 198c34-10 68-2 92 22 20 20 48 28 74 18 10 28-4 56-30 70-36 20-78 18-116 4-32-12-64-6-92 14-14 10-32 8-44-6-18-22-12-52 12-68 22-14 28-36 104-54z" />
                <path d="M590 150c48-18 104-14 150 12 40 22 86 28 128 10 28-12 56-6 74 16 16 20 10 46-12 60-34 22-74 16-110 2-48-18-96-10-140 16-28 16-62 18-94 4-30-14-46-40-36-70 8-22 12-40 40-50z" />
                <path d="M780 330c36-14 78-8 108 18 22 18 50 22 76 10 12 20 4 42-14 54-28 18-62 14-92 2-34-14-70-8-100 12-12 8-28 6-38-6-14-18-8-40 10-50 18-10 22-28 50-40z" />
              </g>

              {mapLocations.map((location) => {
                const country = featuredCountries.find((item) => item.code === location.id);
                if (!country) return null;
                const active = selectedCountry === country.name;
                const jobCount = getJobsForCountry(country.name).length;

                return (
                  <g
                    key={location.id}
                    transform={`translate(${location.x} ${location.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={t('home.mapPinAria', { country: country.name, count: jobCount })}
                    aria-pressed={active}
                    className="cursor-pointer outline-none"
                    onClick={() => onSelectCountry(active ? null : country.name)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectCountry(active ? null : country.name);
                      }
                    }}
                  >
                    <title>
                      {t('home.mapPinTitle', { country: country.name, count: jobCount })}
                    </title>
                    <circle
                      r={active ? 18 : 14}
                      fill={active ? 'rgba(244,180,0,0.25)' : 'rgba(0,82,204,0.2)'}
                    />
                    <circle
                      r={active ? 8 : 6.5}
                      fill={active ? '#F4B400' : '#1A6BFF'}
                      filter="url(#mapPinGlow)"
                    />
                    <text
                      y="28"
                      textAnchor="middle"
                      className="fill-white text-[11px] font-semibold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {country.name === 'United Arab Emirates' ? 'UAE' : country.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>

          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[1.75rem] border border-border/70 bg-white/80 p-6 shadow-lg backdrop-blur-xl dark:border-border-dark dark:bg-surface-elevated-dark/80"
          >
            <h3 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
              {selectedCountry ?? t('home.allDestinations')}
            </h3>
            <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
              {selectedCountry
                ? t('home.sampleOpeningsNow', {
                    count: getJobsForCountry(selectedCountry).length,
                  })
                : t('home.clickDestinationHint')}
            </p>

            <ul className="mt-5 space-y-2">
              {(selectedCountry
                ? featuredCountries.filter((country) => country.name === selectedCountry)
                : featuredCountries
              ).map((country) => (
                <li key={country.code}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectCountry(
                        selectedCountry === country.name ? null : country.name,
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition ${
                      selectedCountry === country.name
                        ? 'border-brand bg-brand/10 text-brand dark:border-brand-light dark:text-brand-light'
                        : 'border-border hover:border-brand/40 dark:border-border-dark'
                    }`}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      <img
                        src={`https://flagcdn.com/w40/${country.code}.png`}
                        alt=""
                        width={20}
                        height={14}
                        className="rounded-[2px]"
                        loading="lazy"
                      />
                      {country.name}
                    </span>
                    <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                      {getJobsForCountry(country.name).length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {selectedCountry ? (
              <button
                type="button"
                className="mt-4 text-sm font-semibold text-brand hover:underline dark:text-brand-light"
                onClick={() => onSelectCountry(null)}
              >
                {t('home.clearSelection')}
              </button>
            ) : null}
          </motion.aside>
        </div>
      </Container>
    </section>
  );
}
