"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, ArrowRight, Building2, Scale, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  
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
  
  const orgStats = useQuery(
    api.users.getOrganizationStats,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )
  
  const orgAgents = useQuery(
    api.agents.listOrgAgents,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )
  
  const orgCases = useQuery(
    api.cases.getOrganizationCases,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId, limit: 5 } : "skip"
  )
  
  // Helper to format case status
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      FILED: "bg-blue-100 text-blue-800",
      PANELED: "bg-yellow-100 text-yellow-800",
      DECIDED: "bg-green-100 text-green-800",
      CLOSED: "bg-slate-100 text-slate-800",
    }
    return colors[status] || "bg-slate-100 text-slate-800"
  }
  
  // Helper to get relative time
  const getRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }
  
  // Sync user if not exists
  useEffect(() => {
    if (user && isLoaded && !currentUser) {
      console.log("Syncing user:", user.id, user.primaryEmailAddress?.emailAddress);
      syncUser({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
      }).then(() => {
        console.log("User synced successfully");
      }).catch((error) => {
        console.error("Failed to sync user:", error);
      })
    }
  }, [user, isLoaded, currentUser, syncUser])
  
  // Debug logging
  useEffect(() => {
    console.log("Dashboard state:", { 
      isLoaded, 
      hasUser: !!user, 
      currentUser: currentUser?._id,
      organization: organization?._id 
    });
  }, [isLoaded, user, currentUser, organization])
  
  if (!isLoaded || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading user...</div>
        </div>
      </DashboardLayout>
    )
  }
  
  // Show a different loading state while waiting for Convex queries
  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">
            <p>Syncing user data...</p>
            <p className="text-sm text-slate-400 mt-2">Check browser console for details</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">
            {organization ? `Welcome to ${organization.name}` : "Loading..."}
          </p>
        </div>
        
        {/* Organization Info Card */}
        {organization && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <CardTitle className="text-base text-blue-900">
                      {organization.name}
                    </CardTitle>
                    <CardDescription className="text-blue-700">
                      {organization.domain && `Domain: ${organization.domain}`}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
        
        {/* Stats Cards with Hover Effect */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card 
            className="relative cursor-pointer hover:border-slate-400 transition-all hover:shadow-md group"
            onClick={() => router.push('/dashboard/agents')}
            onMouseEnter={() => setHoveredCard('agents')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agents</CardTitle>
              <Users className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orgAgents?.length ?? 0}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {orgStats?.activeAgents ?? 0} active
              </p>
            </CardContent>
            {hoveredCard === 'agents' && (
              <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center rounded-lg">
                <Button variant="secondary" size="sm" className="shadow-lg">
                  Manage Agents
                </Button>
              </div>
            )}
          </Card>
          
          
          <Card 
            className="relative cursor-pointer hover:border-slate-400 transition-all hover:shadow-md group"
            onClick={() => router.push('/dashboard/team')}
            onMouseEnter={() => setHoveredCard('team')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Activity className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orgStats?.totalUsers ?? 0}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                {orgStats?.adminUsers ?? 0} admin{(orgStats?.adminUsers ?? 0) !== 1 ? 's' : ''}
              </p>
            </CardContent>
            {hoveredCard === 'team' && (
              <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center rounded-lg">
                <Button variant="secondary" size="sm" className="shadow-lg">
                  Manage Team
                </Button>
              </div>
            )}
          </Card>
        </div>
        
        {/* Live Case Activity */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Scale className="h-5 w-5 text-slate-600" />
                  Live Case Activity
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Recent cases involving your organization&apos;s agents
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/demo/cases')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {orgCases && orgCases.length > 0 ? (
              <div className="space-y-3">
                {orgCases.map((case_) => (
                  <div 
                    key={case_._id}
                    className="flex items-start justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/demo/dispute/${case_._id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={getStatusColor(case_.status)}>
                          {case_.status}
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getRelativeTime(case_.filedAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {case_.type}
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        {case_.description || `${case_.plaintiff} vs ${case_.defendant}`}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Scale className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p className="text-sm">No case activity yet</p>
                <p className="text-xs text-slate-400 mt-1">Cases will appear here when your agents file or receive disputes</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        
        {/* Documentation Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentation</CardTitle>
            <CardDescription>
              Learn how to integrate with Consulate&apos;s platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <a href="https://docs.consulatehq.com/api-overview" target="_blank" rel="noopener noreferrer">
                  API Documentation
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://docs.consulatehq.com/agent-integration-guide" target="_blank" rel="noopener noreferrer">
                  Integration Guide
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

