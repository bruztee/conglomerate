import { getRequestConfig } from 'next-intl/server';

export const locales = ['uk', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'uk';

export default getRequestConfig(async ({ locale }) => {
  // Використовуємо fallback на defaultLocale якщо locale undefined
  const validLocale = (locale || defaultLocale) as Locale;
  
  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  };
});
