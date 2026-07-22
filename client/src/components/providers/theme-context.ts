import { createContext } from 'react';
import type { ResolvedTheme, ThemePreference } from '@/lib/theme';

export type ThemeContextValue = {
  /** User preference: light | dark | system */
  preference: ThemePreference;
  /** Effective theme after resolving system */
  theme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
  cycleTheme: () => void;
  /** @deprecated Use cycleTheme */
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
