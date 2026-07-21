import type { ReactNode } from 'react';

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.25)] sm:p-8 dark:border-border-dark dark:bg-surface-elevated-dark dark:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)]">
      {children}
    </div>
  );
}
