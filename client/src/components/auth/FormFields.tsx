import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink dark:text-ink-dark">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-ink-muted dark:text-ink-muted-dark">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlClassName =
  'h-12 w-full rounded-2xl border border-border bg-[var(--bg)] px-4 text-sm font-medium text-ink outline-none transition focus:border-brand dark:border-border-dark dark:text-ink-dark';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function TextInput({ hasError, className = '', ...props }: TextInputProps) {
  return (
    <input
      className={`${controlClassName} ${hasError ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export function SelectInput({ hasError, className = '', children, ...props }: SelectInputProps) {
  return (
    <select
      className={`${controlClassName} ${hasError ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormAlert({
  variant = 'error',
  children,
}: {
  variant?: 'error' | 'success' | 'info';
  children: ReactNode;
}) {
  const styles =
    variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300'
      : variant === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
        : 'border-brand/20 bg-brand/5 text-brand dark:border-brand-light/30 dark:bg-brand/10 dark:text-brand-light';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`} role="status">
      {children}
    </div>
  );
}
