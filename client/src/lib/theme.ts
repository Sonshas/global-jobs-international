export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/** @deprecated Use ThemePreference — kept for compatibility with older call sites */
export type Theme = ThemePreference;

export const THEME_STORAGE_KEY = 'gji-theme';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readStoredTheme(): ThemePreference | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
    return null;
  } catch {
    return null;
  }
}

export function resolveThemePreference(
  stored: ThemePreference | null = readStoredTheme(),
): ThemePreference {
  return stored ?? 'system';
}

export function resolveResolvedTheme(
  preference: ThemePreference = resolveThemePreference(),
): ResolvedTheme {
  return preference === 'system' ? getSystemTheme() : preference;
}

/** @deprecated Prefer resolveResolvedTheme */
export function resolveTheme(stored: ThemePreference | null = readStoredTheme()): ResolvedTheme {
  return resolveResolvedTheme(resolveThemePreference(stored));
}

export function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

export function persistTheme(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
}
