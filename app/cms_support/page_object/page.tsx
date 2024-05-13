import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation';
import { Title } from '@tremor/react';
import cms from '../../lib/cms';

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return await cms.generateBasicMetadata({params, searchParams}, parent);
}

export default async function TemplatePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const cmsPage = await cms.getStandalone(searchParams.url, searchParams);

  if (cmsPage.notFound) notFound();

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
