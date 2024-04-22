import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { router, jsHarmonyCmsRouter } from './app/lib/cms_router'

export async function middleware(request: NextRequest) {

  var cms : jsHarmonyCmsRouter = new (jsHarmonyCmsRouter as any)({
    content_path: '/cms',
    redirect_listing_path: '/cms/jshcms_redirects.json',
  });

  console.log(await cms.getRedirectData(request.nextUrl.origin));

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