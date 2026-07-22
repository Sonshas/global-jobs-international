import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { appLanguages } from '@/i18n/languages';

export function LanguageSelector() {
  const listId = useId();
  const { i18n, t } = useTranslation();
  const current =
    appLanguages.find((item) => item.code === i18n.resolvedLanguage) ??
    appLanguages.find((item) => item.code === i18n.language) ??
    appLanguages[0];

  return (
    <div className="relative">
      <label htmlFor={listId} className="sr-only">
        {t('nav.language')}
      </label>
      <select
        id={listId}
        value={current.code}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value);
        }}
        className="h-10 max-w-[11rem] appearance-none rounded-xl border border-border bg-white py-2 pr-9 pl-3 text-sm font-medium text-ink transition-colors hover:bg-slate-50 dark:border-border-dark dark:bg-surface-elevated-dark dark:text-ink-dark dark:hover:bg-slate-700"
        aria-label={`${t('nav.language')}: ${current.nativeLabel}`}
      >
        {appLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeLabel}
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
