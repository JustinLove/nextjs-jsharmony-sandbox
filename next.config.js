/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh'
      }
    ]
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/:url((?!cms).*)',
          destination: '/cms_support/page_object',
        },
      ],
    };
  },
  env: {
    CMS_CONTENT_PATH: process.env.CMS_CONTENT_PATH,
    CMS_CONTENT_URL: process.env.CMS_CONTENT_URL,
    CMS_SERVER_URL: process.env.CMS_SERVER_URL,
  }
};

module.exports = nextConfig;
