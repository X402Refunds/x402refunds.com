"use client"

import { usePathname } from "next/navigation"
import { Bell, Menu, X } from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

interface GovernmentHeaderProps {
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export function GovernmentHeader({ sidebarOpen = false, onToggleSidebar }: GovernmentHeaderProps = {}) {
  const pathname = usePathname()
  let user = null
  
  try {
    const userData = useUser()
    user = userData.user
  } catch {
    // Clerk not initialized - show generic user during build
    user = null
  }

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

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-3">
        {/* Mobile Menu Button - Integrated into header */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden flex-shrink-0 hover:bg-slate-100 transition-colors"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-slate-900" />
            ) : (
              <Menu className="h-5 w-5 text-slate-900" />
            )}
          </Button>
        )}

        {/* Left Section: Breadcrumbs */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
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
          {/* Notifications - Hidden on smallest mobile */}
          <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg hidden xs:block">
            <Bell className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white">3</span>
            </div>
          </button>

          {/* User Display Name - Hidden on mobile */}
          {user && (
            <div className="text-left hidden sm:block">
              <div className="text-sm font-semibold text-slate-900">{user.fullName || user.firstName || 'User'}</div>
              <div className="text-xs text-slate-600">{user.organizationMemberships?.[0]?.role === 'org:admin' ? 'Admin' : 'Organization Owner'}</div>
            </div>
          )}

          {/* Clerk User Button - Only show if Clerk is initialized */}
          {user !== null && (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonTrigger: "focus:shadow-none"
                }
              }}
              afterSignOutUrl="/"
            />
          )}
        </div>
      </div>
    </header>
  )
}
