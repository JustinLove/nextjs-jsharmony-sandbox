import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jsHarmonyCmsRouter } from './app/lib/cms_router'

export async function middleware(request: NextRequest) {

  var cms : jsHarmonyCmsRouter = new (jsHarmonyCmsRouter as any)({
    content_path: process.env.CMS_CONTENT_PATH,
    redirect_listing_path: '/cms/jshcms_redirects.json',
  });

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