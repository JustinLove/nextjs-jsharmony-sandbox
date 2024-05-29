import { Card, Title, Text } from '@tremor/react';
import Search from './search';
import UsersTable from './table';
import cms from './lib/cms';
import { CmsEditorTag, CmsContentArea, CmsFooterTag } from 'jsharmony-cms-sdk-next';


interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

const allUsers: User[] = [
  {
    id: 1,
    name: 'Me',
    username: 'username',
    email: 'me@site.com',
  },
];

export default async function IndexPage({
  searchParams
}: {
  searchParams: { q: string, jshcms_token: string, jshcms_url: string };
}) {
  const cmsPage = await cms.getStandalone('/index.html', searchParams);

  const search = (searchParams.q ?? '').toLowerCase();
  const users = allUsers.filter(function(user) { return user.name.toLowerCase().indexOf(search) !== -1;});

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      <CmsEditorTag page={cmsPage} />
      <CmsContentArea cms-content="banner" page={cmsPage} />
      <Title cms-title="true">{cmsPage.title}</Title>
      <CmsContentArea cms-content="description" page={cmsPage} >
        A list of users retrieved from a Postgres database.
      </CmsContentArea>
      <Search />
      <Card className="mt-6">
        <UsersTable users={users} />
      </Card>
      <CmsFooterTag page={cmsPage}/>
    </main>
  );
}
