import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {routePages, jsHarmonyCmsRouter } from './app/lib/cms_router'

export async function middleware(request: NextRequest) {

  var cms : jsHarmonyCmsRouter = new (jsHarmonyCmsRouter as any)({
    content_path: '/cms',
    redirect_listing_path: '/cms/jshcms_redirects.json',
  });

  const pageResponse = await routePages(request);
  if (pageResponse) return pageResponse;

  const redirectResponse = cms.routeRedirects(request);
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