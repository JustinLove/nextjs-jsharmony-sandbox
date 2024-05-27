import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation';
import { Title } from '@tremor/react';
import cms from '../../lib/cms';
import { CmsStyleTag, CmsScriptTag, CmsHeadTag, CmsEditorTag, CmsContentArea, CmsFooterTag } from 'jsharmony-cms-sdk-next';

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
      <CmsStyleTag page={cmsPage} />
      <CmsScriptTag page={cmsPage} />
      <CmsHeadTag page={cmsPage} />
      <CmsEditorTag page={cmsPage} />
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <Title cms-title="true">{cmsPage.title}</Title>
        <CmsContentArea cms-content="body" page={cmsPage}>
          Default Body Content
        </CmsContentArea>
        <CmsContentArea cms-content="missing-with-default" page={cmsPage}>
          Default Missing Content
        </CmsContentArea>
        <CmsContentArea cms-content="missing-with-no-default" page={cmsPage} />
      </main>
      <CmsFooterTag page={cmsPage}/>
    </>
  );
}
