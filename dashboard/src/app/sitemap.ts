import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://x402refunds.com'
  
  // Static routes with priorities and update frequencies
  const now = new Date().toISOString();
  
  const routes: MetadataRoute.Sitemap = [
    // Homepage - highest priority
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    
    // Documentation - critical for SEO and AI discoverability
    {
      url: `${baseUrl}/docs/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    
    // Developer API documentation
    {
      url: `${baseUrl}/developers/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    
    // How it works - process explanation
    {
      url: `${baseUrl}/how-it-works/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    
    // File refund request (web form)
    {
      url: `${baseUrl}/request-refund/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    
    // Public dispute registry
    {
      url: `${baseUrl}/disputes/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    
    // Public registry
    {
      url: `${baseUrl}/registry/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    
    // Link relation specifications
    {
      url: `${baseUrl}/rel/refund-request/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rel/refund-contact/`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    
    // Uptime status
    {
      url: `${baseUrl}/uptime/`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    
    // About and pricing
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
    
    // Auth pages (lower priority)
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
  ]

  return routes
}
