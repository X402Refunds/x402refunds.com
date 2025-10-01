"use client"

import { useState } from "react"
import { GovernmentSidebar } from "./government-sidebar"
import { GovernmentHeader } from "./government-header"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Mobile menu button - visible only on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white shadow-lg border-slate-300 hover:bg-slate-50 hover:border-blue-600 transition-all"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 text-slate-900" />
          ) : (
            <Menu className="h-5 w-5 text-slate-900" />
          )}
        </Button>
      </div>

      {/* Sidebar overlay on mobile - click to close */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-30 backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - fixed on mobile, static on desktop */}
        <div className={cn(
          "transition-all duration-300 ease-in-out z-40",
          "fixed lg:static inset-y-0 left-0",
          "lg:w-72 bg-white border-r border-slate-200",
          "shadow-2xl lg:shadow-none",
          sidebarOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0"
        )}>
          <GovernmentSidebar className="h-full" onClick={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content - adjusted for mobile menu button */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header */}
          <GovernmentHeader />
          
          {/* Page Content - add top padding on mobile to clear menu button */}
          <main className={cn("flex-1 overflow-auto p-4 sm:p-6 lg:pt-6 pt-16", className)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

