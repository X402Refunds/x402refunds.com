"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, Users, FileText, Activity, Settings } from "lucide-react"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Agents",
    href: "/dashboard/agents",
    icon: Users,
  },
  {
    title: "Cases",
    href: "/dashboard/cases", 
    icon: FileText,
  },
  {
    title: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

interface GovernmentSidebarProps {
  className?: string
}

export function GovernmentSidebar({ className }: GovernmentSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Consulate</h2>
            <p className="text-xs text-muted-foreground">Agent Management</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="w-4 h-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <p>Version 1.0.0</p>
          <p>System Status: Operational</p>
        </div>
      </div>
    </div>
  )
}