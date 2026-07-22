import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { listCountryPages } from '@/data/country-pages';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function CountriesIndexPage() {
  const { t } = useTranslation();
  useDocumentTitle(`${t('countries.title')} | ${t('app.name')}`);
  const countries = listCountryPages();

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-[var(--bg)] py-12 sm:py-16">
        <Container>
          <p className="text-sm font-semibold tracking-wide text-brand uppercase dark:text-brand-light">
            {t('home.destinations')}
          </p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-ink dark:text-ink-dark">
            {t('countries.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-muted dark:text-ink-muted-dark">
            {t('countries.subtitle')}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {countries.map((country) => (
              <Link
                key={country.slug}
                to={`/countries/${country.slug}`}
                className="rounded-3xl border border-border/70 bg-white/85 p-4 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md dark:border-border-dark dark:bg-slate-900/55"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={country.flagUrl}
                    alt=""
                    width={40}
                    height={28}
                    loading="lazy"
                    decoding="async"
                    className="rounded-md border border-black/5"
                  />
                  <div>
                    <p className="font-semibold text-ink dark:text-ink-dark">{country.name}</p>
                    <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                      {t('countries.openRolesCurrency', {
                        count: country.openJobsCount,
                        currency: country.currency,
                      })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <Button href="/jobs" className="rounded-2xl">
              {t('countries.browseAllJobs')}
            </Button>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
