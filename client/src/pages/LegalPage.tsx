import { Navigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Container } from '@/components/ui/Container';

const legalSlugs = ['about', 'faq', 'privacy', 'terms', 'refund', 'cookies'] as const;
type LegalSlug = (typeof legalSlugs)[number];

function isLegalSlug(value: string | undefined): value is LegalSlug {
  return legalSlugs.includes(value as LegalSlug);
}

export function LegalPage() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  if (!isLegalSlug(pageSlug)) return <Navigate to="/" replace />;

  const title = t(`legal.${pageSlug}.title`);
  const body = t(`legal.${pageSlug}.body`, { returnObjects: true }) as string[];

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-[var(--bg)] py-12 sm:py-16">
        <Container className="max-w-3xl">
          <Link to="/" className="text-sm font-semibold text-brand hover:underline dark:text-brand-light">
            {t('legal.homeLink')}
          </Link>
          <h1 className="mt-4 font-heading text-4xl font-bold text-ink dark:text-ink-dark">{title}</h1>
          <div className="mt-6 space-y-4 text-ink-muted dark:text-ink-muted-dark">
            {body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
