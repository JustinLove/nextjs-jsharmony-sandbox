import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

//matchRedirect - Check if URL matches redirects and return first match
//Parameters:
//  redirects: Array(object) Array of CMS Redirects
//  urlpath: (string) Target URL path
//Returns: (object) Redirect Object
//Redirect Object {
//  http_code: '301', '302', or 'PASSTHRU',
//  url: 'destination/url',
//}
export function matchRedirect(redirects : RedirectEntry[], urlpath : string) : RedirectObject | undefined {
  if(!urlpath || (urlpath[0] != '/')) urlpath = '/' + urlpath;

  if(redirects && redirects.length){
    for(var i=0;i<redirects.length;i++){
      var redirect = redirects[i];
      if(!redirect) continue;
      var cmpurlpath = (redirect.redirect_url||'').toString();
      var desturl = (redirect.redirect_dest||'').toString();
      if(redirect.redirect_url_type=='EXACT'){
        if(urlpath != cmpurlpath) continue;
      }
      else if(redirect.redirect_url_type=='EXACTICASE'){
        if(urlpath.toLowerCase() != cmpurlpath.toLowerCase()) continue;
      }
      else if(redirect.redirect_url_type=='BEGINS'){
        if(!urlpath.startsWith(cmpurlpath)) continue;
      }
      else if(redirect.redirect_url_type=='BEGINSICASE'){
        if(!urlpath.toLowerCase().startsWith(cmpurlpath.toLowerCase())) continue;
      }
      else if((redirect.redirect_url_type=='REGEX')||(redirect.redirect_url_type=='REGEXICASE')){
        var rxMatch = urlpath.match(new RegExp(cmpurlpath,((redirect.redirect_url_type=='REGEXICASE')?'i':'')));
        if(!rxMatch) continue;
        for(var j=rxMatch.length;j>=1;j--){
          desturl = desturl.replaceAll('$'+j.toString(), rxMatch[j]);
        }
      }
      return {
        http_code: redirect.redirect_http_code,
        url: desturl,
      };
    }
  }
  return undefined;
}

type RedirectEntry = {
  redirect_key: number,
  redirect_url: string,
  redirect_url_type: string, //'BEGINS'|'BEGINSICASE'|'EXACT'|'EXACTICASE'|'REGEX'|'REGEXICASE',
  redirect_dest: string,
  redirect_http_code: string, //'301'|'302'|'PASSTHRU',
}

type RedirectObject = {
  http_code: string, //'301'|'302'|'PASSTHRU',
  url: string,
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
    const redirectObject = matchRedirect(redirectData, pathname);
    if (redirectObject) {
      switch(redirectObject.http_code) {
        case '301': return NextResponse.redirect(new URL(redirectObject.url, request.url), 301);
        case '302': return NextResponse.redirect(new URL(redirectObject.url, request.url), 302);
        case 'PASSTHRU': return NextResponse.rewrite(new URL(redirectObject.url, request.url));
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