import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { applicationSeason } from '@/data/homepage';

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  phase: 'upcoming' | 'open' | 'closed';
};

function getTimeLeft(now: number): TimeLeft {
  const opens = new Date(applicationSeason.opensAt).getTime();
  const closes = new Date(applicationSeason.closesAt).getTime();

  if (now < opens) {
    return { ...split(opens - now), phase: 'upcoming' };
  }
  if (now <= closes) {
    return { ...split(closes - now), phase: 'open' };
  }
  return { days: 0, hours: 0, minutes: 0, seconds: 0, phase: 'closed' };
}

function split(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso));
}

export function ApplicationSeason() {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const timeLeft = useMemo(() => getTimeLeft(now), [now]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const statusLabel =
    timeLeft.phase === 'upcoming'
      ? t('home.seasonBlock.seasonOpensIn')
      : timeLeft.phase === 'open'
        ? t('home.seasonBlock.applicationsCloseIn')
        : t('home.seasonBlock.seasonClosed');

  const applicationStatus =
    timeLeft.phase === 'open'
      ? t('home.seasonBlock.statusOpen')
      : timeLeft.phase === 'upcoming'
        ? t('home.seasonBlock.statusSoon')
        : t('home.seasonBlock.statusClosed');

  const units = [
    { label: t('home.days'), value: timeLeft.days },
    { label: t('home.seasonBlock.hours'), value: timeLeft.hours },
    { label: t('home.seasonBlock.minutes'), value: timeLeft.minutes },
    { label: t('home.seasonBlock.seconds'), value: timeLeft.seconds },
  ];

  return (
    <section
      id="season"
      aria-labelledby="season-heading"
      className="relative overflow-hidden bg-[linear-gradient(160deg,#0B1F44_0%,#0F2E6B_45%,#102A56_100%)] py-16 text-white sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
        <div className="hero-aurora absolute inset-0" />
      </div>

      <Container className="relative">
        <SectionHeading
          id="season-heading"
          tone="inverse"
          eyebrow={t('home.seasonTitle')}
          title={t('home.seasonBlock.name')}
          description={t('home.seasonBlock.description')}
        />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl rounded-[1.75rem] border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8"
        >
          <p className="mb-4 text-center text-sm font-bold tracking-[0.2em] text-accent uppercase">
            {t('home.seasonBlock.currentRecruitment', { status: applicationStatus })}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                {t('home.seasonBlock.openingDate')}
              </p>
              <p className="mt-2 font-heading text-lg font-semibold">
                {formatDate(applicationSeason.opensAt, i18n.language)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                {t('home.seasonBlock.closingDate')}
              </p>
              <p className="mt-2 font-heading text-lg font-semibold">
                {formatDate(applicationSeason.closesAt, i18n.language)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                {t('home.seasonBlock.visaProcessingLabel')}
              </p>
              <p className="mt-2 font-heading text-lg font-semibold">
                {t('home.seasonBlock.visaProcessing')}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold tracking-wide text-accent uppercase">
                {t('home.seasonBlock.departureLabel')}
              </p>
              <p className="mt-2 font-heading text-lg font-semibold">
                {t('home.seasonBlock.departure')}
              </p>
            </div>
          </div>

          <p className="mt-8 text-center text-sm font-semibold tracking-wide text-slate-200 uppercase">
            {statusLabel}
          </p>

          <div
            className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"
            role="timer"
            aria-live="polite"
            aria-atomic="true"
            aria-label={t('home.seasonBlock.timerAria', {
              status: statusLabel,
              days: timeLeft.days,
              hours: timeLeft.hours,
              minutes: timeLeft.minutes,
              seconds: timeLeft.seconds,
            })}
          >
            {units.map((unit) => (
              <div
                key={unit.label}
                className="rounded-2xl border border-white/15 bg-slate-950/35 px-3 py-4 text-center"
              >
                <p className="font-heading text-3xl font-bold tabular-nums sm:text-4xl">
                  {String(unit.value).padStart(2, '0')}
                </p>
                <p className="mt-1 text-xs font-medium tracking-wide text-slate-300 uppercase">
                  {unit.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/register" size="lg" className="rounded-2xl">
              {t('home.seasonBlock.applyThisSeason')}
            </Button>
            <Button href="#jobs" variant="secondary" size="lg" className="rounded-2xl">
              {t('home.seasonBlock.browseOpenRoles')}
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
