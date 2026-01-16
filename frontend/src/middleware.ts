import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const pathname = request.nextUrl.pathname
  
  console.log('[Middleware] pathname:', pathname);
  console.log('[Middleware] accessToken:', accessToken ? 'exists (length: ' + accessToken.length + ')' : 'MISSING');
  
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')

  // ТІЛЬКИ захист dashboard/admin - auth pages handle redirects на client-side
  if ((isDashboard || isAdmin) && !accessToken) {
    console.log('[Middleware] BLOCKING:', pathname, '- no access_token, redirecting to /auth/login');
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  console.log('[Middleware] ALLOWING:', pathname);
  return NextResponse.next()
}

export const config = {
  // ТІЛЬКИ dashboard/admin - auth pages НЕ потрібно middleware
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
