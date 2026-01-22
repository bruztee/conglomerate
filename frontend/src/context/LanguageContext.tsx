"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Locale } from '@/i18n/request';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>('uk');

  useEffect(() => {
    // Витягуємо locale з URL
    const urlLocale = pathname.split('/')[1] as Locale;
    if (['uk', 'ru', 'en'].includes(urlLocale)) {
      setLocaleState(urlLocale);
    }
  }, [pathname]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    
    // Зберігаємо вибір в cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    
    // Змінюємо locale в URL через router.replace
    const segments = pathname.split('/');
    segments[1] = newLocale; // замінюємо locale
    router.replace(segments.join('/'));
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
