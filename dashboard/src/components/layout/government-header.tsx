"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"

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

  // Get current user and organization for AI toggle (only on dashboard routes)
  const isDashboardRoute = pathname?.startsWith('/dashboard')
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isDashboardRoute ? {} : "skip"
  )
  const organization = useQuery(
    api.users.getUserOrganization,
    isDashboardRoute && currentUser ? { userId: currentUser._id } : "skip"
  )
  const updateOrganization = useMutation(api.users.updateOrganization)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [optimisticAiEnabled, setOptimisticAiEnabled] = React.useState<boolean | null>(null)
  
  // Use optimistic state if available, otherwise use organization state
  const aiEnabledValue = optimisticAiEnabled !== null 
    ? optimisticAiEnabled 
    : (organization?.aiEnabled !== false)

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
    <header className="bg-gradient-to-r from-white via-emerald-50/20 to-white border-b border-emerald-200 px-4 sm:px-6 py-3 relative shadow-sm">
      {/* Emerald accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/50 via-emerald-500 to-emerald-500/50" />
      
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

        {/* Right Section: AI Toggle, Status and User */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* AI Toggle - Only show on dashboard routes */}
          {isDashboardRoute && currentUser?.organizationId && (
            <div className="flex items-center gap-2 border border-slate-300 rounded-md px-2 py-1">
              <span className="text-xs font-medium text-slate-700">AI</span>
              <Switch
                checked={aiEnabledValue}
                disabled={isUpdating}
                onCheckedChange={async (checked) => {
                  // Optimistic update
                  setOptimisticAiEnabled(checked)
                  setIsUpdating(true)
                  try {
                    await updateOrganization({
                      organizationId: currentUser.organizationId!,
                      aiEnabled: checked,
                    })
                  } catch (error) {
                    // Revert on error
                    setOptimisticAiEnabled(null)
                    console.error('Failed to update AI setting:', error)
                  } finally {
                    setIsUpdating(false)
                    // Clear optimistic state after a short delay to let Convex update
                    setTimeout(() => setOptimisticAiEnabled(null), 500)
                  }
                }}
              />
            </div>
          )}

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
