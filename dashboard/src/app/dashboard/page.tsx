"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, ArrowRight, AlertCircle, CheckCircle, Clock, Zap, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Id } from "@convex/_generated/dataModel"

type Event = {
  _id: Id<"events">;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  agentDid?: string;
  caseId?: Id<"cases">;
  caseData?: {
    parties?: string[];
    plaintiff?: string;
    defendant?: string;
  };
}

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

  // Infrastructure Model: Get payment disputes needing review
  const reviewQueue = useQuery(
    api.paymentDisputes.getCustomerReviewQueue,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId, limit: 10 } : "skip"
  )

  // Get payment dispute stats for automation metrics
  const paymentStats = useQuery(api.paymentDisputes.getMicroDisputeStats)

  // Get organization-specific events for activity feed (dispute events only)
  const recentEvents = useQuery(
    api.events.getOrganizationEvents,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId, limit: 15 } : "skip"
  )

  const customerReview = useMutation(api.paymentDisputes.customerReview)

  // Calculate automation rate
  const automationRate = paymentStats
    ? parseFloat(paymentStats.autoResolutionRate)
    : 95

  // Calculate average resolution time (mock - would need actual data)
  const avgResolutionMinutes = 2.4

  // Helper functions for activity feed (copied from demo)
  const formatAgentName = (did: string) => {
    if (!did) return "Unknown";

    // Handle payment dispute identifiers: consumer:alice@demo.com or merchant:cryptomart@demo.com
    if (did.includes('@')) {
      const parts = did.split(':');
      if (parts.length >= 2) {
        const role = parts[0]; // consumer or merchant
        const name = parts[1].split('@')[0]; // alice or cryptomart
        return `${name.charAt(0).toUpperCase() + name.slice(1)} (${role})`;
      }
    }

    // Handle agent DIDs: did:agent:name-company-12345
    const parts = did.split(':');
    if (parts.length >= 3) {
      // Extract just the agent name without the ID number
      const fullName = parts[2];
      // Remove the timestamp/ID suffix (everything after the last hyphen)
      const nameWithoutId = fullName.substring(0, fullName.lastIndexOf('-'));
      return nameWithoutId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return did;
  };

  const formatEventDescription = (event: Event) => {
    switch (event.type) {
      case "AGENT_REGISTERED":
        return `${formatAgentName((event.payload?.did || event.agentDid || 'Unknown') as string)} joined the platform`;
      case "DISPUTE_FILED": {
        // Try to get parties from enriched caseData first, then fall back to payload
        let parties: string | undefined;
        if (event.caseData?.parties) {
          parties = event.caseData.parties.map((p: string) => formatAgentName(p)).join(" vs ");
        } else if (event.caseData?.plaintiff && event.caseData?.defendant) {
          parties = `${formatAgentName(event.caseData.plaintiff)} vs ${formatAgentName(event.caseData.defendant)}`;
        } else if (event.payload?.parties) {
          parties = (event.payload.parties as string[]).map((p: string) => formatAgentName(p)).join(" vs ");
        } else {
          parties = "New dispute filed";
        }
        return parties;
      }
      case "EVIDENCE_SUBMITTED":
        return `${formatAgentName((event.payload?.agentDid || event.agentDid || 'Unknown') as string)} submitted evidence`;
      case "CASE_STATUS_UPDATED": {
        const caseId = (event.payload?.caseId || event.caseId || '') as string;
        const shortId = caseId ? caseId.toString().substring(0, 8) : "Unknown";
        return `Case ${shortId} status updated`;
      }
      default:
        return event.type.replace(/_/g, ' ').toLowerCase();
    }
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      "AGENT_REGISTERED": "bg-blue-50 text-blue-700 border-blue-200",
      "DISPUTE_FILED": "bg-red-50 text-red-700 border-red-200",
      "EVIDENCE_SUBMITTED": "bg-amber-50 text-amber-700 border-amber-200",
      "CASE_STATUS_UPDATED": "bg-emerald-50 text-emerald-700 border-emerald-200"
    };
    return colors[type] || "bg-slate-50 text-slate-700 border-slate-200"
  };

  const getEventBadge = (eventType: string) => {
    return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
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
  
  // Filter events to show only dispute-related activity
  const disputeEvents = recentEvents?.filter(evt =>
    ["DISPUTE_FILED", "CASE_STATUS_UPDATED", "EVIDENCE_SUBMITTED"].includes(evt.type)
  ) || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mission Control</h1>
            <p className="text-slate-600 mt-1">
              {organization?.name || "Loading..."}
            </p>
          </div>

          {/* System Status Badge */}
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            System Operational
          </Badge>
        </div>

        {/* Alert Banner - Only shows if review queue has items */}
        {reviewQueue && reviewQueue.length > 0 && (
          <Card className="border-l-4 border-l-amber-600 bg-amber-50 border-amber-200">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      {reviewQueue.length} dispute{reviewQueue.length !== 1 ? 's' : ''} need{reviewQueue.length === 1 ? 's' : ''} your review
                    </p>
                    <p className="text-sm text-amber-700">
                      AI confidence below 95% threshold
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/dashboard/review-queue')}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Review Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero Metrics - What Matters Most */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Review Queue Status */}
          <Card className={reviewQueue && reviewQueue.length > 0 ? "border-amber-300 hover:border-amber-400" : "border-emerald-300 hover:border-emerald-400"}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Review Queue</CardTitle>
              <AlertCircle className={reviewQueue && reviewQueue.length > 0 ? "h-5 w-5 text-amber-600" : "h-5 w-5 text-emerald-600"} />
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold font-mono tabular-nums ${reviewQueue && reviewQueue.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {reviewQueue?.length || 0}
              </div>
              <p className="text-xs text-slate-600 mt-2 uppercase tracking-wide">
                {reviewQueue && reviewQueue.length > 0 ? "Disputes Waiting" : "No Action Needed"}
              </p>
              {reviewQueue && reviewQueue.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => router.push('/dashboard/review-queue')}
                >
                  Review Disputes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Automation Efficiency */}
          <Card className="border-blue-300 hover:border-blue-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Automation Rate</CardTitle>
              <Zap className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 font-mono tabular-nums">
                {automationRate.toFixed(0)}%
              </div>
              <p className="text-xs text-slate-600 mt-2 uppercase tracking-wide">
                AI Auto-Resolved
              </p>
              <div className="flex items-center gap-1 mt-3 text-xs text-slate-600">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span>
                  {paymentStats?.autoResolvedCount || 0} of {paymentStats?.totalMicroDisputes || 0} disputes
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Avg Resolution Time */}
          <Card className="border-slate-300 hover:border-slate-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Avg Resolution Time</CardTitle>
              <Clock className="h-5 w-5 text-slate-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900 font-mono tabular-nums">
                {avgResolutionMinutes.toFixed(1)}<span className="text-xl text-slate-600">m</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 uppercase tracking-wide">
                Average Time
              </p>
              <div className="text-xs text-emerald-600 mt-3 font-medium">
                ✓ Under 5 min target
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Detailed Review Queue - Only shows if items exist */}
        {reviewQueue && reviewQueue.length > 0 && (
          <Card className="border-amber-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Pending Reviews</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard/review-queue')}
                >
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <CardDescription className="text-slate-600">
                Disputes where AI confidence is below 95% - your decision needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviewQueue.slice(0, 5).map((dispute) => (
                  <div
                    key={dispute._id}
                    className="p-4 bg-white rounded-lg border border-amber-200 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          ${dispute.amount.toFixed(2)} {dispute.currency}
                        </p>
                        <p className="text-sm text-slate-600">
                          {dispute.disputeReason?.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        AI: {((dispute.aiRulingConfidence || 0) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-sm text-slate-700">
                      <span className="font-medium">AI Recommends:</span>
                      <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                        {dispute.aiRecommendation || "CONSUMER_WINS"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
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
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve AI
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push('/dashboard/review-queue')}
                      >
                        Detailed Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Dispute Activity */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-900" />
                <CardTitle className="text-slate-900">Live Dispute Activity</CardTitle>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Real-time
              </Badge>
            </div>
            <CardDescription className="text-slate-600">
              Monitor dispute resolution activity as it happens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!disputeEvents || disputeEvents.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-2">No dispute activity yet</p>
                <p className="text-xs text-slate-400">
                  Dispute events will appear here when disputes are filed or resolved
                </p>
              </div>
            ) : (
              <>
                {disputeEvents.slice(0, 8).map((evt) => {
                  const event = evt as Event
                  return (
                    <div
                      key={event._id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer"
                      onClick={() => event.caseId && router.push(`/dashboard/activity`)}
                    >
                      <div className="text-2xl flex-shrink-0">
                        {event.type === "DISPUTE_FILED" && "📋"}
                        {event.type === "EVIDENCE_SUBMITTED" && "📎"}
                        {event.type === "CASE_STATUS_UPDATED" && "✅"}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={`${getEventColor(event.type)} text-xs font-medium`}
                          >
                            {getEventBadge(event.type)}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(event.timestamp).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              timeZoneName: "short",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {formatEventDescription(event)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/dashboard/activity")}
                  >
                    View All Activity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

