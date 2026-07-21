import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StarRating } from '@/components/ui/StarRating';
import { testimonials } from '@/data/homepage';

export function Testimonials() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="bg-white py-16 sm:py-20 dark:bg-surface-elevated-dark"
    >
      <Container>
        <SectionHeading
          id="testimonials-heading"
          eyebrow="Testimonials"
          title="Stories from professionals abroad"
          description="Placeholder reviews that reflect the experience we aim to deliver."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <motion.blockquote
              key={item.id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="flex h-full flex-col rounded-3xl border border-border bg-[var(--bg)] p-6 shadow-sm dark:border-border-dark"
            >
              <StarRating rating={item.rating} />
              <p className="mt-4 flex-1 text-base leading-relaxed text-ink dark:text-ink-dark">
                “{item.quote}”
              </p>
              <footer className="mt-6 flex items-center gap-3 border-t border-border pt-4 dark:border-border-dark">
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
                    {item.role} · {item.country}
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
