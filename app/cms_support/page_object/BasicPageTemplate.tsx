import { Title } from '@tremor/react';
import { Page, CmsStyleTag, CmsScriptTag, CmsHeadTag, CmsEditorTag, CmsContentArea, CmsFooterTag } from 'jsharmony-cms-sdk-next';

export default async function BasicPageTemplate({
  page
}: {
  page: Page
}) {
  return (
    <>
      <CmsStyleTag page={page} />
      <CmsScriptTag page={page} />
      <CmsHeadTag page={page} />
      <CmsEditorTag page={page} />
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <Title cms-title="true">{page.title}</Title>
        <CmsContentArea cms-content="body" page={page}>
          Default Body Content
        </CmsContentArea>
        <CmsContentArea cms-content="missing-with-default" page={page}>
          Default Missing Content
        </CmsContentArea>
        <CmsContentArea cms-content="missing-with-no-default" page={page} />
      </main>
      <CmsFooterTag page={page}/>
    </>
  );
}
