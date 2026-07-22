import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { WorldMapBackground } from '@/components/home/WorldMapBackground';

export function HeroSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative isolate min-h-[calc(100vh-4.25rem)] overflow-hidden pb-8"
    >
      <WorldMapBackground />

      <Container className="relative flex min-h-[calc(100vh-4.25rem)] flex-col justify-center py-16 sm:py-20 lg:py-24">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl rounded-[1.75rem] border border-white/30 bg-white/55 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-slate-950/45 dark:shadow-black/40"
        >
          <p className="font-heading text-sm font-semibold tracking-[0.18em] text-brand uppercase dark:text-brand-light">
            {t('home.heroBrand')}
          </p>
          <h1
            id="hero-heading"
            className="mt-4 font-heading text-4xl leading-[1.08] font-extrabold text-balance text-ink sm:text-5xl lg:text-6xl dark:text-ink-dark"
          >
            {t('home.heroTitle')}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-muted sm:text-xl dark:text-ink-muted-dark">
            {t('home.heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href="#jobs" size="lg">
              {t('home.exploreJobs')}
            </Button>
            <Button href="/register" variant="secondary" size="lg">
              {t('home.registerNow')}
            </Button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
