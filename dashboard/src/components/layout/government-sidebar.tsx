"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Activity,
  Shield,
  Scale,
  Users,
  AlertTriangle,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flag
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: string
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  {
    title: "Overview",
    href: "/",
    icon: Home,
    description: "System overview and key metrics"
  },
  {
    title: "Live Monitoring",
    href: "/monitoring",
    icon: Activity,
    badge: "LIVE",
    description: "Real-time activity monitoring"
  },
  {
    title: "Human Override",
    href: "/controls/override",
    icon: Crown,
    badge: "SECURE",
    description: "Emergency controls and oversight"
  },
  {
    title: "Constitutional Convention",
    href: "/constitutional/convention",
    icon: Scale,
    badge: "PENDING",
    description: "Live constitutional discussions"
  },
  {
    title: "Integration Hub",
    href: "/integration",
    icon: Settings,
    description: "Access to live dashboard endpoints",
    badge: "LIVE"
  }
]

interface GovernmentSidebarProps {
  className?: string
}

export function GovernmentSidebar({ className }: GovernmentSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const isChildActive = (children?: NavigationItem[]) => {
    if (!children) return false
    return children.some(child => pathname.startsWith(child.href))
  }

  return (
    <div className={cn("gov-nav flex flex-col h-full", className)}>
      {/* Government Header */}
      <div className="gov-header p-6">
        <div className="gov-brand">
          <Flag className="h-6 w-6" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold">Consulate AI</span>
              <span className="text-xs opacity-75">Government Portal</span>
            </div>
          )}
        </div>
        
        {!collapsed && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground">Founded by</div>
            <div className="text-sm font-semibold text-primary">Vivek Kotecha</div>
            <Badge className="authority-badge mt-1">🇺🇸 US Authority</Badge>
          </div>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isItemActive = isActive(item.href)
          const hasActiveChild = isChildActive(item.children)
          const isExpanded = expandedItems.includes(item.href)
          const showExpanded = (isExpanded || hasActiveChild) && !collapsed

          return (
            <div key={item.href} className="space-y-1">
              <div className="relative">
                <Link
                  href={item.children ? "#" : item.href}
                  onClick={(e) => {
                    if (item.children) {
                      e.preventDefault()
                      toggleExpanded(item.href)
                    }
                  }}
                  className={cn(
                    "nav-item flex items-center gap-3 px-3 py-2 text-sm",
                    (isItemActive || hasActiveChild) && "nav-item-active"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      </div>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      {item.children && (
                        <ChevronRight 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            showExpanded && "rotate-90"
                          )} 
                        />
                      )}
                    </>
                  )}
                </Link>
              </div>

              {/* Sub-navigation */}
              {item.children && showExpanded && (
                <div className="ml-6 space-y-1 border-l border-border pl-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "nav-item flex items-center gap-2 px-2 py-1.5 text-xs",
                        isActive(child.href) && "nav-item-active"
                      )}
                    >
                      <child.icon className="h-3 w-3" />
                      <span>{child.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
