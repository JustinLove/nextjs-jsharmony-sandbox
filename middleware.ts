import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type RedirectEntry = {
  redirect_key: number,
  redirect_url: string,
  redirect_url_type: string, //'BEGINS'|'BEGINSICASE'|'EXACT'|'EXACTICASE'|'REGEX'|'REGEXICASE',
  redirect_dest: string,
  redirect_http_code: string, //'301'|'302'|'PASSTHRU',
}
 
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  let redirectData: RedirectEntry[];
  try {
    redirectData = await import('./public/cms/jshcms_redirects.json');
  } catch {
    return NextResponse.next()
  }

  if (redirectData && redirectData.length > 0) {
    const redirectEntry: RedirectEntry = Array.prototype.find.call(redirectData, function(entry: RedirectEntry) {
      return entry.redirect_url == pathname;
    });
    if (redirectEntry) {
      switch(redirectEntry.redirect_http_code) {
        case '301': return NextResponse.redirect(new URL(redirectEntry.redirect_dest, request.url), 301);
        case '302': return NextResponse.redirect(new URL(redirectEntry.redirect_dest, request.url), 302);
        case 'PASSTHRU': return NextResponse.rewrite(new URL(redirectEntry.redirect_dest, request.url));
      }
    }
    //const statusCode = redirectEntry.permanent ? 308 : 307
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}