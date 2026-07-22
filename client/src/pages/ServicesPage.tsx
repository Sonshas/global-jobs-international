import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { platformServices } from '@/data/services';

export function ServicesPage() {
  const { t } = useTranslation();

  return (
    <>
      <Navbar />
      <main id="services" className="min-h-screen bg-[var(--bg)] py-12 sm:py-16">
        <Container>
          <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
            {t('services.eyebrow')}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-ink dark:text-ink-dark">
            {t('services.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-muted dark:text-ink-muted-dark">
            {t('services.subtitle')}
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {platformServices.map((service) => (
              <article
                key={service.id}
                id={service.id}
                className="rounded-[1.75rem] border border-border/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-border-dark dark:bg-slate-900/55"
              >
                <div
                  className="mb-4 h-12 w-12 rounded-2xl"
                  style={{ backgroundColor: `${service.accent}22`, border: `1px solid ${service.accent}55` }}
                  aria-hidden
                />
                <h2 className="font-heading text-lg font-semibold text-ink dark:text-ink-dark">
                  {service.title}
                </h2>
                <p className="mt-2 text-sm text-ink-muted dark:text-ink-muted-dark">
                  {service.description}
                </p>
                <Button href={service.href} variant="outline" className="mt-5 w-full rounded-2xl">
                  {t('common.learnMore')}
                </Button>
              </article>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
