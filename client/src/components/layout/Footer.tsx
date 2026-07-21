import { Container } from '@/components/ui/Container';
import { footerColumns } from '@/data/homepage';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="border-t border-border bg-slate-950 text-slate-200 dark:border-border-dark"
    >
      <Container className="py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.35fr_repeat(4,1fr)]">
          <div>
            <a href="#home" className="font-heading text-xl font-bold text-white">
              Global Jobs International
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Connecting ambitious professionals with trusted employers across the world. Build your
              international career with clarity and confidence.
            </p>
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Social links">
              {['LinkedIn', 'X', 'Facebook', 'Instagram'].map((network) => (
                <a
                  key={network}
                  href={`#${network.toLowerCase()}`}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-white/25 hover:bg-white/5 hover:text-white"
                >
                  {network}
                </a>
              ))}
            </div>
            <a
              href="mailto:hello@globaljobs.international"
              className="mt-6 inline-block text-sm text-slate-300 transition-colors hover:text-white"
            >
              hello@globaljobs.international
            </a>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading text-sm font-semibold tracking-wide text-white uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.href}-${link.label}`}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Global Jobs International. All rights reserved.</p>
          <p>Premium international recruitment · Placeholder content</p>
        </div>
      </Container>
    </footer>
  );
}
