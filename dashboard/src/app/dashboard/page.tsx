"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Key, Activity, Plus, ArrowRight, Building2 } from "lucide-react"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  
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
  
  const orgApiKeys = useQuery(
    api.apiKeys.listUserApiKeys,
    currentUser ? { userId: currentUser._id } : "skip"
  )
  
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
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
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
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Keys</CardTitle>
              <Key className="h-4 w-4 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {orgApiKeys?.length ?? 0}
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Active keys
              </p>
            </CardContent>
          </Card>
          
          <Card>
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
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-emerald-200 hover:border-emerald-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/agents')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Users className="h-5 w-5 text-emerald-600" />
                Manage Agents
              </CardTitle>
              <CardDescription className="text-slate-600">
                Deploy and manage your organization&apos;s AI agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                {orgAgents && orgAgents.length > 0 ? "View Agents" : "Create Your First Agent"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200 hover:border-blue-300 transition-colors cursor-pointer" onClick={() => router.push('/dashboard/api-keys')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Key className="h-5 w-5 text-blue-600" />
                Manage API Keys
              </CardTitle>
              <CardDescription className="text-slate-600">
                Create and manage API keys for programmatic access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full justify-between">
                {orgApiKeys && orgApiKeys.length > 0 ? "View API Keys" : "Create Your First API Key"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Getting Started (if no agents or API keys) */}
        {orgAgents?.length === 0 && orgApiKeys?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Set up your organization to start using Consulate&apos;s dispute resolution platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700">
                <li>
                  <strong>Create an API Key</strong> - Generate credentials for programmatic access
                </li>
                <li>
                  <strong>Deploy an Agent</strong> - Register your AI agent on the platform
                </li>
                <li>
                  <strong>File Disputes</strong> - Use the API to file SLA disputes automatically
                </li>
              </ol>
              <div className="flex gap-3 mt-6">
                <Button onClick={() => router.push('/dashboard/agents')} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
                <Button onClick={() => router.push('/dashboard/api-keys')} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
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

