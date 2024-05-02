'use client';

import { Card, Metric, Text, Title, BarList, Flex, Grid } from '@tremor/react';
import Chart from './chart';
import { jsHarmonyCmsRouter } from '../lib/jsHarmonyCmsRouter';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const website = [
  { name: '/home', value: 1230 },
  { name: '/contact', value: 751 },
  { name: '/gallery', value: 471 },
  { name: '/august-discount-offer', value: 280 },
  { name: '/case-studies', value: 78 }
];

const shop = [
  { name: '/home', value: 453 },
  { name: '/imprint', value: 351 },
  { name: '/shop', value: 271 },
  { name: '/pricing', value: 191 }
];

const app = [
  { name: '/shop', value: 789 },
  { name: '/product-features', value: 676 },
  { name: '/about', value: 564 },
  { name: '/login', value: 234 },
  { name: '/downloads', value: 191 }
];

const data = [
  {
    category: 'Website',
    stat: '10,234',
    data: website
  },
  {
    category: 'Online Shop',
    stat: '12,543',
    data: shop
  },
  {
    category: 'Mobile App',
    stat: '2,543',
    data: app
  }
];

export default function PlaygroundPage() {

  const cms : jsHarmonyCmsRouter = new (jsHarmonyCmsRouter as any)({
    content_path: process.env.CMS_CONTENT_PATH,
    content_url: process.env.CMS_CONTENT_URL,
    cms_server_urls: [process.env.CMS_SERVER_URL||''],
  });

  const searchParamsObject = useSearchParams();
  const searchParams = {
    "jshcms_token": searchParamsObject.get('jshcms_token') || undefined,
    "jshcms_url": searchParamsObject.get('jshcms_url') || undefined,
  };
  const pathname = usePathname();
  const [cmsPage, setCmsPage] = useState(cms.getBlankPage());

  async function getcms() {
    const page = await cms.getStandalone(pathname + '/index.html', searchParams);
    setCmsPage(page);
  }
  useEffect(function() { getcms(); }, [pathname, useSearchParams]);
  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl">
      {cms.editorTag(cmsPage)}
      <div cms-content-editor="page.content.banner" dangerouslySetInnerHTML={{ __html: cmsPage.content.banner || ''}}></div>
      <Grid numItemsSm={2} numItemsLg={3} className="gap-6">
        {data.map((item) => (
          <Card key={item.category}>
            <Title>{item.category}</Title>
            <Flex
              justifyContent="start"
              alignItems="baseline"
              className="space-x-2"
            >
              <Metric>{item.stat}</Metric>
              <Text>Total views</Text>
            </Flex>
            <Flex className="mt-6">
              <Text>Pages</Text>
              <Text className="text-right">Views</Text>
            </Flex>
            <BarList
              data={item.data}
              valueFormatter={(number: number) =>
                Intl.NumberFormat('us').format(number).toString()
              }
              className="mt-2"
            />
          </Card>
        ))}
      </Grid>
      <Chart />
      <div cms-content-editor="page.content.footer" dangerouslySetInnerHTML={{ __html: cmsPage.content.footer || ''}}></div>
    </main>
  );
}
