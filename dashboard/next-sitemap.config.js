/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://consulatehq.com',
  generateRobotsTxt: false, // We're using app/robots.ts instead
  generateIndexSitemap: false,
  exclude: [
    '/api/*',
    '/sign-in',
    '/sign-up',
    '/dashboard/settings',
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
}
