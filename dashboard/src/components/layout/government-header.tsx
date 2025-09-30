"use client"

import { usePathname } from "next/navigation"
import { Bell, Shield, User, AlertTriangle, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  const systemStatus: SystemStatus = {
    status: "operational",
    uptime: 99.7,
    activeAgents: 6,
    lastUpdate: new Date()
  }
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
        color: "text-green-600",
        bg: "bg-green-100",
        label: "Operational"
      },
      warning: {
        icon: AlertTriangle, 
        color: "text-yellow-600",
        bg: "bg-yellow-100",
        label: "Warning"
      },
      error: {
        icon: AlertTriangle,
        color: "text-red-600", 
        bg: "bg-red-100",
        label: "Error"
      }
    }

    const config = statusConfig[systemStatus.status]
    const Icon = config.icon

    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full border">
        <Icon className={cn("h-4 w-4", config.color)} />
        <span className="text-sm font-medium">{config.label}</span>
        <Badge variant="outline" className="text-xs">
          {systemStatus.activeAgents} Agents
        </Badge>
      </div>
    )
  }

  return (
    <header className="gov-header px-6 py-4">
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
                      <BreadcrumbPage className="font-semibold">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
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
        <div className="flex items-center gap-4">
          {/* System Status */}
          <StatusIndicator />

          {/* Constitutional Authority */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              US Constitutional Authority
            </span>
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">3</span>
            </div>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    VK
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-semibold">Vivek Kotecha</div>
                  <div className="text-xs text-muted-foreground">Founder</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Government Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
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

      {/* Real-time Status Bar */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>System Uptime: {systemStatus.uptime}%</span>
          <span>•</span>
          <span>Last Updated: {mounted ? systemStatus.lastUpdate.toLocaleTimeString() : "Loading..."}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Monitoring Active</span>
        </div>
      </div>
    </header>
  )
}
