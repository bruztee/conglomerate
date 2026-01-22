import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export const locales = ['uk', 'ru', 'en'] as const;
export const defaultLocale = 'uk' as const;

export type Locale = typeof locales[number];

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || defaultLocale) as Locale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
