import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Metadata, ResolvingMetadata } from 'next'
import { getStandalone, generateBasicMetadata, pathResolve, getBlankPage, Page, cmsStyleTag, cmsHeadTag, cmsScriptTag, cmsEditorTag } from './jsHarmonyCmsPage';

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

//hasPageObject - Check if a page object file exists to decide if a route is available.
//Parameters:
//  request: (NextRequest) Request object providing target path and origin
//  content_path: (string) Path to CMS output folder
//  default_document: (string) default document if not in url, e.g. 'index.html'
//Returns: (boolean)
export async function hasPageObject(request: NextRequest, content_path : string, default_document : string) {
  const variations = pathResolve(content_path, request.nextUrl.pathname, default_document);

  for (let i in variations) {
    const pathname = variations[i];
    const url = new URL(pathname, request.nextUrl.origin);
    const pageResponse = await fetch(url);
    if (pageResponse.ok) return true;
  }

  return false;
}

//getRedirect - Looks up matching redirect, if any.
//Parameters:
//  request: (NextRequest) Request object providing target path and origin
//  redirect_listing_path: (string) Path to exported CMS redirects
//Returns: (RedirectObject) path and code if found
export async function getRedirect(request: NextRequest, redirect_listing_path : string) : Promise<RedirectObject | undefined> {
  const pathname = request.nextUrl.pathname;

  let redirectData: RedirectEntry[] = await loadRedirectData(redirect_listing_path, request.nextUrl.origin);

  if (redirectData && redirectData.length > 0) {
    return matchRedirect(redirectData, pathname);
  }
}

//defaultRedirects - Provides simple handling of redirects in Next.js, replace as needed.
//Parameters:
//  redirectObject: (RedirectObject) Path and code of a found redirect
//  requestUrl: (string|URL) Original request url
//Returns: (NextResponse) Response, if a valid redirect was provided.
export function defaultRedirects(redirectObject : RedirectObject, requestUrl : string | URL | undefined) : NextResponse | undefined {
  switch(redirectObject.http_code) {
    case '301': return NextResponse.redirect(new URL(redirectObject.url, requestUrl), 301);
    case '302': return NextResponse.redirect(new URL(redirectObject.url, requestUrl), 302);
    case 'PASSTHRU': return NextResponse.rewrite(new URL(redirectObject.url, requestUrl));
  }
}

//routeRedirects - Small helper function to look up and execute redirects
//Parameters:
//  request: (NextRequest) Request object providing target path and origin
//  redirect_listing_path: (string) Path to exported CMS redirects
//Returns: (NextResponse) Response, if a redirect was found
export async function routeRedirects(request: NextRequest, redirect_listing_path : string) : Promise<NextResponse | undefined> {
  const redirectObject = await getRedirect(request, redirect_listing_path);
  if (redirectObject) return defaultRedirects(redirectObject, request.url);
}

//loadRedirectData - Load and parse the redirects file
//Parameters:
//  redirect_listing_path: (string) Path to exported CMS redirects
//Returns: (Array(RedirectEntry)) List of redirects
export async function loadRedirectData(redirect_listing_path : string, origin : string) : Promise<RedirectEntry[]> {
  const url = new URL(redirect_listing_path, origin);

  const response = await fetch(url);
  if (response.ok) {
    return await response.json() || [];
  }

  return [];
}

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export interface jsHarmonyConfig {
  content_path?: string,
  content_url?: string,
  redirect_listing_path?: string | null,
  default_document?: string,
  cms_server_urls: string[],
}

export interface jsHarmonyCmsRouter {
  content_path: string,
  content_url: string,
  redirect_listing_path: string | null,
  cms_server_urls: string[],
  default_document: string,
  getRedirectListingPath(): string | undefined,
  getRedirectData(origin : string): Promise<RedirectEntry[]>,
  getRedirect(request: NextRequest) : Promise<RedirectObject | undefined>,
  routeRedirects(request: NextRequest) : Promise<NextResponse | undefined>,
  hasPageObject(request: NextRequest) : Promise<boolean>,
  getStandalone(pathname: string | string[] | undefined, searchParams: { [key: string]: string | string[] | undefined }) : Promise<Page>,
  getBlankPage() : Page,
  generateBasicMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
  ): Promise<Metadata>,
  styleTag(page: Page) : React.JSX.Element | undefined,
  scriptTag(page: Page) : React.JSX.Element | undefined,
  headTag(page: Page) : React.JSX.Element | undefined,
  editorTag(page: Page) : React.JSX.Element | undefined,
}

export function jsHarmonyCmsRouter(this: jsHarmonyCmsRouter, config : jsHarmonyConfig) : jsHarmonyCmsRouter {
  var _this = this;

  //==========
  //Parameters
  //==========
  config = extend({
    content_path: '.',              //(string) File path to published CMS content files
    content_url: '',                //(string) Url of the server hosting content_path, usually the same server.
    redirect_listing_path: null,    //(string) Path to redirect listing JSON file (relative to content_path)
    default_document: 'index.html', //(string) Default Directory Document
    //strict_url_resolution: false,   //(bool) Whether to support URL variations (appending "/" or Default Document)
    //passthru_timeout: 30,           //(int) Maximum number of seconds for passthru request
    //cms_clientjs_editor_launcher_path: '/.jsHarmonyCms/jsHarmonyCmsEditor.js', //(string) Path where router will serve the client-side JS script that launches CMS Editor
    cms_server_urls: [],            //Array(string) The CMS Server URLs that will be enabled for Page Editing (set to '*' to enable any remote CMS)
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
      else return _this.content_path + '/' + redirect_listing_path;
    }
    return redirect_listing_path;
  }

  //getRedirectData - Get CMS Redirect Data
  //Parameters:
  //  origin: (string) http origin
  //Returns Array(object) Redirects
  //Redirect Object {
  //    http_code: (string) '301', '302', or 'PASSTHRU',
  //    url: (string) 'destination/url',
  //}
  this.getRedirectData = async function(origin : string) : Promise<RedirectEntry[]> {
    var redirect_listing_path = _this.getRedirectListingPath();
    if(!redirect_listing_path) return [];
    return await loadRedirectData(redirect_listing_path, origin);
  }

  //getRedirect - Lookup the redirect for a request, if any
  //Parameters:
  //  request: (NextRequest) Request object providing target path and origin
  //Returns (RedirectObject) Appropriate redirect, if one was found
  //Redirect Object {
  //    http_code: (string) '301', '302', or 'PASSTHRU',
  //    url: (string) 'destination/url',
  //}
  this.getRedirect = async function(request: NextRequest) : Promise<RedirectObject | undefined> {
    var redirect_listing_path = _this.getRedirectListingPath();
    if(!redirect_listing_path) return;
    return await getRedirect(request, redirect_listing_path);
  }

  //routeRedirects - Execute the redirect for a request, if any
  //Parameters:
  //  request: (NextRequest) Request object providing target path and origin
  //Returns (NextResponse) Appropriate response, if one was found
  this.routeRedirects = async function(request: NextRequest) : Promise<NextResponse | undefined> {
    const redirect = await this.getRedirect(request);
    if (redirect) return defaultRedirects(redirect, request.url); 
  }

  //hasPageObject - Check if a page object file exists to decide if a route is available.
  //Parameters:
  //  request: (NextRequest) Request object providing target path and origin
  //Returns: (boolean)
  this.hasPageObject = async function(request: NextRequest) {
    return await hasPageObject(request, this.content_path, this.default_document);
  }

  //getStandalone [Main Entry Point] - Get CMS Page Data for Standalone Integration
  //Parameters:
  //  pathname: (string) Root relative path being requested
  //  searchParams: (object) Request url parameters
  //Returns (object) Page Object, with additional properties: isInEditor, editorContent, notFound
  //                 * if page is opened from CMS Editor or Not Found, an empty Page Object will be returned
  //Page Object {
  //  seo: {
  //      title (string),   //Title for HEAD tag
  //      keywords (string),
  //      metadesc (string),
  //      canonical_url (string)
  //  },
  //  css (string),
  //  js (string),
  //  header (string),
  //  footer (string),
  //  title (string),      //Title for Page Body Content
  //  content: {
  //      <content_area_name>: <content> (string)
  //  }
  //  properties: {
  //      <property_name>: <property_value>
  //  }
  //  page_template_id (string),
  //  isInEditor (bool),     //Whether the page was opened from the CMS Editor
  //  editorScript (string), //If page was opened from a CMS Editor in config.cms_server_urls, the HTML script to launch the Editor
  //  notFound (bool)        //Whether the page was Not Found (page data will return empty)
  //}
  this.getStandalone = async function(pathname: string | string[] | undefined, searchParams: { [key: string]: string | string[] | undefined }) {
    return await getStandalone(pathname, searchParams, this);
  }

  //getBlankPage - An empty Page object, for blank editors or initializing useState
  this.getBlankPage = getBlankPage;

  //generateBasicMetadata - provides a basic version of a Next.js metadata function that provides CMS SEO data. If you application has additional metadata needs, you may wish to copy the base function into your generateMetadata function.
  // https://nextjs.org/docs/app/api-reference/functions/generate-metadata
  this.generateBasicMetadata = async function(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
  ): Promise<Metadata> {
    return await generateBasicMetadata({params, searchParams}, parent, this);
  }

  //================
  //Tag Helpers
  //================
  //Simple tag helpers for conditionally including tags in pages. These are trivial and can be replaced with custom code as needed.
  //Note: CMS was designed to support additional head tags. Next.js App Router takes full control of the head, so these must be placed elsewhere.

  //cmsStyleTag - render additional css (if any) as a style tag
  //Parameters:
  //  cmsPage (Page)
  this.styleTag = cmsStyleTag;
  //cmsScriptTag - render additional javascript (if any) as a script tag
  //Parameters:
  //  cmsPage (Page)
  this.scriptTag = cmsScriptTag;
  //cmsHeadTag - render additional head tags (if any). Note that this feature in particular is questionable with the Next.js App Router.
  //Parameters:
  //  cmsPage (Page)
  this.headTag = cmsHeadTag;
  //cmsEditorTag - render editor support script when page is loaded in the CMS editor.
  //Parameters:
  //  cmsPage (Page)
  this.editorTag = cmsEditorTag;

  return this;
}

function extend(dst : any, src : any){
  if(src){
    for(var key in src) dst[key] = src[key];
  }
  return dst;
}