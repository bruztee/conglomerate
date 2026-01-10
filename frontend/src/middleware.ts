import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') || 
                         request.nextUrl.pathname.startsWith('/admin') ||
                         request.nextUrl.pathname.startsWith('/withdraw')

  // Redirect to login if trying to access protected pages without token
  if (isProtectedPage && !accessToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Redirect to dashboard if trying to access auth pages with valid token
  if (isAuthPage && accessToken && !request.nextUrl.pathname.includes('verify')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/auth/:path*', '/withdraw/:path*']
}
