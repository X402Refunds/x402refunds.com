"use client"

import { Menu, X } from "lucide-react"
import { UserButton, useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"

interface DashboardHeaderProps {
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export function DashboardHeader({ sidebarOpen = false, onToggleSidebar }: DashboardHeaderProps = {}) {
  let user = null
  
  try {
    const userData = useUser()
    user = userData.user
  } catch {
    // Clerk not initialized - show generic user during build
    user = null
  }

  const organization = useQuery(api.users.getCurrentUserOrganization, {})
  const updateAutoApprove = useMutation(api.users.updateAutoApproveAI)

  const handleToggleAutoApprove = async (enabled: boolean) => {
    if (!organization?._id) return
    
    try {
      await updateAutoApprove({
        organizationId: organization._id,
        enabled,
      })
    } catch (error) {
      console.error("Failed to update auto-approve setting:", error)
      // Optionally add toast notification here
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 relative">
      <div className="flex items-center justify-between gap-3">
        {/* Mobile Menu Button */}
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

        {/* Spacer for mobile menu button alignment */}
        {!onToggleSidebar && <div className="lg:hidden w-10" />}

        {/* Right Section: User Account */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {/* Auto-Approve AI Toggle */}
          {organization && (
            <div className="flex items-center gap-2 border-r pr-4 border-slate-200">
              <Label htmlFor="auto-approve" className="text-xs sm:text-sm text-slate-700 cursor-pointer">
                Auto-approve AI
              </Label>
              <Switch
                id="auto-approve"
                checked={organization.autoApproveAI ?? false}
                onCheckedChange={handleToggleAutoApprove}
                className="data-[state=checked]:bg-emerald-500"
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

          {/* Clerk User Button */}
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

