"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shield, Crown, Mail, UserCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function TeamPage() {
  const { user, isLoaded } = useUser()
  
  // Sync user on page load
  const syncUser = useMutation(api.users.syncUser)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkUserId: user.id } : "skip"
  )
  
  const organization = useQuery(
    api.users.getUserOrganization,
    currentUser ? { userId: currentUser._id } : "skip"
  )
  
  const teamMembers = useQuery(
    api.users.listOrganizationUsers,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )
  
  // Sync user if not exists
  useEffect(() => {
    if (user && isLoaded && !currentUser) {
      syncUser({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
      }).catch((error) => {
        console.error("Failed to sync user:", error)
      })
    }
  }, [user, isLoaded, currentUser, syncUser])
  
  if (!isLoaded || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Team Members</h1>
            <p className="text-slate-600 mt-1">
              Manage your organization&apos;s team members
              {organization && ` (${organization.name})`}
            </p>
          </div>
        </div>
        
        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <CardTitle className="text-base text-blue-900">Team Management</CardTitle>
                <CardDescription className="text-blue-700">
                  View and manage team members in your organization. Team members can access
                  the dashboard, manage agents, and view case activity.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              {teamMembers === undefined
                ? "Loading..."
                : teamMembers.length === 0
                ? "No team members yet."
                : `${teamMembers.length} team member${teamMembers.length !== 1 ? 's' : ''} in your organization.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers === undefined ? (
              <div className="text-center py-8 text-slate-600">
                Loading team members...
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No team members yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <UserCircle className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">
                            {member.name || "Unknown User"}
                          </p>
                          {member.role === "admin" && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {member._id === currentUser?._id && (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Documentation Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Collaboration</CardTitle>
            <CardDescription>
              Learn how to collaborate effectively with your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <a href="https://docs.consulatehq.com/api-overview" target="_blank" rel="noopener noreferrer">
                  Documentation
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

