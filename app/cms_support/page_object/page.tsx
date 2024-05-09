import { Metadata, ResolvingMetadata } from 'next'
import { Title } from '@tremor/react';
import { jsHarmonyCmsRouter } from '../../lib/jsHarmonyCmsRouter';

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const cms : jsHarmonyCmsRouter = new (jsHarmonyCmsRouter as any)({
    content_path: process.env.CMS_CONTENT_PATH,
    content_url: process.env.CMS_CONTENT_URL,
    default_document: 'index.html',
  });

  return await cms.generateBasicMetadata({params, searchParams}, parent);
}

export default async function TemplatePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {

  const cms : jsHarmonyCmsRouter = new (jsHarmonyCmsRouter as any)({
    content_path: process.env.CMS_CONTENT_PATH,
    content_url: process.env.CMS_CONTENT_URL,
    cms_server_urls: [process.env.CMS_SERVER_URL||''],
  });

  const cmsPage = await cms.getStandalone(searchParams.url, searchParams);

  return (
    <>
      {cms.styleTag(cmsPage)}
      {cms.scriptTag(cmsPage)}
      {cms.headTag(cmsPage)}
      {cms.editorTag(cmsPage)}
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <Title cms-title="true">{cmsPage.title}</Title>
        <div cms-content-editor="page.content.body" dangerouslySetInnerHTML={{ __html: cmsPage.content.body || ''}}></div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: cmsPage.footer || ''}}></div>
    </>
  );
}
