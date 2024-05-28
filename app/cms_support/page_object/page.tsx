import { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation';
import cms from '../../lib/cms';
import BasicPageTemplate from './BasicPageTemplate';
import CardPageTemplate from './CardPageTemplate';

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

  if (cmsPage.page_template_id == 'Card Page Template') {
    return <CardPageTemplate page={cmsPage} />;
  } else {
    return <BasicPageTemplate page={cmsPage} />;
  }
}
