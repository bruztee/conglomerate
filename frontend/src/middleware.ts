import { NextResponse, type NextRequest } from 'next/server'

const locales = ['uk', 'ru', 'en'] as const
const defaultLocale = 'uk'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Перевірка чи є locale в URL
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  if (!pathnameHasLocale) {
    // Визначаємо locale з cookie, або browser language, або defaultLocale
    let locale = request.cookies.get('NEXT_LOCALE')?.value as typeof locales[number] | undefined
    
    if (!locale) {
      // Якщо cookie немає, визначаємо з Accept-Language header
      const acceptLanguage = request.headers.get('accept-language')
      if (acceptLanguage) {
        const browserLang = acceptLanguage.split(',')[0].toLowerCase()
        if (browserLang.startsWith('ru')) {
          locale = 'ru'
        } else if (browserLang.startsWith('en')) {
          locale = 'en'
        } else if (browserLang.startsWith('uk')) {
          locale = 'uk'
        }
      }
    }
    
    // Fallback на defaultLocale
    locale = locale || defaultLocale
    
    // Редірект на URL з locale
    const newUrl = new URL(`/${locale}${pathname}`, request.url)
    return NextResponse.redirect(newUrl)
  }
  
  // Витягуємо locale з URL
  const locale = pathname.split('/')[1] as typeof locales[number]
  
  // Зберігаємо locale в cookie
  const response = NextResponse.next()
  response.cookies.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 31536000
  })
  
  // Auth check для protected routes
  const pathWithoutLocale = pathname.replace(`/${locale}`, '')
  const protectedPaths = ['/dashboard', '/admin', '/withdraw', '/referral', '/settings']
  const isProtected = protectedPaths.some(path => pathWithoutLocale.startsWith(path))
  
  if (isProtected) {
    const accessToken = request.cookies.get('access_token')?.value
    if (!accessToken) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: [
    // Всі роути крім static файлів, API та ресурсів
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ]
}
