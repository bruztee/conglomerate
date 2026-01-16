import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const authFlow = request.cookies.get('auth_flow')?.value
  const pathname = request.nextUrl.pathname
  
  console.log('[Middleware] pathname:', pathname);
  console.log('[Middleware] accessToken:', accessToken ? 'exists (length: ' + accessToken.length + ')' : 'MISSING');
  console.log('[Middleware] authFlow:', authFlow || 'none');
  
  const isAuthPage = pathname.startsWith('/auth')
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')

  // Protected routes require access_token
  if ((isDashboard || isAdmin) && !accessToken) {
    console.log('[Middleware] BLOCKING:', pathname, '- no access_token, redirecting to /auth/login');
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  console.log('[Middleware] ALLOWING:', pathname);

  // Auth pages redirect to dashboard if already authenticated
  if (isAuthPage && accessToken) {
    // Allow reset-password during recovery flow
    if (pathname === '/auth/reset-password' && authFlow === 'recovery') {
      return NextResponse.next()
    }
    
    // Allow set-name during signup flow
    if (pathname === '/auth/set-name' && authFlow === 'signup') {
      return NextResponse.next()
    }
    
    // Allow callback page (handles token setting)
    if (pathname === '/auth/callback') {
      return NextResponse.next()
    }
    
    // Redirect other auth pages to dashboard if authenticated
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/auth/:path*', '/dashboard/:path*', '/admin/:path*']
}
