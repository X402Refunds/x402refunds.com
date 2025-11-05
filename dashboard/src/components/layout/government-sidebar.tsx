"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Users, FileText, Activity, Settings, LayoutDashboard, AlertCircle, Bot } from "lucide-react"
import { useAuth } from "@clerk/nextjs"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  adminOnly?: boolean
}

// Organization-scoped navigation (user's own org data)
const orgNavigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Agents",
    href: "/dashboard/agents",
    icon: Bot,
  },
  {
    title: "Review Queue",
    href: "/dashboard/review-queue",
    icon: AlertCircle,
  },
  {
    title: "Team",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
  },
]

// Demo/public navigation (mock data only)
const demoNavigationItems: NavigationItem[] = [
  {
    title: "System Demo",
    href: "/demo",
    icon: Home,
  },
  {
    title: "All Agents",
    href: "/demo/agents",
    icon: Users,
  },
  {
    title: "All Cases",
    href: "/demo/cases",
    icon: FileText,
  },
  {
    title: "Activity",
    href: "/demo/activity",
    icon: Activity,
    adminOnly: true,
  },
  {
    title: "Settings",
    href: "/demo/settings",
    icon: Settings,
    adminOnly: true,
  },
]

interface GovernmentSidebarProps {
  className?: string
  onClick?: () => void
}

export function GovernmentSidebar({ className, onClick }: GovernmentSidebarProps) {
  const pathname = usePathname()
  let orgRole: string | null | undefined = null
  
  try {
    const auth = useAuth()
    orgRole = auth.orgRole
  } catch {
    // Clerk not initialized - show all items during build
    orgRole = null
  }
  
  // Check if user is admin - either has admin role in organization or is org:admin
  // If orgRole is null/undefined (during build), show all items
  const isAdmin = !orgRole || orgRole === 'org:admin' || orgRole === 'admin'
  
  // Filter demo navigation items based on admin status
  const visibleDemoItems = demoNavigationItems.filter(item => 
    !item.adminOnly || isAdmin
  )
  
  // Determine which section to show based on current route
  const isOnDashboard = pathname?.startsWith('/dashboard')
  const isOnDemo = pathname?.startsWith('/demo')

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-slate-200", className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center group" onClick={onClick}>
          <h2 className="text-lg sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Consulate</h2>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Organization Section - only show on dashboard routes */}
        {isOnDashboard && (
          <div className="mb-6">
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Organization
            </h3>
            <div className="space-y-1">
              {orgNavigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClick}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Demo/Public Section - only show on demo routes */}
        {isOnDemo && (
          <div>
            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Public Demo
            </h3>
            <div className="space-y-1">
              {visibleDemoItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClick}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <div className="text-xs text-slate-600">
          <p className="font-semibold text-slate-900">Version 1.0.0</p>
          <p className="flex items-center mt-1">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            System Operational
          </p>
        </div>
      </div>
    </div>
  )
}
