'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isRtl } from '@/lib/i18n/languages';

type LanguageContextValue = {
  locale: string;
  setLocale: (code: string) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale?: string;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState(initialLocale || DEFAULT_LOCALE);

  useEffect(() => {
    if (locale !== DEFAULT_LOCALE) return;
    try {
      const stored = window.localStorage.getItem(LOCALE_COOKIE);
      if (stored && stored !== locale) {
        setLocaleState(stored);
      }
    } catch {
      // ignore
    }
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback(
    (code: string) => {
      if (!code || code === locale) return;
      try {
        window.localStorage.setItem(LOCALE_COOKIE, code);
      } catch {
        // ignore
      }
      document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(code)}; path=/; max-age=${
        60 * 60 * 24 * 365
      }; samesite=lax`;
      setLocaleState(code);
      window.location.reload();
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLocale() {
  return useContext(LanguageContext);
}
