import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  tone?: 'default' | 'glass';
};

export function Field({ id, label, error, hint, children, tone = 'default' }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-1.5 block text-sm font-medium ${
          tone === 'glass' ? 'text-slate-100' : 'text-ink dark:text-ink-dark'
        }`}
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className={`mt-1.5 text-sm ${
            tone === 'glass' ? 'text-red-300' : 'text-red-600 dark:text-red-400'
          }`}
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={`${id}-hint`}
          className={`mt-1.5 text-xs ${
            tone === 'glass' ? 'text-slate-300' : 'text-ink-muted dark:text-ink-muted-dark'
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlClassName =
  'h-12 w-full rounded-2xl border px-4 text-sm font-medium outline-none transition';

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  tone?: 'default' | 'glass';
};

export function TextInput({
  hasError,
  className = '',
  tone = 'default',
  ...props
}: TextInputProps) {
  const toneClasses =
    tone === 'glass'
      ? 'border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:border-brand-light'
      : 'border-border bg-[var(--bg)] text-ink focus:border-brand dark:border-border-dark dark:text-ink-dark';

  return (
    <input
      className={`${controlClassName} ${toneClasses} ${
        hasError
          ? tone === 'glass'
            ? 'border-red-400 focus:border-red-400'
            : 'border-red-500 focus:border-red-500'
          : ''
      } ${className}`}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
  tone?: 'default' | 'glass';
};

export function SelectInput({
  hasError,
  className = '',
  tone = 'default',
  children,
  ...props
}: SelectInputProps) {
  const toneClasses =
    tone === 'glass'
      ? 'border-white/15 bg-[#111827] text-white [color-scheme:dark] focus:border-brand-light'
      : 'border-border bg-[var(--bg)] text-ink focus:border-brand dark:border-border-dark dark:text-ink-dark';

  return (
    <select
      className={`${controlClassName} ${toneClasses} ${
        hasError
          ? tone === 'glass'
            ? 'border-red-400 focus:border-red-400'
            : 'border-red-500 focus:border-red-500'
          : ''
      } ${className}`}
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
  tone = 'default',
}: {
  variant?: 'error' | 'success' | 'info';
  children: ReactNode;
  tone?: 'default' | 'glass';
}) {
  const styles =
    tone === 'glass'
      ? variant === 'error'
        ? 'border-red-400/40 bg-red-500/15 text-red-100'
        : variant === 'success'
          ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
          : 'border-brand/40 bg-brand/15 text-blue-100'
      : variant === 'error'
        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300'
        : variant === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
          : 'border-brand/20 bg-brand/5 text-brand dark:border-brand-light/30 dark:bg-brand/10 dark:text-brand-light';

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`} role="status">
      {children}
    </div>
  );
}
