import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')?.value
  const pathname = request.nextUrl.pathname
  
  // Protected routes require access_token
  if (!accessToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  // Всі protected routes - auth pages НЕ потрібно middleware
  matcher: ['/dashboard/:path*', '/admin/:path*', '/withdraw/:path*', '/referral/:path*']
}
