import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import cms from './app/lib/cms';

export async function middleware(request: NextRequest) {

/* This method adds fetches to every request and requires care about conflicts between object pages and standalone page objects
  See next.config for fallback wildcard rewrite version.
  if (await cms.hasPageObject(request)) {
    const pathname = request.nextUrl.pathname;
    return NextResponse.rewrite(new URL('/cms_support/page_object?url='+encodeURIComponent(pathname), request.url));
  }
*/

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