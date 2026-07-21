import { useId, useState } from 'react';
import { languages } from '@/data/homepage';

export function LanguageSelector() {
  const listId = useId();
  const [language, setLanguage] = useState<(typeof languages)[number]['code']>('en');
  const current = languages.find((item) => item.code === language) ?? languages[0];

  return (
    <div className="relative">
      <label htmlFor={listId} className="sr-only">
        Language
      </label>
      <select
        id={listId}
        value={language}
        onChange={(event) =>
          setLanguage(event.target.value as (typeof languages)[number]['code'])
        }
        className="h-10 appearance-none rounded-xl border border-border bg-white py-2 pr-9 pl-3 text-sm font-medium text-ink transition-colors hover:bg-slate-50 dark:border-border-dark dark:bg-surface-elevated-dark dark:text-ink-dark dark:hover:bg-slate-700"
        aria-label={`Language: ${current.label}`}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted dark:text-ink-muted-dark">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M5.25 7.5 10 12.25 14.75 7.5" />
        </svg>
      </span>
    </div>
  );
}
