
import { Metadata, ResolvingMetadata } from 'next'
import { Title } from '@tremor/react';
import Script from 'next/script'

interface Page {
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

async function getDummyPage() {
  return {
    seo: {
      title: 'head title',
      keywords: 'keywords,bro',
      metadesc: 'metadesc',
      canonical_url: 'http://localhost:3000/cms_support',
    },
    css: 'body {color: red;}',
    js: 'console.log("hi")',
    header: null,//'<meta foo="bar">',
    footer: '<strong>Footer</strong>',
    title: 'title',
    content: {
      body: '<strong>body</strong>',
    },
    properties: {},
    isInEditor: false,
    editorScript: '',
  };
}

async function getPage(pathname : string | string[] | undefined) {
  if (typeof(pathname) !== 'string') return;
  const url = new URL('/cms'+pathname, process.env.CMS_URL);
  const pageResponse = await fetch(url); // next fetch is cached, so this can be shared between metadata and content
  if (pageResponse.ok) {
    const page = await pageResponse.json();
    return page;
  }

  return getDummyPage();
}

export async function generateMetadata(
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

function cmsStyle(cmsPage : Page) {
  if (cmsPage.css) {
    return (
      <style type="text/css" dangerouslySetInnerHTML={{ __html: cmsPage.css || ''}}></style>
    );
  }
}

function cmsScript(cmsPage : Page) {
  if (cmsPage.js) {
    return (
      <Script type="text/javascript" dangerouslySetInnerHTML={{ __html: cmsPage.js || ''}}></Script>
    );
  }
}

function cmsHead(cmsPage : Page) {
  if (cmsPage.header) {
    return (
      <div dangerouslySetInnerHTML={{ __html: cmsPage.header || ''}}></div>
    );
  }
}

function cmsEditor(cmsPage : Page) {
  if (cmsPage.editorScript) {
    return (
      <div dangerouslySetInnerHTML={{ __html: cmsPage.editorScript || ''}}></div>
    );
  }
}

export default async function TemplatePage({
  _params,
  searchParams,
}: {
  _params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const cmsPage = await getPage(searchParams.url);
  console.log('content', cmsPage);

  return (
    <>
      {cmsStyle(cmsPage)}
      {cmsScript(cmsPage)}
      {cmsHead(cmsPage)}
      {cmsEditor(cmsPage)}
      <Script className="removeOnPublish" src="/jsHarmonyCmsEditor.js"/>
      <Script className="removeOnPublish" id="jsHarmonyCmsEditorScript">
      {'let tryLoad = function() {if (window.jsHarmonyCmsEditor) window.jsHarmonyCmsEditor({"access_keys":["fbdf1b857086c6250b1ade0f5c204c195ba89b708ce23ec713fed72d57d53f359d20930966001dabf3a891e31328b203"]}); else setTimeout(tryLoad, 10);}; tryLoad();'}
      </Script>
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <Title cms-title="true">{cmsPage.title}</Title>
        <div cms-content-editor="page.content.body" dangerouslySetInnerHTML={{ __html: cmsPage.content.body || ''}}></div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: cmsPage.footer || ''}}></div>
    </>
  );
}
