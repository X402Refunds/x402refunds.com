import { Metadata } from 'next'

// Force all dashboard routes to be dynamic so middleware runs
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Live System Dashboard',
    template: '%s - Dashboard | Consulate'
  },
  description: 'Real-time agentic dispute arbitration metrics, active cases, and system performance monitoring.',
  alternates: {
    canonical: 'https://www.consulatehq.com/dashboard/',
  },
  openGraph: {
    title: 'Live System Dashboard - Consulate',
    description: 'Real-time agentic dispute arbitration metrics, active cases, and system performance monitoring.',
    url: 'https://www.consulatehq.com/dashboard/',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
