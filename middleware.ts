import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { router } from './app/lib/cms_router'

export async function middleware(request: NextRequest) {
  const response = await router(request);
  if (response) return response;

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - cms (prevent recursion)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|cms).*)',
  ],
}