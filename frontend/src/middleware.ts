import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  console.log('[Middleware DISABLED] pathname:', pathname);
  
  // ТИМЧАСОВО ВИМКНЕНО для debugging redirect loop
  // const accessToken = request.cookies.get('access_token')?.value
  // const isDashboard = pathname.startsWith('/dashboard')
  // const isAdmin = pathname.startsWith('/admin')
  // if ((isDashboard || isAdmin) && !accessToken) {
  //   return NextResponse.redirect(new URL('/auth/login', request.url))
  // }
  
  return NextResponse.next()
}

export const config = {
  // ТІЛЬКИ dashboard/admin - auth pages НЕ потрібно middleware
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
