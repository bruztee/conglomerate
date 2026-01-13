import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // ВАЖЛИВО: Middleware НЕ робить redirect для protected routes
  // Це призводить до race condition при hard refresh
  // Реальна перевірка авторизації відбувається в RootLayoutClient ПІСЛЯ loading
  
  const accessToken = request.cookies.get('access_token')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // Тільки редиректимо з auth pages на dashboard якщо є токен
  // Це безпечно бо не блокує завантаження
  if (isAuthPage && accessToken && !request.nextUrl.pathname.includes('verify')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*']
}
