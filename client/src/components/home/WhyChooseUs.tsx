import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FeatureIcon } from '@/components/ui/FeatureIcon';
import { whyChooseUs } from '@/data/homepage';

export function WhyChooseUs() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="about"
      aria-labelledby="why-heading"
      className="bg-white py-16 sm:py-20 dark:bg-surface-elevated-dark"
    >
      <Container>
        <SectionHeading
          id="why-heading"
          eyebrow={t('home.whyTitle')}
          title={t('home.whyTitle')}
          description={t('home.whyDescription')}
        />

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {whyChooseUs.map((item, index) => (
            <motion.article
              key={item.id}
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              className="rounded-3xl border border-border/70 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/50"
            >
              <motion.div
                initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.07 }}
                className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-md shadow-brand/25"
              >
                <FeatureIcon name={item.icon} />
              </motion.div>
              <h3 className="font-heading text-xl font-semibold text-ink dark:text-ink-dark">
                {t(`home.whyItems.${item.id}.title`, { defaultValue: item.title })}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted dark:text-ink-muted-dark">
                {t(`home.whyItems.${item.id}.description`, { defaultValue: item.description })}
              </p>
            </motion.article>
          ))}
        </div>
      </Container>
    </section>
  );
}
