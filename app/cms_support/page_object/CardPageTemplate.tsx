import { Title, Card, Grid } from '@tremor/react';
import { Page, CmsStyleTag, CmsScriptTag, CmsHeadTag, CmsEditorTag, CmsContentArea, CmsFooterTag } from 'jsharmony-cms-sdk-next';

export default async function CardPageTemplate({
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
        <CmsContentArea cms-content="body" page={page} /> {/* cms complains if we don't have this */}
        <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
          <Card key="left">
            <Title>Left</Title>
            <CmsContentArea cms-content="left" page={page}>Left</CmsContentArea>
          </Card>
          <Card key="right">
            <Title>right</Title>
            <CmsContentArea cms-content="right" page={page}>Right</CmsContentArea>
          </Card>
        </Grid>
      </main>
      <CmsFooterTag page={page}/>
    </>
  );
}
