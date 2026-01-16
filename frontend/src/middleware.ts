import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const authFlow = request.cookies.get('auth_flow')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const pathname = request.nextUrl.pathname

  // Allow access during specific flows
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
  matcher: ['/auth/:path*']
}
