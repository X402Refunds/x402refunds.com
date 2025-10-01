"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, Users, FileText, Activity, Settings, Shield } from "lucide-react"

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
    href: "/agents",
    icon: Users,
  },
  {
    title: "Cases",
    href: "/cases", 
    icon: FileText,
  },
  {
    title: "Activity",
    href: "/activity",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

interface GovernmentSidebarProps {
  className?: string
}

export function GovernmentSidebar({ className }: GovernmentSidebarProps) {
  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-slate-200", className)}>
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900">Consulate</h2>
            <p className="text-xs text-slate-600">Governance OS</p>
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
