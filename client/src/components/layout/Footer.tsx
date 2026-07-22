import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';

const social = [
  { labelKey: 'Facebook', href: 'https://facebook.com' },
  { labelKey: 'Instagram', href: 'https://instagram.com' },
  { labelKey: 'TikTok', href: 'https://tiktok.com' },
  { labelKey: 'LinkedIn', href: 'https://linkedin.com' },
  { labelKey: 'YouTube', href: 'https://youtube.com' },
] as const;

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('footer.explore'),
      links: [
        { label: t('nav.about'), href: '/legal/about' },
        { label: t('nav.countries'), href: '/countries' },
        { label: t('nav.jobs'), href: '/jobs' },
        { label: t('nav.employers'), href: '/#verified-employers' },
        { label: t('nav.services'), href: '/services' },
      ],
    },
    {
      title: t('footer.support'),
      links: [
        { label: t('footer.faq'), href: '/legal/faq' },
        { label: t('footer.privacy'), href: '/legal/privacy' },
        { label: t('footer.terms'), href: '/legal/terms' },
        { label: t('footer.refund'), href: '/legal/refund' },
        { label: t('footer.cookies'), href: '/legal/cookies' },
      ],
    },
    {
      title: t('footer.candidates'),
      links: [
        { label: t('nav.register'), href: '/register' },
        { label: t('nav.login'), href: '/login' },
        { label: t('nav.dashboard'), href: '/dashboard' },
        { label: t('services.cv'), href: '/dashboard/cv-preparation' },
        { label: t('nav.documents'), href: '/dashboard/documents' },
      ],
    },
  ];

  return (
    <footer
      id="contact"
      className="border-t border-border bg-slate-950 text-slate-200 dark:border-border-dark"
    >
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link to="/" className="font-heading text-xl font-bold text-white">
              {t('app.name')}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              {t('footer.tagline')}
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>
                <a
                  href="https://wa.me/254700000000"
                  className="hover:text-white"
                  rel="noreferrer"
                  target="_blank"
                >
                  {t('footer.whatsapp')} · +254 700 000 000
                </a>
              </p>
              <p>
                <a href="mailto:hello@globaljobs.international" className="hover:text-white">
                  {t('common.email')} · hello@globaljobs.international
                </a>
              </p>
              <p>
                <a href="tel:+254700000000" className="hover:text-white">
                  {t('common.phone')} · +254 700 000 000
                </a>
              </p>
              <p className="text-slate-400">
                {t('footer.office')} · Westlands Business Park, Nairobi, Kenya
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Social links">
              {social.map((network) => (
                <a
                  key={network.labelKey}
                  href={network.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
                >
                  {network.labelKey}
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading text-sm font-semibold tracking-wide text-white uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    {link.href.startsWith('http') ||
                    link.href.startsWith('/#') ||
                    link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-slate-400 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {t('app.name')}. {t('footer.rights')}
          </p>
          <p>{t('footer.enterprise')}</p>
        </div>
      </Container>
    </footer>
  );
}
