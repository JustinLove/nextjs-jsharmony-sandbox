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

  if (await hasPageObject(request, '/cms')) {
    return NextResponse.rewrite(new URL('/cms_support/page_object?url='+encodeURIComponent(pathname), request.url));
  }
}

export async function hasPageObject(request: NextRequest, content_path : string) {
  const pathname = request.nextUrl.pathname;

  const url = new URL(content_path+pathname, request.nextUrl.origin);
  const pageResponse = await fetch(url);
  return !!pageResponse.ok;
}

export async function routeRedirects(request: NextRequest, redirect_listing_path : string) {
  const pathname = request.nextUrl.pathname;

  let redirectData: RedirectEntry[] = await loadRedirectData(redirect_listing_path, request.nextUrl.origin);

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

export async function loadRedirectData(redirect_listing_path : string, origin : string) : Promise<RedirectEntry[]> {
  const url = new URL(redirect_listing_path, origin);

  const response = await fetch(url);
  if (response.ok) {
    return await response.json() || [];
  }

  return [];
}

export async function router(request: NextRequest) {
  const pageResponse = await routePages(request);
  if (pageResponse) return pageResponse;

  const redirectResponse = await routeRedirects(request, '/cms/jshcms_redirects.json');
  if (redirectResponse) return redirectResponse;
}

export interface jsHarmonyConfig {
  content_path?: string,
  redirect_listing_path?: string | null,
  default_document?: string,
}

export interface jsHarmonyCmsRouter {
  content_path: string,
  redirect_listing_path: string | null,
  default_document: string,
  getRedirectListingPath(): string | undefined,
  getRedirectData(origin : string): Promise<RedirectEntry[]>,
}

export function jsHarmonyCmsRouter(this: jsHarmonyCmsRouter, config : jsHarmonyConfig) : jsHarmonyCmsRouter {
  var _this = this;

  //==========
  //Parameters
  //==========
  config = extend({
    content_path: '.',              //(string) File path to published CMS content files
    redirect_listing_path: null,    //(string) Path to redirect listing JSON file (relative to content_path)
    default_document: 'index.html', //(string) Default Directory Document
    //strict_url_resolution: false,   //(bool) Whether to support URL variations (appending "/" or Default Document)
    //passthru_timeout: 30,           //(int) Maximum number of seconds for passthru request
    //cms_clientjs_editor_launcher_path: '/.jsHarmonyCms/jsHarmonyCmsEditor.js', //(string) Path where router will serve the client-side JS script that launches CMS Editor
    //cms_server_urls: [],            //Array(string) The CMS Server URLs that will be enabled for Page Editing (set to '*' to enable any remote CMS)
                                    //  * Used by page.editorScript, and the getEditorScript function
                                    //  * NOT used by jsHarmonyCmsEditor.js - the launcher instead uses access_keys for validating the remote CMS
  }, config);

  //=================
  //Private Properties
  //=================
  extend(this, config);
  if(!_this.content_path) throw new Error('CMS Configuration Error - content_path parameter is required');

  //getRedirectListingPath - Get the configured path for the redirect listing file
  this.getRedirectListingPath = function() : string | undefined {
    var redirect_listing_path = _this.redirect_listing_path;
    if(!redirect_listing_path) return;
    if(redirect_listing_path.charAt(0) !== '/'){
      if (_this.content_path.endsWith('/')) return _this.content_path + redirect_listing_path;
      else return  _this.content_path + '/' + redirect_listing_path;
    }
    return redirect_listing_path;
  }

  //getRedirectData - Get CMS Redirect Data
  //Returns Array(object) Redirects
  this.getRedirectData = async function(origin : string) : Promise<RedirectEntry[]> {
    var redirect_listing_path = _this.getRedirectListingPath();
    if(!redirect_listing_path) return [];
    return await loadRedirectData(redirect_listing_path, origin);
  }

  return this;
}

function extend(dst : any, src : any){
  if(src){
    for(var key in src) dst[key] = src[key];
  }
  return dst;
}