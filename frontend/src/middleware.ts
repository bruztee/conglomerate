import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const pathname = request.nextUrl.pathname
  
  const isDashboard = pathname.startsWith('/dashboard')
  const isAdmin = pathname.startsWith('/admin')

  // Protected routes require access_token
  if ((isDashboard || isAdmin) && !accessToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  // ТІЛЬКИ dashboard/admin - auth pages НЕ потрібно middleware
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
