import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { t } = useTranslation();
  const { preference, theme, cycleTheme } = useTheme();
  const label =
    preference === 'system'
      ? `${t('theme.system')} (${theme})`
      : preference === 'dark'
        ? t('theme.dark')
        : t('theme.light');

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-2 text-ink transition-colors hover:bg-slate-50 dark:border-border-dark dark:bg-surface-elevated-dark dark:text-ink-dark dark:hover:bg-slate-700"
      aria-label={label}
      title={label}
    >
      {preference === 'system' ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <rect
            x="3"
            y="4"
            width="18"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="M8 20h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : theme === 'dark' ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2M22 12h-2M4.93 19.07 3.51 20.49M20.49 3.51l-1.42 1.42"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span className="hidden text-[10px] font-bold tracking-wide uppercase sm:inline">
        {preference === 'system' ? t('theme.auto') : label}
      </span>
    </button>
  );
}
