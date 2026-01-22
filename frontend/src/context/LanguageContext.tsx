"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Locale } from '@/i18n/request';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uk');

  useEffect(() => {
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale | undefined;

    if (savedLocale) {
      setLocaleState(savedLocale);
    } else {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ru')) {
        setLocaleState('ru');
        document.cookie = `NEXT_LOCALE=ru; path=/; max-age=31536000`;
      } else if (browserLang.startsWith('en')) {
        setLocaleState('en');
        document.cookie = `NEXT_LOCALE=en; path=/; max-age=31536000`;
      } else {
        setLocaleState('uk');
        document.cookie = `NEXT_LOCALE=uk; path=/; max-age=31536000`;
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
