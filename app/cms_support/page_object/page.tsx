
import { Title } from '@tremor/react';
import { notFound } from 'next/navigation';
import { getStandalone, generateBasicMetadata, cmsStyle, cmsScript, cmsHead, cmsEditor } from '../../lib/cms_page';

export const generateMetadata = generateBasicMetadata;

export default async function TemplatePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  let url = searchParams.url;
  if (typeof(url) !== 'string') {
    if (searchParams.jshcms_token) url = '';
    else return notFound();
  }
  const cmsParams = { jshcms_token: (searchParams.jshcms_token || '').toString() };
  const cmsPage = await getStandalone(url, cmsParams);

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
