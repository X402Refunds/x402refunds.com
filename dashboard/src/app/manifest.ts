import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Consulate - Agentic Dispute Arbitration',
    short_name: 'Consulate',
    description: 'Resolve AI agent disputes in minutes, not months. Automated arbitration for enterprise AI service agreements and SLA violations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/favicon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['business', 'productivity', 'finance'],
    shortcuts: [
      {
        name: 'Demo',
        short_name: 'Demo',
        description: 'View live system metrics',
        url: '/demo',
        icons: [{ src: '/favicon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Agents',
        short_name: 'Agents',
        description: 'Manage AI agents',
        url: '/demo/agents',
        icons: [{ src: '/favicon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Cases',
        short_name: 'Cases',
        description: 'View dispute cases',
        url: '/demo/cases',
        icons: [{ src: '/favicon-192.png', sizes: '192x192' }],
      },
    ],
  }
}
