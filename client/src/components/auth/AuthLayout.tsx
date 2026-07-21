import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Container } from '@/components/ui/Container';

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,82,204,0.12),_transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(26,107,255,0.16),_transparent_55%)]"
        aria-hidden="true"
      />

      <header className="relative z-10 border-b border-border/70 bg-[var(--nav-bg)] backdrop-blur-md dark:border-border-dark">
        <Container className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="font-heading text-lg font-bold tracking-tight text-brand dark:text-brand-light"
          >
            Global Jobs International
          </Link>
          <ThemeToggle />
        </Container>
      </header>

      <main className="relative z-10 flex flex-1 items-center py-12 sm:py-16">
        <Container className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-3xl font-bold text-ink dark:text-ink-dark">{title}</h1>
            <p className="mt-2 text-sm text-ink-muted sm:text-base dark:text-ink-muted-dark">
              {subtitle}
            </p>
          </div>
          {children}
        </Container>
      </main>
    </div>
  );
}
