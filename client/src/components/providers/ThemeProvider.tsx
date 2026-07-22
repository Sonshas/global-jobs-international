import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  applyTheme,
  getSystemTheme,
  persistTheme,
  resolveResolvedTheme,
  resolveThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme';
import { ThemeContext } from '@/components/providers/theme-context';

const CYCLE: ThemePreference[] = ['light', 'dark', 'system'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    resolveThemePreference(),
  );
  const [systemEpoch, setSystemEpoch] = useState(0);

  const theme: ResolvedTheme = resolveResolvedTheme(preference);
  void systemEpoch;

  useEffect(() => {
    applyTheme(resolveResolvedTheme(preference));
    persistTheme(preference);
  }, [preference, systemEpoch]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (preference === 'system') {
        setSystemEpoch((value) => value + 1);
        applyTheme(getSystemTheme());
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
  }, []);

  const cycleTheme = useCallback(() => {
    setPreferenceState((current) => {
      const index = CYCLE.indexOf(current);
      return CYCLE[(index + 1) % CYCLE.length];
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ preference, theme, setTheme, cycleTheme, toggleTheme: cycleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
