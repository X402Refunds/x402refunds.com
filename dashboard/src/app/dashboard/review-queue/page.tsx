"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { AnimatedSection } from "@/components/ui/animated-section"
import { SuccessCheckmark } from "@/components/ui/success-checkmark"
import { useState } from "react"

export default function ReviewQueuePage() {
  const { isLoaded } = useUser()
  const router = useRouter()
  // This page operates on payment disputes; track the selected/success item by its id.
  const [successDisputeId, setSuccessDisputeId] = useState<Id<"cases"> | null>(null)
  
  // Sync and get user
  const currentUser = useQuery(
    api.users.getCurrentUser,
    {} // Auth verified server-side via ctx.auth
  )
  
  // Get review queue for user's organization information
  const reviewQueue = useQuery(
    api.paymentDisputes.getCustomerReviewQueue,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )
  
  // Get organization to check AI status
  const organization = useQuery(
    api.users.getUserOrganization,
    currentUser ? { userId: currentUser._id } : "skip"
  )
  
  const customerReview = useMutation(api.paymentDisputes.customerReview)
  
  if (!isLoaded || !currentUser) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading...</div>
      </DashboardLayout>
    )
  }
  
  if (!reviewQueue) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading review queue...</div>
      </DashboardLayout>
    )
  }
  
  // Keep all disputes in display - we'll handle the animation on the card itself
  const displayQueue = reviewQueue
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <AnimatedSection direction="down" delay={0.1}>
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dispute Review Queue</h1>
            <div className="flex items-center justify-between gap-4">
              <p className="text-slate-600">
                AI analyzes disputes and provides recommendations. Review and approve or override based on your business rules.
              </p>
              <Badge variant="secondary" className="text-sm whitespace-nowrap">
                {displayQueue.length} dispute{displayQueue.length !== 1 ? 's' : ''}
              </Badge>
        </div>
            {organization?.aiEnabled === false && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>AI Analysis Disabled:</strong> Existing AI recommendations are still shown below, but new disputes will not receive AI analysis until you re-enable AI.
                </p>
              </div>
            )}
          </div>
        </AnimatedSection>
          
        {/* Review Queue Section */}
        <AnimatedSection direction="up" delay={0.2}>
          <Card className="border-2 border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              {!displayQueue || displayQueue.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 mb-1">All Caught Up!</p>
                  <p className="text-sm text-slate-600 mb-4">
                    No new disputes to review. AI recommendations will appear here when disputes are filed.
                  </p>
                </div>
              ) : (
                <motion.div 
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                      },
                    },
                  }}
                >
                  <AnimatePresence>
                    {displayQueue.map((dispute: { _id: string; amount?: number; currency?: string; paymentDetails?: { disputeReason?: string }; aiRecommendation?: { confidence: number; verdict: string; reasoning?: string; refundAmountMicrousdc?: number } }) => {
                      const isApproving = successDisputeId === dispute._id
                      return (
                        <motion.div
                          key={dispute._id}
                          variants={{
                            hidden: { opacity: 0, x: -20 },
                            visible: { opacity: 1, x: 0 },
                          }}
                          initial={isApproving ? false : "hidden"}
                          animate={isApproving ? { opacity: 0, scale: 0.95 } : "visible"}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={isApproving ? { duration: 0.5, delay: 1.5 } : {}}
                          onAnimationComplete={isApproving ? () => {
                            setSuccessDisputeId(null)
                            // Remove from list after animation
                            setTimeout(() => {
                              // The query will automatically update and remove it
                            }, 100)
                          } : undefined}
                          whileHover={isApproving ? {} : { x: 2 }}
                          className="p-4 bg-white rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden"
                          onClick={() => !isApproving && router.push(`/dashboard/disputes/${dispute._id}`)}
                        >
                          {/* Inline checkmark at top right - appears when approving */}
                          <SuccessCheckmark 
                            show={isApproving} 
                            onComplete={() => {}}
                            inline={true}
                          />
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-semibold text-slate-900 text-lg">
                                ${dispute.amount?.toFixed(2) || "0.00"} {dispute.currency || "USD"}
                              </p>
                              <p className="text-sm text-slate-600 mt-0.5">
                                {dispute.paymentDetails?.disputeReason?.replace(/_/g, ' ') || 'Dispute'}
                              </p>
                            </div>
                            {!isApproving && (
                              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                AI: {((dispute.aiRecommendation?.confidence || 0) * 100).toFixed(0)}% confident
                              </Badge>
                            )}
                          </div>
                      
                      {dispute.aiRecommendation ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-slate-600">AI Recommends:</span>
                            <Badge className={
                              dispute.aiRecommendation.verdict === "CONSUMER_WINS" 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
                                : "bg-slate-50 text-slate-700 border border-slate-200 font-medium"
                            }>
                              {dispute.aiRecommendation.verdict}
                            </Badge>
                            {(dispute.aiRecommendation.verdict === "CONSUMER_WINS" || dispute.aiRecommendation.verdict === "PARTIAL_REFUND") &&
                              typeof dispute.aiRecommendation.refundAmountMicrousdc === "number" && (
                                <span className="text-xs text-slate-600">
                                  • {(dispute.aiRecommendation.refundAmountMicrousdc / 1_000_000).toFixed(6)} USDC
                                </span>
                              )}
                          </div>
        
                          {dispute.aiRecommendation.reasoning && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                              {dispute.aiRecommendation.reasoning}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
                            <p className="text-sm font-medium text-purple-800">AI Analysis Pending...</p>
                          </div>
                          <p className="text-xs text-purple-700 mt-1">
                            Usually completes in under 2 minutes. Refresh to see recommendation.
                          </p>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-1">
                        {/* Only show Approve button if AI made an actual recommendation (not NEED_REVIEW) */}
                        {dispute.aiRecommendation && dispute.aiRecommendation.verdict !== "NEED_REVIEW" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-shadow"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!currentUser || !dispute.aiRecommendation) return
                              if (
                                (dispute.aiRecommendation.verdict === "CONSUMER_WINS" || dispute.aiRecommendation.verdict === "PARTIAL_REFUND") &&
                                typeof dispute.aiRecommendation.refundAmountMicrousdc !== "number"
                              ) {
                                return
                              }
                              await customerReview({
                                paymentDisputeId: dispute._id as unknown as Id<"cases">,
                                reviewerUserId: currentUser._id,
                                decision: "APPROVE_AI",
                                finalVerdict: dispute.aiRecommendation.verdict as "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW",
                              })
                              setSuccessDisputeId(dispute._id as unknown as Id<"cases">)
                            }}
                            disabled={
                              (dispute.aiRecommendation.verdict === "CONSUMER_WINS" || dispute.aiRecommendation.verdict === "PARTIAL_REFUND") &&
                              typeof dispute.aiRecommendation.refundAmountMicrousdc !== "number"
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {dispute.aiRecommendation.verdict === "MERCHANT_WINS"
                              ? "Approve: Deny refund"
                              : dispute.aiRecommendation.verdict === "CONSUMER_WINS"
                                ? "Approve: Send refund"
                                : dispute.aiRecommendation.verdict === "PARTIAL_REFUND"
                                  ? "Approve: Send partial refund"
                                  : "Approve"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant={dispute.aiRecommendation?.verdict === "NEED_REVIEW" ? "default" : "outline"}
                          className={dispute.aiRecommendation?.verdict === "NEED_REVIEW" 
                            ? "flex-1 bg-orange-600 hover:bg-orange-700 text-white" 
                            : "flex-1 border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700"
                          }
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/disputes/${dispute._id}`)
                          }}
                        >
                          {dispute.aiRecommendation?.verdict === "NEED_REVIEW" 
                            ? "Make Your Decision" 
                            : "Review Details"
                          }
                        </Button>
                      </div>
                    </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>
        
        {/* Footer Help */}
        {displayQueue.length > 0 && (
          <AnimatedSection direction="up" delay={0.3}>
            <Card className="bg-slate-50 border-2 border-slate-200">
            <CardContent className="pt-6">
              <h4 className="text-sm font-semibold mb-2 text-slate-700">Tips for Reviewing:</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>Approve AI</strong> if the recommendation aligns with your knowledge</li>
                <li>• <strong>Override</strong> if you have context the AI doesn&apos;t (customer history, fraud patterns, etc.)</li>
                <li>• <strong>Be specific in notes</strong> - this helps the AI learn your business rules</li>
                <li>• <strong>Review by deadline</strong> - Regulation E requires resolution within 10 business days</li>
              </ul>
            </CardContent>
          </Card>
          </AnimatedSection>
        )}
      </div>
    </DashboardLayout>
  )
}
