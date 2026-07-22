import { useId, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export function Newsletter() {
  const { t } = useTranslation();
  const inputId = useId();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus('success');
    setEmail('');
  };

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="relative overflow-hidden bg-brand py-16 text-white sm:py-20"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,180,0,0.28),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_40%)]"
        aria-hidden="true"
      />

      <Container className="relative">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl rounded-[2rem] border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-md sm:p-10"
        >
          <p className="text-sm font-semibold tracking-[0.16em] text-accent uppercase">
            {t('home.newsletterTitle')}
          </p>
          <h2 id="newsletter-heading" className="mt-3 font-heading text-3xl font-bold sm:text-4xl">
            {t('home.newsletterTitle')}
          </h2>
          <p className="mt-3 text-base text-blue-100 sm:text-lg">
            {t('home.newsletterDescription')}
          </p>

          <form
            onSubmit={onSubmit}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <label htmlFor={inputId} className="sr-only">
              {t('common.email')}
            </label>
            <input
              id={inputId}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (status === 'success') setStatus('idle');
              }}
              placeholder="you@example.com"
              className="h-12 flex-1 rounded-2xl border-0 bg-white px-4 text-ink shadow-sm"
            />
            <Button type="submit" variant="accent" size="lg" className="rounded-2xl sm:px-8">
              {t('home.subscribe')}
            </Button>
          </form>

          {status === 'success' ? (
            <p className="mt-3 text-sm text-blue-100" role="status">
              {t('common.success')}
            </p>
          ) : (
            <p className="mt-3 text-xs text-blue-100/80">{t('home.newsletterDescription')}</p>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
