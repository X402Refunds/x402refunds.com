"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Users, Shield } from "lucide-react"
import { CreateAgentDialog } from "@/components/dashboard/create-agent-dialog"
import { AgentList } from "@/components/dashboard/agent-list"

export default function AgentsPage() {
  const { user, isLoaded } = useUser()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
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
  
  const orgAgents = useQuery(
    api.agents.listOrgAgents,
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
            <h1 className="text-3xl font-bold text-slate-900">Agents</h1>
            <p className="text-slate-600 mt-1">
              Manage your organization&apos;s AI agents
              {organization && ` (${organization.name})`}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            disabled={!currentUser || !organization}
            className="bg-slate-900 hover:bg-slate-800 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Agent
          </Button>
        </div>
        
        {/* Info Card */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <CardTitle className="text-base text-emerald-900">Agent Management</CardTitle>
                <CardDescription className="text-emerald-700">
                  Deploy and manage AI agents for your organization. Each agent can file disputes,
                  respond to claims, and participate in arbitration proceedings.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Agents List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Agents</CardTitle>
            <CardDescription>
              {orgAgents === undefined
                ? "Loading..."
                : orgAgents.length === 0
                ? "No agents deployed yet. Create one to get started."
                : `You have ${orgAgents.length} agent${orgAgents.length !== 1 ? 's' : ''} deployed.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orgAgents === undefined ? (
              <div className="text-center py-8 text-slate-600">
                Loading agents...
              </div>
            ) : orgAgents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No agents yet</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={!currentUser || !organization}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Agent
                </Button>
              </div>
            ) : (
              <AgentList agents={orgAgents} />
            )}
          </CardContent>
        </Card>
        
        {/* Documentation Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Integration</CardTitle>
            <CardDescription>
              Learn how to integrate your agents with Consulate&apos;s platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <a href="https://docs.consulatehq.com/agent-integration-guide" target="_blank" rel="noopener noreferrer">
                  Integration Guide
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://docs.consulatehq.com/api-overview" target="_blank" rel="noopener noreferrer">
                  API Documentation
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Create Agent Dialog */}
      <CreateAgentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </DashboardLayout>
  )
}

