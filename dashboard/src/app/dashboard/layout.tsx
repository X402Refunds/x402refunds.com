// Force all dashboard routes to be dynamic so middleware runs
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
