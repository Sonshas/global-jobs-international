import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { platformServices } from '@/data/services';

export function ServicesSection() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative overflow-hidden bg-[var(--bg)] py-16 sm:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,82,204,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(244,180,0,0.12),transparent_35%)]"
        aria-hidden
      />
      <Container className="relative">
        <SectionHeading
          id="services-heading"
          eyebrow={t('nav.services')}
          title={t('home.servicesTitle')}
          description={t('home.servicesDescription')}
        />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {platformServices.map((service, index) => (
            <motion.article
              key={service.id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="rounded-[1.5rem] border border-border/70 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/50"
            >
              <div
                className="mb-4 h-10 w-10 rounded-2xl"
                style={{ backgroundColor: service.accent }}
                aria-hidden
              />
              <h3 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                {service.description}
              </p>
            </motion.article>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <Button href="/services" className="rounded-2xl">
            {t('home.viewAllServices')}
          </Button>
        </div>
      </Container>
    </section>
  );
}
