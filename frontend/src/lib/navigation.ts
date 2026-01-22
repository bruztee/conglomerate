/**
 * Helper для навігації з автоматичним додаванням locale
 */

import { usePathname, useRouter as useNextRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useRouter() {
  const router = useNextRouter();
  const pathname = usePathname();

  // Витягуємо поточний locale з URL
  const getCurrentLocale = useCallback(() => {
    const segments = pathname.split('/');
    const locale = segments[1];
    return ['uk', 'ru', 'en'].includes(locale) ? locale : 'uk';
  }, [pathname]);

  // Додаємо locale до шляху якщо його немає
  const addLocale = useCallback((path: string) => {
    const locale = getCurrentLocale();
    
    // Якщо шлях вже має locale - повертаємо як є
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) {
      return path;
    }
    
    // Якщо шлях починається з / - додаємо locale
    if (path.startsWith('/')) {
      return `/${locale}${path}`;
    }
    
    // Інакше додаємо / та locale
    return `/${locale}/${path}`;
  }, [getCurrentLocale]);

  const push = useCallback((href: string, options?: any) => {
    router.push(addLocale(href), options);
  }, [router, addLocale]);

  const replace = useCallback((href: string, options?: any) => {
    router.replace(addLocale(href), options);
  }, [router, addLocale]);

  const prefetch = useCallback((href: string) => {
    router.prefetch(addLocale(href));
  }, [router, addLocale]);

  return {
    ...router,
    push,
    replace,
    prefetch,
    addLocale,
  };
}
