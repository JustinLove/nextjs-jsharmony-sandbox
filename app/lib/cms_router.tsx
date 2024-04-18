import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type RedirectEntry = {
  redirect_key: number,
  redirect_url: string,
  redirect_url_type: string, //'BEGINS'|'BEGINSICASE'|'EXACT'|'EXACTICASE'|'REGEX'|'REGEXICASE',
  redirect_dest: string,
  redirect_http_code: string, //'301'|'302'|'PASSTHRU',
}

export async function routePages(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const url = new URL('/cms'+pathname, request.nextUrl.origin);
  const pageResponse = await fetch(url);
  if (pageResponse.ok) {
    const page = await pageResponse.json();
    if (page) {
      return NextResponse.rewrite(new URL('/cms_support/page_object?url='+encodeURIComponent(pathname), request.url));
    }
  }
}

export async function routeRedirects(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let redirectData: RedirectEntry[];
  try {
    redirectData = await import('../../public/cms/jshcms_redirects.json');
  } catch {
    return;
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
  }
}

export async function router(request: NextRequest) {
  const pageResponse = await routePages(request);
  if (pageResponse) return pageResponse;

  const redirectResponse = await routeRedirects(request);
  if (redirectResponse) return redirectResponse;
}