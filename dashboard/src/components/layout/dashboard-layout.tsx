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
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "transition-all duration-300 ease-in-out z-40",
          "fixed lg:static inset-y-0 left-0",
          "lg:w-72",
          sidebarOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0"
        )}>
          <GovernmentSidebar className="h-full" />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          {/* Header */}
          <GovernmentHeader />
          
          {/* Page Content */}
          <main className={cn("flex-1 overflow-auto p-4 sm:p-6", className)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

