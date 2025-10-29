"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, ArrowRight, Building2, AlertCircle, CheckCircle } from "lucide-react"
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

  // Infrastructure Model: Get payment disputes needing review
  const reviewQueue = useQuery(
    api.paymentDisputes.getCustomerReviewQueue,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId, limit: 5 } : "skip"
  )

  const customerReview = useMutation(api.paymentDisputes.customerReview)
  
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
        
        {/* Payment Dispute Review Queue - Infrastructure Model */}
        {reviewQueue && reviewQueue.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-100">
                    <AlertCircle className="h-5 w-5" />
                    Payment Dispute Review Queue
                  </CardTitle>
                  <CardDescription className="text-yellow-700 dark:text-yellow-300">
                    {reviewQueue.length} dispute{reviewQueue.length !== 1 ? 's' : ''} need{reviewQueue.length === 1 ? 's' : ''} your review (AI confidence &lt; 95%)
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push('/dashboard/review-queue')}
                  className="bg-white dark:bg-slate-900"
                >
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviewQueue.slice(0, 3).map((dispute) => (
                  <div key={dispute._id} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">
                          ${dispute.amount.toFixed(2)} {dispute.currency}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {dispute.disputeReason?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        AI: {((dispute.aiRulingConfidence || 0) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                      🤖 Recommends: <strong>{dispute.aiRecommendation || "CONSUMER_WINS"}</strong>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                        onClick={async () => {
                          if (!currentUser) return
                          await customerReview({
                            paymentDisputeId: dispute._id,
                            reviewerUserId: currentUser._id,
                            decision: "APPROVE_AI",
                            finalVerdict: dispute.aiRecommendation || "CONSUMER_WINS",
                          })
                        }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8"
                        onClick={() => router.push('/dashboard/review-queue')}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
                {reviewQueue.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                    + {reviewQueue.length - 3} more dispute{reviewQueue.length - 3 !== 1 ? 's' : ''} need review
                  </p>
                )}
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

