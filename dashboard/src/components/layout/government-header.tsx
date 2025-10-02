"use client"

import { usePathname } from "next/navigation"
import { Bell, Shield, User, AlertTriangle, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SystemStatus {
  status: "operational" | "warning" | "error"
  uptime: number
  activeAgents: number
  lastUpdate: Date
}

export function GovernmentHeader() {
  const pathname = usePathname()
  const [systemStatus] = useState<SystemStatus>({
    status: "operational",
    uptime: 99.7,
    activeAgents: 6,
    lastUpdate: new Date()
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = [{ label: "Overview", href: "/" }]
    
    let currentPath = ""
    segments.forEach((segment) => {
      currentPath += `/${segment}`
      const label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
      breadcrumbs.push({ label, href: currentPath })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // System status indicator
  const StatusIndicator = () => {
    const statusConfig = {
      operational: {
        icon: CheckCircle,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        label: "Operational"
      },
      warning: {
        icon: AlertTriangle, 
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        label: "Warning"
      },
      error: {
        icon: AlertTriangle,
        color: "text-red-600", 
        bg: "bg-red-50",
        border: "border-red-200",
        label: "Error"
      }
    }

    const config = statusConfig[systemStatus.status]
    const Icon = config.icon

    return (
      <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full border", config.bg, config.border)}>
        <Icon className={cn("h-4 w-4", config.color)} />
        <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
        <Badge variant="outline" className="text-xs border-slate-300 text-slate-700">
          {systemStatus.activeAgents} Agents
        </Badge>
      </div>
    )
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section: Breadcrumbs */}
        <div className="flex items-center space-x-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="font-semibold text-slate-900">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href} className="text-slate-600 hover:text-slate-900">
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right Section: Status and User */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* System Status - Hidden on small mobile, visible on tablet+ */}
          <div className="hidden md:block">
            <StatusIndicator />
          </div>

          {/* Jurisdiction Authority - Responsive sizing */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-blue-700 whitespace-nowrap">
              <span className="hidden sm:inline">U.S. Federal Jurisdiction</span>
              <span className="sm:hidden">U.S. Federal</span>
            </span>
          </div>

          {/* Notifications - Hidden on smallest mobile */}
          <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg hidden xs:block">
            <Bell className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">3</span>
            </div>
          </button>

          {/* User Menu - Compact on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-slate-900 text-white">
                    VK
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-semibold text-slate-900">Vivek Kotecha</div>
                  <div className="text-xs text-slate-600">Admin</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 z-[60] bg-white shadow-xl border border-slate-200">
              <DropdownMenuLabel className="text-slate-900">Governance Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-slate-700">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-700">
                <Shield className="mr-2 h-4 w-4" />
                <span>Security Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <span>Emergency Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Real-time Status Bar - Responsive */}
      <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <span className="whitespace-nowrap">Uptime: <span className="font-semibold text-slate-900">{systemStatus.uptime}%</span></span>
          <span className="hidden sm:inline">•</span>
          <span className="whitespace-nowrap hidden sm:inline">Last Updated: <span className="font-semibold text-slate-900">{mounted ? systemStatus.lastUpdate.toLocaleTimeString() : "Loading..."}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="whitespace-nowrap">Live Monitoring</span>
        </div>
      </div>
    </header>
  )
}
