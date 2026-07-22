import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StarRating } from '@/components/ui/StarRating';
import { testimonials } from '@/data/homepage';

export function Testimonials() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden bg-[var(--bg)] py-16 sm:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,82,204,0.08),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(26,107,255,0.12),_transparent_55%)]"
        aria-hidden="true"
      />
      <Container className="relative">
        <SectionHeading
          id="testimonials-heading"
          eyebrow={t('home.testimonialsEyebrow')}
          title={t('home.testimonialsHeading')}
          description={t('home.testimonialsSubtext')}
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.blockquote
              key={item.id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="flex h-full flex-col rounded-3xl border border-border/70 bg-white/75 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
            >
              <StarRating rating={item.rating} />
              <p className="mt-4 flex-1 text-base leading-relaxed text-ink dark:text-ink-dark">
                “
                {t(`home.testimonialItems.${item.id}.quote`, { defaultValue: item.quote })}
                ”
              </p>
              <footer className="mt-6 flex items-center gap-3 border-t border-border/70 pt-4 dark:border-border-dark">
                <img
                  src={item.photo}
                  alt=""
                  width={48}
                  height={48}
                  loading="lazy"
                  decoding="async"
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
                />
                <cite className="not-italic">
                  <span className="font-heading font-semibold text-ink dark:text-ink-dark">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-muted dark:text-ink-muted-dark">
                    {t(`home.testimonialItems.${item.id}.role`, { defaultValue: item.role })} ·{' '}
                    {item.country}
                  </span>
                </cite>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </Container>
    </section>
  );
}
