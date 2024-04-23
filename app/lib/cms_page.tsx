
import { Metadata, ResolvingMetadata } from 'next'
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
      title: 'head title',
      keywords: 'keywords,bro',
      metadesc: 'metadesc',
      canonical_url: 'http://localhost:3000/cms_support',
    },
    css: 'body {color: red;}',
    js: 'console.log("dummey default page")',
    header: '',//'<meta foo="bar">',
    footer: '<strong>Footer</strong>',
    title: 'title',
    content: {
      body: '<strong>body</strong>',
    },
    properties: {},
    page_template_id: '',
    isInEditor: false,
    editorScript: '',
  };
}

export async function getPage(pathname : string | string[] | undefined) {
  if (typeof(pathname) !== 'string') return getDummyPage();
  const url = new URL('/cms'+pathname, process.env.CMS_URL);
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
  const cmsPage = await getPage(searchParams.url);
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

export function getEditorScript() {
  const cms_server_url = 'https://localhost:8081';
  return <Script src={encodeURI(cms_server_url + '/js/jsHarmonyCMS.js')}></Script>
}

export async function getStandalone(pathname: string, searchParams: { jshcms_token: string | undefined }) {
  let cmsPage = await getPage(pathname);
  if (searchParams && searchParams.jshcms_token) {
    cmsPage.editorScript = getEditorScript();
  }
  return cmsPage;
}
