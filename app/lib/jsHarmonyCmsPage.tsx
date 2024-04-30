
import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation';
import Script from 'next/script'

export interface Page {
  content: { [areaId: string]: string };
  css: string;
  editorScript: String;
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

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export function getDummyPage(): Page {
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
    editorScript: '',
  };
}

export async function getPage(pathname : string | string[] | undefined, content_path : string, content_url : string | undefined) {
  if (typeof(pathname) !== 'string') return getDummyPage();
  const url = new URL(content_path+pathname, content_url);
  const pageResponse = await fetch(url); // next fetch is cached, so this can be shared between metadata and content
  if (pageResponse.ok) {
    const page = await pageResponse.json();
    return page;
  }

  return getDummyPage();
}

export async function generateBasicMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const cmsPage = await getPage(searchParams.url,  process.env.CMS_CONTENT_PATH || '', process.env.CMS_CONTENT_URl);
  let pageMeta : Metadata = {};
  if (cmsPage.seo.title) pageMeta.title = cmsPage.seo.title;
  if (cmsPage.seo.keywords) pageMeta.keywords = cmsPage.seo.keywords;
  if (cmsPage.seo.metadesc) pageMeta.description = cmsPage.seo.metadesc;
  if (cmsPage.seo.canonical_url) pageMeta.alternates = {canonical: cmsPage.seo.canonical_url};
  return pageMeta;
}

export function cmsStyle(cmsPage : Page) {
  if (cmsPage.css) {
    return (
      <style type="text/css" dangerouslySetInnerHTML={{ __html: cmsPage.css || ''}}></style>
    );
  }
}

export function cmsScript(cmsPage : Page) {
  if (cmsPage.js) {
    return (
      <Script type="text/javascript" dangerouslySetInnerHTML={{ __html: cmsPage.js || ''}}></Script>
    );
  }
}

export function cmsHead(cmsPage : Page) {
  if (cmsPage.header) {
    return (
      <div dangerouslySetInnerHTML={{ __html: cmsPage.header || ''}}></div>
    );
  }
}

export function cmsEditor(cmsPage : Page) {
  if (cmsPage.editorScript) {
    return cmsPage.editorScript;
  }
}

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

export async function getStandalone(pathname: string | string[] | undefined, content_path : string, content_url : string | undefined, searchParams: { [key: string]: string | string[] | undefined }, cms_server_urls : string[]) {

  if (typeof(pathname) !== 'string') {
    if (searchParams.jshcms_token) pathname = '';
    else notFound(); // throws
  }

  let cmsPage = await getPage(pathname, content_path, content_url);
  if (searchParams && searchParams.jshcms_token && searchParams.jshcms_url) {
    const jshcms_url : string = (searchParams.jshcms_url || '').toString();
    cmsPage.editorScript = getEditorScript(jshcms_url, cms_server_urls);
  }
  return cmsPage;
}

export function joinUrlPath(a : string | undefined,b : string | undefined){
  if(!a) return b||'';
  if(!b) return a||'';
  var aEnd = a[a.length-1];
  var bStart = b[0];
  while(a.length && ((aEnd=='/')||(aEnd=='\\'))){ a = a.substr(0,a.length-1); if(a.length) aEnd=a[a.length-1]; }
  while(b.length && ((bStart=='/')||(bStart=='\\'))){ b = b.substr(1); if(b.length) bStart=b[0]; }
  return a + '/' + b;
}