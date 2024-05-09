
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation';
import Script from 'next/script'

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
export interface Page {
  content: { [areaId: string]: string };
  css: string;
  editorScript: React.JSX.Element | undefined;
  footer: string;
  header: string;
  isInEditor: boolean;
  js: string;
  page_template_id: string;
  properties: { [propName: string]: any };
  seo: {
    canonical_url: string;
    keywords: string;
    metadesc: string;
    title: string;
  };
  title: string;
}

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

//getBlankPage - An empty Page object, for blank editors or initializing useState
export function getBlankPage(): Page {
  return {
    seo: {
      title: '',
      keywords: '',
      metadesc: '',
      canonical_url: '',
    },
    css: '',
    js: '',
    header: '',
    footer: '',
    title: '',
    content: {
      body: '',
    },
    properties: {},
    page_template_id: '',
    isInEditor: false,
    editorScript: undefined,
  };
}

export interface getPageConfig {
  content_path: string,
  content_url: string | undefined,
  default_document: string,
}

//getPage - Get CMS Page Data
//Parameters:
//  pathname: (string) Root-relative Page URL
//  config: (object) Configuratoin parameters {
//    content_path: (string) CMS content export folder
//    content_url: (string) CMS content origin server
//    default_document: (string) default document if not in url, e.g. 'index.html'
//  }
//Returns (object) Page Object
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
//  },
//  properties: {
//      <property_name>: <property_value>
//  },
//  page_template_id (string)
//}
export async function getPage(pathname : string | string[] | undefined, config : getPageConfig) : Promise<Page> {
  if (typeof(pathname) !== 'string') return getBlankPage();
  const variations = pathResolve(config.content_path, pathname, config.default_document);
  for (let i in variations) {
    const pathname = variations[i];
    const url = new URL(pathname, config.content_url);
    const pageResponse = await fetch(url); // next fetch is cached, so this can be shared between metadata and content
    if (pageResponse.ok) {
      const page = await pageResponse.json();
      return page;
    }
  }

  return getBlankPage();
}

//generateBasicMetadata - provides a basic version of a Next.js metadata function that provides CMS SEO data. If you application has additional metadata needs, you may wish to copy this function into your generateMetadata function.
//Since this is intended to be usable directly as your pages generateMetadata function, it must get configuration from the environment.
//  CMS_CONTENT_PATH - CMS export folder path
//  CMS_CONTENT_URL - CMS export origin server
// https://nextjs.org/docs/app/api-reference/functions/generate-metadata
export async function generateBasicMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const cmsPage = await getPage(searchParams.url, {
    content_path:  process.env.CMS_CONTENT_PATH || '',
    content_url: process.env.CMS_CONTENT_URL,
    default_document: process.env.CMS_DEFAULT_DOCUMENT || 'index.html',
  });
  let pageMeta : Metadata = {};
  if (cmsPage.seo.title) pageMeta.title = cmsPage.seo.title;
  if (cmsPage.seo.keywords) pageMeta.keywords = cmsPage.seo.keywords;
  if (cmsPage.seo.metadesc) pageMeta.description = cmsPage.seo.metadesc;
  if (cmsPage.seo.canonical_url) pageMeta.alternates = {canonical: cmsPage.seo.canonical_url};
  return pageMeta;
}

//================
//Tag Helpers
//================
//Simple tag helpers for conditionally including tags in pages. These are trivial and can be replaced with custom code as needed.
//Note: CMS was designed to support additional head tags. Next.js App Router takes full control of the head, so these must be placed elsewhere.

//cmsStyleTag - render additional css (if any) as a style tag
//Parameters:
//  cmsPage (Page)
export function cmsStyleTag(cmsPage : Page) {
  if (cmsPage.css) {
    return (
      <style type="text/css" dangerouslySetInnerHTML={{ __html: cmsPage.css || ''}}></style>
    );
  }
}

//cmsScriptTag - render additional javascript (if any) as a script tag
//Parameters:
//  cmsPage (Page)
export function cmsScriptTag(cmsPage : Page) {
  if (cmsPage.js) {
    return (
      <Script type="text/javascript" dangerouslySetInnerHTML={{ __html: cmsPage.js || ''}}></Script>
    );
  }
}

//cmsHeadTag - render additional head tags (if any). Note that this feature in particular is questionable with the Next.js App Router.
//Parameters:
//  cmsPage (Page)
export function cmsHeadTag(cmsPage : Page) {
  if (cmsPage.header) {
    return (
      <div dangerouslySetInnerHTML={{ __html: cmsPage.header || ''}}></div>
    );
  }
}

//cmsEditorTag - render editor support script when page is loaded in the CMS editor.
//Parameters:
//  cmsPage (Page)
export function cmsEditorTag(cmsPage : Page) {
  if (cmsPage.editorScript) {
    return cmsPage.editorScript;
  }
}

//getEditorScript - Generate script for CMS Editor
//Parameters:
//  cms_server_url: (string) - URL from jshcms_url parameter
//  cms_server_urls: Array(string) - list of allowed CMS editor servers
//Returns (Element) HTML Code to launch the CMS Editor
//  * The provided url is validated against cms_server_urls
//  * If the CMS Server is not found in cms_server_urls, an empty element will be returned
export function getEditorScript(cms_server_url : string, cms_server_urls : string[]) {
  //Validate URL
  var foundMatch = false;
  var curUrl = new URL(cms_server_url);
  for(var i=0;i<cms_server_urls.length;i++){
    var testUrl = (cms_server_urls[i]||'').toString();
    if(!testUrl) continue;
    if(testUrl=='*'){ foundMatch = true; break; }
    try{
      var parsedUrl = new URL(testUrl);
      var strEqual = function(a : string | undefined,b : string | undefined){ return (a||'').toString().toLowerCase() == (b||'').toString().toLowerCase(); }
      var strPortEqual = function(a : string | undefined,b : string | undefined,protocolA : string,protocolB : string){
        if(!a && (protocolA=='https:')) a = '443';
        if(!b && (protocolB=='https:')) b = '443';
        if(!a && (protocolA=='http:')) a = '80';
        if(!b && (protocolB=='http:')) b = '80';
        return strEqual(a,b);
      }
      if(parsedUrl.protocol && !strEqual(curUrl.protocol, parsedUrl.protocol)) continue;
      if(!strEqual(curUrl.hostname, parsedUrl.hostname)) continue;
      if(!strPortEqual(curUrl.port, parsedUrl.port, curUrl.protocol, parsedUrl.protocol||curUrl.protocol)) continue;
      var parsedPath = parsedUrl.pathname || '/';
      var curPath = curUrl.pathname || '/';
      if(curPath.indexOf(parsedPath)===0){ foundMatch = true; break; }
    }
    catch(ex){
    }
  }
  if(!foundMatch) return <></>;
  return <Script src={encodeURI(joinUrlPath(cms_server_url, 'js/jsHarmonyCMS.js'))}></Script>
}

export interface standaloneConfig {
  content_path: string,
  content_url: string | undefined,
  default_document: string,
  cms_server_urls: string[],
}

//getStandalone [Main Entry Point] - Get CMS Page Data for Standalone Integration
//Parameters:
//  pathname: (string) Root relative path being requested
//  searchParams: (object) Request url parameters
//  config: (object) Configuratoin parameters {
//    content_path: (string) CMS content export folder
//    content_url: (string) CMS content origin server
//    default_document: (string) default document if not in url, e.g. 'index.html'
//    cms_server_urls: Array(string) List of allowed urls for CMS editor servers.
//  }
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
export async function getStandalone(pathname: string | string[] | undefined, searchParams: { [key: string]: string | string[] | undefined }, config : standaloneConfig) {

  if (typeof(pathname) !== 'string') {
    if (searchParams.jshcms_token) pathname = '';
    else notFound(); // throws
  }

  let cmsPage = await getPage(pathname, config);
  if (searchParams && searchParams.jshcms_token && searchParams.jshcms_url) {
    const jshcms_url : string = (searchParams.jshcms_url || '').toString();
    cmsPage.editorScript = getEditorScript(jshcms_url, config.cms_server_urls);
  }
  return cmsPage;
}

//pathToContent - Transform a page url into cms content file path
//Parameters:
//  content_path: (string) CMS content export folder
//  pathname: (string) Root relative path being requested
//Returns (string) normalized path
export function pathToContent(content_path : string, pathname : string) : string {
  if(!pathname) pathname = '';
  //If URL is not absolute, add starting "/"
  if(pathname.indexOf('//')<0){
    if(pathname.indexOf('/') != 0){
      if(pathname.indexOf('\\')==0) pathname = pathname.substr(1);
      pathname = '/' + pathname;
    }
  }

  return joinUrlPath(content_path, pathname);
}

//pathVariations - creations variations of a cms content path to try, e.g. as provided and with index.html
//Parameters:
//  pathname: (string) Root relative path being requested
//  default_document: (string) default document if not in url, e.g. 'index.html'
//Returns Array(string) list of paths to try
export function pathVariations(pathname : string, default_document : string) : string[] {
  //Add trailing slash and "/index.html", if applicable
  if(pathname && ((pathname[pathname.length-1]=='/')||(pathname[pathname.length-1]=='\\'))){
    return [pathname, joinUrlPath(pathname, default_document)];
  } else {
    var url_ext = getExtension(pathname);
    var default_ext = getExtension(default_document);
    if(url_ext && default_ext && (url_ext == default_ext)) return [pathname];
    else {
      return [pathname, joinUrlPath(pathname, default_document)];
    }
  }
}

//pathResolve - Convert URL to CMS Content Paths
//Parameters:
//  content_path: (string) CMS content export folder
//  pathname: (string) Root relative path being requested
//  default_document: (string) default document if not in url, e.g. 'index.html'
//Returns Array(string) list of paths to try
export function pathResolve(content_path: string, pathname : string, default_document : string) : string[] {
  pathname = pathToContent(content_path, pathname);

  return pathVariations(pathname, default_document);
}

function getExtension(path : string) : string {
  if(!path) return '';
  var lastSlash = 0;
  for(var i=path.length-1;i>=0;i--){
    if((path[i]=='/')||(path[i]=='\\')){ lastSlash = i+1; break; }
  }
  path = path.substr(lastSlash);
  if(!path) return '';
  var lastDot = path.lastIndexOf('.');
  if(lastDot >= 0) path = path.substr(lastDot);
  return path;
}

function joinUrlPath(a : string | undefined,b : string | undefined){
  if(!a) return b||'';
  if(!b) return a||'';
  var aEnd = a[a.length-1];
  var bStart = b[0];
  while(a.length && ((aEnd=='/')||(aEnd=='\\'))){ a = a.substr(0,a.length-1); if(a.length) aEnd=a[a.length-1]; }
  while(b.length && ((bStart=='/')||(bStart=='\\'))){ b = b.substr(1); if(b.length) bStart=b[0]; }
  return a + '/' + b;
}