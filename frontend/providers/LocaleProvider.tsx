'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Locale, supportedLocales, translations, isRTL } from '@/lib/i18n';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, fallback?: string) => string;
  isRtl: boolean;
  locales: typeof supportedLocales;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('app_locale') as Locale | null;
    if (saved && supportedLocales.some((l) => l.code === saved)) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = isRTL(saved) ? 'rtl' : 'ltr';
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('app_locale', newLocale);
    document.cookie = `app_locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = newLocale;
    document.documentElement.dir = isRTL(newLocale) ? 'rtl' : 'ltr';
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = translations[locale] || translations.en;
      return dict[key] || fallback || key;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isRtl: isRTL(locale),
        locales: supportedLocales,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LocaleProvider');
  }
  return context;
}
