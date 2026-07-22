import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { recruitmentSteps } from '@/data/homepage';

export function RecruitmentProcess() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="services"
      aria-labelledby="process-heading"
      className="bg-[var(--bg)] py-16 sm:py-20"
    >
      <Container>
        <SectionHeading
          id="process-heading"
          eyebrow={t('home.processBlock.eyebrow')}
          title={t('home.processBlock.title')}
          description={t('home.processBlock.description')}
        />

        <div className="relative">
          <div
            className="pointer-events-none absolute top-8 right-0 left-0 hidden h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent lg:block dark:via-brand-light/40"
            aria-hidden="true"
          />

          <ol className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-9 lg:gap-3 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {recruitmentSteps.map((step, index) => (
              <motion.li
                key={step.step}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.35) }}
                className="w-[11.5rem] shrink-0 lg:w-auto"
              >
                <div className="flex h-full flex-col rounded-3xl border border-border bg-white p-4 shadow-sm dark:border-border-dark dark:bg-surface-elevated-dark">
                  <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand font-heading text-sm font-bold text-white shadow-sm shadow-brand/30">
                    {step.step}
                  </span>
                  <h3 className="font-heading text-sm font-semibold text-ink dark:text-ink-dark">
                    {t(`home.processBlock.steps.${step.step}.title`, { defaultValue: step.title })}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted dark:text-ink-muted-dark">
                    {t(`home.processBlock.steps.${step.step}.description`, {
                      defaultValue: step.description,
                    })}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
