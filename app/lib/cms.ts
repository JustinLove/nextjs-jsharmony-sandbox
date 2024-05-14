import { jsHarmonyCmsRouter } from 'jsharmony-cms-sdk-next';

export default new (jsHarmonyCmsRouter as any)({
  content_path: process.env.CMS_CONTENT_PATH,
  content_url: process.env.CMS_CONTENT_URL,
  cms_server_urls: [process.env.CMS_SERVER_URL||''],
  redirect_listing_path: '/cms/jshcms_redirects.json',
});