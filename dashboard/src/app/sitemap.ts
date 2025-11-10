import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.x402disputes.com'
  
  // Static routes with priorities and update frequencies
  const now = new Date().toISOString();
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/uptime/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/sign-in/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/sign-up/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/pricing/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  return routes
}
