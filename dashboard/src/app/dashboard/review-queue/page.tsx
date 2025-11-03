"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
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
  const [successDisputeId, setSuccessDisputeId] = useState<string | null>(null)
  
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
  
  // Filter out the dispute that's showing success animation (will be removed after animation)
  const displayQueue = reviewQueue.filter(dispute => dispute._id !== successDisputeId)
  
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
          <Card className="border-slate-200 shadow-sm">
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
                  {/* Show success animation card separately if exists */}
                  <AnimatePresence>
                    {successDisputeId && (() => {
                      const successDispute = reviewQueue.find(d => d._id === successDisputeId)
                      if (!successDispute) return null
                      return (
                        <motion.div
                          key={`success-${successDisputeId}`}
                          initial={{ opacity: 1, scale: 1 }}
                          animate={{ opacity: 0, scale: 0.95 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, delay: 1.5 }}
                          onAnimationComplete={() => setSuccessDisputeId(null)}
                          className="p-4 bg-white rounded-lg border-2 border-emerald-200 relative"
                        >
                          <SuccessCheckmark 
                            show={true} 
                            onComplete={() => {}}
                            inline={true}
                          />
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-bold text-slate-900 text-lg">
                                ${successDispute.amount?.toFixed(2) || "0.00"} {successDispute.currency || "USD"}
                              </p>
                              <p className="text-sm text-slate-600">
                                {successDispute.paymentDetails?.disputeReason?.replace(/_/g, ' ') || 'Dispute'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })()}
                  </AnimatePresence>
                  {displayQueue.map((dispute) => (
                    <motion.div
                      key={dispute._id}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      whileHover={{ x: 4 }}
                      className="p-4 bg-white rounded-lg border-2 border-emerald-200 hover:border-emerald-300 transition-colors cursor-pointer relative"
                      onClick={() => router.push(`/dashboard/disputes/${dispute._id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-slate-900 text-lg">
                            ${dispute.amount?.toFixed(2) || "0.00"} {dispute.currency || "USD"}
                          </p>
                          <p className="text-sm text-slate-600">
                            {dispute.paymentDetails?.disputeReason?.replace(/_/g, ' ') || 'Dispute'}
                          </p>
                </div>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          AI: {((dispute.aiRecommendation?.confidence || 0) * 100).toFixed(0)}% confident
                        </Badge>
              </div>
                      
                      {dispute.aiRecommendation ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-slate-700">AI Recommends:</span>
                            <Badge className={
                              dispute.aiRecommendation.verdict === "CONSUMER_WINS" 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }>
                              {dispute.aiRecommendation.verdict}
                            </Badge>
        </div>
        
                          {dispute.aiRecommendation.reasoning && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                              {dispute.aiRecommendation.reasoning}
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                            <p className="text-sm font-medium text-purple-900">AI Analysis Pending...</p>
                          </div>
                          <p className="text-xs text-purple-700 mt-1">
                            Usually completes in under 2 minutes. Refresh to see recommendation.
                </p>
              </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!dispute.aiRecommendation}
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!currentUser || !dispute.aiRecommendation) return
                            await customerReview({
                              paymentDisputeId: dispute._id,
                              reviewerUserId: currentUser._id,
                              decision: "APPROVE_AI",
                              finalVerdict: dispute.aiRecommendation.verdict as "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW",
                            })
                            setSuccessDisputeId(dispute._id)
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {dispute.aiRecommendation ? 'Approve AI' : 'Waiting for AI...'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/disputes/${dispute._id}`)
                          }}
                        >
                          Review Details
                        </Button>
              </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>
        
        {/* Footer Help */}
        {displayQueue.length > 0 && (
          <AnimatedSection direction="up" delay={0.3}>
            <Card className="bg-gray-50 dark:bg-gray-900">
            <CardContent className="pt-6">
              <h4 className="text-sm font-semibold mb-2">Tips for Reviewing:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
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
