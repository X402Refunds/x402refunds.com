"use client"

import { GovernmentSidebar } from "./government-sidebar"
import { GovernmentHeader } from "./government-header"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const sidebarCollapsed = false

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-72"
        )}>
          <GovernmentSidebar className="h-full" />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <GovernmentHeader />
          
          {/* Page Content */}
          <main className={cn("flex-1 overflow-auto p-6", className)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

