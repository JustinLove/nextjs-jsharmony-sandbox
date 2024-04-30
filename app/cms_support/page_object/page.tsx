
import { Title } from '@tremor/react';
import { getStandalone, generateBasicMetadata, cmsStyle, cmsScript, cmsHead, cmsEditor } from '../../lib/jsHarmonyCmsPage';

export const generateMetadata = generateBasicMetadata;

export default async function TemplatePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const cms_server_urls = [process.env.CMS_SERVER_URL||''];
  const cmsPage = await getStandalone(searchParams.url, process.env.CMS_CONTENT_PATH || '', process.env.CMS_CONTENT_URL, searchParams, cms_server_urls);

  return (
    <>
      {cmsStyle(cmsPage)}
      {cmsScript(cmsPage)}
      {cmsHead(cmsPage)}
      {cmsEditor(cmsPage)}
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <Title cms-title="true">{cmsPage.title}</Title>
        <div cms-content-editor="page.content.body" dangerouslySetInnerHTML={{ __html: cmsPage.content.body || ''}}></div>
      </main>
      <div dangerouslySetInnerHTML={{ __html: cmsPage.footer || ''}}></div>
    </>
  );
}
