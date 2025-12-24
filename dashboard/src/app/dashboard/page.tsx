"use client"

export const dynamic = 'force-dynamic'

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, ArrowRight, AlertCircle, CheckCircle, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Id } from "@convex/_generated/dataModel"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedSection } from "@/components/ui/animated-section"

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
    amount?: number;
    currency?: string;
    status?: string;
    paymentDetails?: {
      disputeReason?: string;
      disputeFee?: number;
    };
    aiRecommendation?: {
      verdict: string;
      confidence: number;
    };
  };
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  // Sync user on page load
  const syncUser = useMutation(api.users.syncUser)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    {} // Auth verified server-side via ctx.auth
  )


  // Infrastructure Model: Get payment disputes needing review
  const reviewQueue = useQuery(
    api.paymentDisputes.getCustomerReviewQueue,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId, limit: 10 } : "skip"
  )

  // Get ALL organization cases for comprehensive stats
  const allOrgCases = useQuery(
    api.cases.getOrganizationCases,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )

  // Get payment dispute stats for automation metrics (currently unused but available for future)
  // const paymentStats = useQuery(api.paymentDisputes.getMicroDisputeStats)

  // Get organization-specific events for activity feed
  const recentEvents = useQuery(
    api.events.getOrganizationEvents,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId, limit: 50 } : "skip"
  )

  const customerReview = useMutation(api.paymentDisputes.customerReview)

  // Calculate metrics from all org cases
  const totalDisputes = allOrgCases?.length || 0
  const resolvedDisputes = allOrgCases?.filter((c: { status: string }) => c.status === "DECIDED" || c.status === "CLOSED").length || 0
  const reviewQueueCount = reviewQueue?.length || 0

  // Calculate financial impact - sum of amounts from resolved disputes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolvedAmount = allOrgCases?.reduce((sum: number, c: any) => {
    const isResolved = c.status === "DECIDED" || c.status === "CLOSED";
    if (isResolved) return sum + (c.amount || 0);
    return sum;
  }, 0) || 0;

  // Calculate win rates (from resolved disputes)
  const resolvedCases = allOrgCases?.filter((c: { finalVerdict?: string }) => c.finalVerdict) || []
  const consumerWins = resolvedCases.filter((c: { finalVerdict?: string }) => c.finalVerdict === "CONSUMER_WINS").length
  const merchantWins = resolvedCases.filter((c: { finalVerdict?: string }) => c.finalVerdict === "MERCHANT_WINS").length

  // Helper functions for activity feed
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
      const fullName = parts[2];
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
        const amount = event.caseData?.amount ? ` • $${event.caseData.amount.toFixed(2)}` : '';
        return `${parties}${amount}`;
      }
      case "EVIDENCE_SUBMITTED":
        return `${formatAgentName((event.payload?.agentDid || event.agentDid || 'Unknown') as string)} submitted evidence`;
      case "CASE_STATUS_UPDATED":
      case "CASE_DECIDED": {
        const caseId = (event.payload?.caseId || event.caseId || '') as string;
        const shortId = caseId ? caseId.toString().substring(0, 8) : "Unknown";
        let description = `Case ${shortId}`;
        
        if (event.caseData?.amount) {
          description += ` ($${event.caseData.amount.toFixed(2)})`;
        }
        
        if (event.type === "CASE_DECIDED" && event.caseData?.status === "DECIDED") {
          description += ` decided`;
          if (event.caseData?.parties) {
            const parties = event.caseData.parties.map((p: string) => formatAgentName(p)).join(" vs ");
            description = `${parties} • $${event.caseData?.amount?.toFixed(2) || '0.00'} resolved`;
          }
        } else {
          description += ` status updated`;
        }
        
        return description;
      }
      default:
        return event.type.replace(/_/g, ' ').toLowerCase();
    }
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      "AGENT_REGISTERED": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "DISPUTE_FILED": "bg-amber-50 text-amber-700 border-amber-200",
      "EVIDENCE_SUBMITTED": "bg-blue-50 text-blue-700 border-blue-200",
      "CASE_STATUS_UPDATED": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "CASE_DECIDED": "bg-emerald-50 text-emerald-700 border-emerald-200"
    };
    return colors[type] || "bg-slate-50 text-slate-700 border-slate-200"
  };

  const getEventBadge = (eventType: string) => {
    return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  // Sync user if not exists
  useEffect(() => {
    if (user && isLoaded && !currentUser) {
      syncUser({
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
      }).catch((error) => {
        console.error("Failed to sync user:", error);
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
  
  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Syncing user data...</div>
        </div>
      </DashboardLayout>
    )
  }
  
  // Filter events to show only dispute-related activity
  const disputeEvents = recentEvents?.filter((evt: { type: string }) =>
    ["DISPUTE_FILED", "CASE_STATUS_UPDATED", "EVIDENCE_SUBMITTED", "CASE_DECIDED"].includes(evt.type)
  ) || []

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Alert Banner - Shows if review queue has items */}
        <AnimatePresence>
        {reviewQueue && reviewQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
          <Card className="border-l-4 border-l-emerald-600 bg-emerald-50 border-emerald-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900">
                      {reviewQueue.length} dispute{reviewQueue.length !== 1 ? 's' : ''} ready for your review
                    </p>
                    <p className="text-sm text-emerald-700">
                      AI has analyzed and provided recommendations
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/dashboard/review-queue')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Review Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Financial Overview - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -4 }}
          >
          <Card className="border-2 border-emerald-300 hover:border-emerald-400 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 text-xl">Financial Overview</CardTitle>
                  <CardDescription className="text-slate-600">
                    Money in disputes and resolved
                  </CardDescription>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {/* Active Disputes */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    In Disputes Now
                  </p>
                  <div className="text-3xl font-bold text-amber-600 font-mono">
                    ${(reviewQueue?.reduce((sum: number, d: { amount?: number }) => sum + (d.amount || 0), 0) || 0).toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {reviewQueueCount} dispute{reviewQueueCount !== 1 ? 's' : ''} awaiting review
                  </p>
                </div>

                {/* Resolved This Month */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
                    Resolved (All Time)
                  </p>
                  <div className="text-3xl font-bold text-emerald-600 font-mono">
                    ${resolvedAmount.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {resolvedDisputes} dispute{resolvedDisputes !== 1 ? 's' : ''} decided
                  </p>
                </div>
              </div>

              {/* Quick Stats Bar */}
              <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalDisputes}</p>
                  <p className="text-xs text-slate-600">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{consumerWins}</p>
                  <p className="text-xs text-slate-600">Consumer</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-600">{merchantWins}</p>
                  <p className="text-xs text-slate-600">Merchant</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>

        {/* Live Dispute Activity with Quick Actions */}
        <AnimatedSection direction="up" delay={0.4}>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-900" />
                <CardTitle className="text-slate-900">Live Dispute Activity</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                  Real-time
                </Badge>
              </div>
            </div>
            <CardDescription className="text-slate-600">
              Monitor dispute resolution activity as it happens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {!disputeEvents || disputeEvents.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-2">No dispute activity yet</p>
                <p className="text-xs text-slate-400">
                  Dispute events will appear here when disputes are filed or resolved
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {disputeEvents.slice(0, 10).map((evt: unknown, index: number) => {
                  const event = evt as Event
                  const isDisputeFiled = event.type === "DISPUTE_FILED"
                  const caseData = event.caseData
                  const needsReview = caseData?.aiRecommendation && 
                    (caseData.aiRecommendation.confidence < 0.95 || caseData.aiRecommendation.verdict === "NEED_REVIEW")
                  
                  return (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      whileHover={{ x: 4 }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-emerald-300 transition-all cursor-pointer"
                      onClick={() => event.caseId && router.push(`/dashboard/disputes/${event.caseId}`)}
                    >
                      <div className="text-2xl flex-shrink-0">
                        {event.type === "DISPUTE_FILED" && "📋"}
                        {event.type === "EVIDENCE_SUBMITTED" && "📎"}
                        {event.type === "CASE_STATUS_UPDATED" && "✅"}
                        {event.type === "CASE_DECIDED" && "⚖️"}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
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
                          {isDisputeFiled && caseData?.amount && (
                            <span className="text-sm font-semibold text-slate-900">
                              ${caseData.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {formatEventDescription(event)}
                        </p>

                        {/* Quick actions for dispute events */}
                        {isDisputeFiled && event.caseId && caseData?.status === "FILED" && (
                          <div className="flex gap-2 pt-1">
                            {needsReview ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                                onClick={() => router.push(`/dashboard/disputes/${event.caseId}`)}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Needs Review ({((caseData.aiRecommendation?.confidence || 0) * 100).toFixed(0)}% confidence)
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  onClick={async () => {
                                    if (!currentUser || !event.caseId) return
                                    await customerReview({
                                      paymentDisputeId: event.caseId,
                                      reviewerUserId: currentUser._id,
                                      decision: "APPROVE_AI",
                                      finalVerdict: (caseData.aiRecommendation?.verdict || "CONSUMER_WINS") as "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW",
                                    })
                                  }}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve ({((caseData.aiRecommendation?.confidence || 0) * 100).toFixed(0)}%)
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-xs text-slate-600 hover:text-slate-700"
                                  onClick={() => router.push(`/dashboard/disputes/${event.caseId}`)}
                                >
                                  View Details
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
        </AnimatedSection>
      </div>
    </DashboardLayout>
  )
}
