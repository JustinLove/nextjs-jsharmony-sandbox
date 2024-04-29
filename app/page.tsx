import conn from './db';
import { Card, Title, Text } from '@tremor/react';
import Search from './search';
import UsersTable from './table';
import { getStandalone, cmsEditor } from './lib/cms_page';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
}

export default async function IndexPage({
  searchParams
}: {
  searchParams: { q: string, jshcms_token: string, jshcms_url: string };
}) {
  const cms_server_urls = [process.env.CMS_SERVER_URL||''];
  const cmsPage = await getStandalone('/index.html', process.env.CMS_CONTENT_PATH || '', process.env.CMS_CONTENT_URL, searchParams, cms_server_urls);
  const search = searchParams.q ?? '';
  const query = `
    SELECT id, name, username, email 
    FROM users 
    WHERE name ILIKE $1::text;`;
  const result = await conn.query(query, ['%' + search + '%']);
  const users = result.rows as User[];

  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      {cmsEditor(cmsPage)}
      <div cms-content-editor="page.content.banner" dangerouslySetInnerHTML={{ __html: cmsPage.content.banner || ''}}></div>
      <Title cms-title="true">{cmsPage.title}</Title>
      <div cms-content-editor="page.content.description" dangerouslySetInnerHTML={{ __html: cmsPage.content.description || 'A list of users retrieved from a Postgres database.'}}></div>
      <Search />
      <Card className="mt-6">
        <UsersTable users={users} />
      </Card>
      <div cms-content-editor="page.content.footer" dangerouslySetInnerHTML={{ __html: cmsPage.content.footer || ''}}></div>
    </main>
  );
}
