'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeId = 'green' | 'red' | 'black' | 'blue';

export const THEMES: { id: ThemeId; label: string; description: string; background: string; primary: string }[] = [
  { id: 'green', label: 'Yeşil–Beyaz', description: 'Varsayılan sakin yeşil', background: '#F4FAF7', primary: '#0F766E' },
  { id: 'red', label: 'Beyaz–Kırmızı', description: 'Beyaz zemin, kırmızı vurgular', background: '#FFF7F6', primary: '#DC2626' },
  { id: 'black', label: 'Siyah–Beyaz', description: 'Siyah zemin, beyaz çizgiler', background: '#0E0E0F', primary: '#F5F5F5' },
  { id: 'blue', label: 'Mavi–Beyaz', description: 'Beyaz zemin, mavi vurgular', background: '#F5F9FF', primary: '#2563EB' },
];

export const THEME_COOKIE = 'pl_theme';

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue>({ theme: 'green', setTheme: () => {} });

export function applyTheme(theme: ThemeId) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'black');
  root.style.colorScheme = theme === 'black' ? 'dark' : 'light';
}

function persistTheme(theme: ThemeId) {
  try {
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // cookie may be blocked: the theme still applies for this session
  }
}

export function ThemeProvider({ initialTheme, children }: { initialTheme: ThemeId; children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(initialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: ThemeId) => {
    setThemeState(next);
    applyTheme(next);
    persistTheme(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
