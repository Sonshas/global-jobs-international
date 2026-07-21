import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { useAuth } from '@/hooks/useAuth';
import { navLinks } from '@/data/homepage';

function sectionHref(hash: string, pathname: string) {
  return pathname === '/' ? hash : `/${hash}`;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const { isAuthenticated, isEmailVerified, loading, signOut } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const showDashboard = !loading && isAuthenticated && isEmailVerified;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,box-shadow,border-color] ${
        scrolled
          ? 'border-border bg-[var(--nav-bg)] shadow-sm backdrop-blur-xl dark:border-border-dark'
          : 'border-transparent bg-[var(--nav-bg)] backdrop-blur-md'
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-4 lg:h-[4.25rem]">
        <Link
          to="/"
          className="font-heading text-lg font-bold tracking-tight text-brand sm:text-xl dark:text-brand-light"
        >
          Global Jobs International
        </Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={sectionHref(link.href, location.pathname)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink dark:text-ink-muted-dark dark:hover:bg-slate-800 dark:hover:text-ink-dark"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSelector />
          <ThemeToggle />
          {showDashboard ? (
            <>
              <Button href="/dashboard" variant="ghost" size="sm">
                Dashboard
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => void signOut()}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm">
                Login
              </Button>
              <Button href="/register" size="sm">
                Register
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-ink lg:hidden dark:border-border-dark dark:bg-surface-elevated-dark dark:text-ink-dark"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </Container>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border bg-[var(--bg-elevated)] lg:hidden dark:border-border-dark"
          >
            <Container className="flex flex-col gap-2 py-4">
              <nav className="flex flex-col" aria-label="Mobile">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={sectionHref(link.href, location.pathname)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-ink dark:text-ink-dark"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-4 dark:border-border-dark">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {showDashboard ? (
                  <>
                    <Button href="/dashboard" variant="secondary" onClick={() => setOpen(false)}>
                      Dashboard
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        void signOut();
                      }}
                    >
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button href="/login" variant="secondary" onClick={() => setOpen(false)}>
                      Login
                    </Button>
                    <Button href="/register" onClick={() => setOpen(false)}>
                      Register
                    </Button>
                  </>
                )}
              </div>
            </Container>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
