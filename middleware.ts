import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import cms from './app/lib/cms';

export async function middleware(request: NextRequest) {

  if (await cms.hasPageObject(request)) {
    const pathname = request.nextUrl.pathname;
    return NextResponse.rewrite(new URL('/cms_support/page_object?url='+encodeURIComponent(pathname), request.url));
  }

  const redirectResponse = await cms.routeRedirects(request);
  if (redirectResponse) return redirectResponse;

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