"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { useState } from "react"
import { SuccessCheckmark } from "@/components/ui/success-checkmark"
import { motion } from "framer-motion"
import { AgentWorkflowTimeline } from "@/components/workflow/agent-workflow-timeline"
import { SignedEvidenceCard } from "@/components/dispute/SignedEvidenceCard"
import { PaymentProofCard } from "@/components/dispute/PaymentProofCard"
import { PartiesCard } from "@/components/dispute/PartiesCard"
import { DisputeHeader } from "@/components/dispute/DisputeHeader"

type PaymentVerdict = "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW"

export default function DisputeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [showOverride, setShowOverride] = useState(false)
  const [selectedVerdict, setSelectedVerdict] = useState<PaymentVerdict>("CONSUMER_WINS")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const disputeId = params.id as string

  // Sync and get user
  const currentUser = useQuery(
    api.users.getCurrentUser,
    {} // Auth verified server-side via ctx.auth
  )

  // Get dispute details
  const dispute = useQuery(
    api.paymentDisputes.getPaymentDispute,
    disputeId ? { paymentDisputeId: disputeId as Id<"cases"> } : "skip"
  )

  const customerReview = useMutation(api.paymentDisputes.customerReview)

  const handleApprove = async () => {
    if (!currentUser || !dispute) return
    setSubmitting(true)
    try {
      await customerReview({
        paymentDisputeId: dispute._id,
        reviewerUserId: currentUser._id,
        decision: "APPROVE_AI",
        finalVerdict: (dispute.aiRecommendation?.verdict as "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW") || "CONSUMER_WINS",
      })
      setShowSuccess(true)
      setTimeout(() => {
        router.push("/dashboard/review-queue")
      }, 1500)
    } catch (error) {
      console.error("Failed to approve:", error)
      alert("Failed to approve decision. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleOverride = async () => {
    if (!currentUser || !dispute) return
    if (!notes.trim()) {
      alert("Please provide notes explaining your decision")
      return
    }
    setSubmitting(true)
    try {
      await customerReview({
        paymentDisputeId: dispute._id,
        reviewerUserId: currentUser._id,
        decision: "OVERRIDE",
        finalVerdict: selectedVerdict,
        notes,
      })
      router.push("/dashboard/review-queue")
    } catch (error) {
      console.error("Failed to override:", error)
      alert("Failed to submit override. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const getVerdictDisplay = (verdict?: PaymentVerdict) => {
    switch (verdict) {
      case "CONSUMER_WINS": return "Consumer Wins (Full Refund)"
      case "MERCHANT_WINS": return "Merchant Wins (No Refund)"
      case "PARTIAL_REFUND": return "Partial Refund"
      case "NEED_REVIEW": return "Needs Review"
      default: return "Unknown"
    }
  }

  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!dispute) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading dispute...</div>
        </div>
      </DashboardLayout>
    )
  }

  const isResolved = !!dispute.humanReviewedAt
  
  // Extract party information
  const consumerInfo = {
    identifier: dispute.plaintiff,
    email: dispute.plaintiffMetadata?.email,
    name: dispute.plaintiffMetadata?.name,
    customerId: dispute.plaintiffMetadata?.customerId,
    walletAddress: dispute.signedEvidence?.crypto?.fromAddress,
  }

  const merchantInfo = {
    identifier: dispute.defendant,
    email: dispute.defendantMetadata?.email,
    name: dispute.defendantMetadata?.name,
    merchantId: dispute.defendantMetadata?.merchantId,
    walletAddress: dispute.signedEvidence?.crypto?.toAddress,
  }

  return (
    <DashboardLayout>
      <SuccessCheckmark show={showSuccess} onComplete={() => setShowSuccess(false)} />
      <motion.div 
        className="max-w-5xl mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <DisputeHeader
            disputeReason={dispute.paymentDetails?.disputeReason || "payment_dispute"}
            amount={dispute.amount || 0}
            currency={dispute.currency || "USD"}
            plaintiff={dispute.plaintiff}
            defendant={dispute.defendant}
            filedAt={dispute.filedAt}
            deadline={dispute.regulationEDeadline}
            isResolved={isResolved}
          />
        </motion.div>

        {/* Signed Evidence Card - Show if available */}
        {dispute.signedEvidence && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <SignedEvidenceCard
              signedEvidence={dispute.signedEvidence}
              description={dispute.description}
            />
          </motion.div>
        )}

        {/* Payment Proof Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PaymentProofCard
            amount={dispute.amount || 0}
            currency={dispute.currency || "USD"}
            crypto={dispute.signedEvidence?.crypto || dispute.paymentDetails?.crypto}
            custodial={dispute.signedEvidence?.custodial || dispute.paymentDetails?.custodial}
            traditional={dispute.signedEvidence?.traditional || dispute.paymentDetails?.traditional}
          />
        </motion.div>

        {/* Parties Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <PartiesCard consumer={consumerInfo} merchant={merchantInfo} />
        </motion.div>

        {/* AI Analysis & Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {/* AI Recommendation */}
          {!isResolved && dispute.aiRecommendation && (
            <Card className="border-l-4 border-l-blue-600 mb-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  <div className="flex-1">
                    <CardTitle>AI Recommendation</CardTitle>
                    <CardDescription>
                      Based on {dispute.aiRecommendation?.similarCases?.length || 0} similar cases
                      {dispute.regulationEDeadline && (
                        <> • Must resolve by: {new Date(dispute.regulationEDeadline).toLocaleDateString()}</>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Verdict</p>
                    <p className="text-lg font-bold text-slate-900">
                      {getVerdictDisplay(dispute.aiRecommendation?.verdict as PaymentVerdict)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Confidence</p>
                    <p className="text-lg font-bold text-blue-600">
                      {((dispute.aiRecommendation?.confidence || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                {dispute.aiRecommendation?.reasoning && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">AI Analysis</p>
                    <p className="text-sm text-blue-800">{dispute.aiRecommendation.reasoning}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Workflow Timeline - Collapsed by default */}
          <AgentWorkflowTimeline caseId={disputeId as Id<"cases">} defaultExpanded={false} />
        </motion.div>

        {/* Resolution Status */}
        {isResolved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <Card className="border-l-4 border-l-emerald-600">
              <CardHeader>
                <CardTitle>Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Final Verdict</p>
                    <p className="text-lg font-bold text-slate-900">
                      {getVerdictDisplay(dispute.finalVerdict as PaymentVerdict)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Reviewed By</p>
                    <p className="text-sm text-slate-900">{dispute.humanReviewedBy || "System"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Reviewed At</p>
                    <p className="text-sm text-slate-900">
                      {dispute.humanReviewedAt
                        ? new Date(dispute.humanReviewedAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Decision Type</p>
                    <Badge variant={dispute.humanAgreesWithAI ? "default" : "secondary"}>
                      {dispute.humanAgreesWithAI ? "Approved AI" : "Human Override"}
                    </Badge>
                  </div>
                </div>

                {dispute.humanOverrideReason && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium text-slate-600 mb-2">Review Notes</p>
                    <p className="text-sm text-slate-700">{dispute.humanOverrideReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        {!isResolved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
                <CardDescription>
                  Make your final decision on this dispute
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showOverride ? (
                  <div className="flex gap-4">
                    <Button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Approve AI Recommendation
                    </Button>
                    <Button
                      onClick={() => setShowOverride(true)}
                      disabled={submitting}
                      variant="outline"
                      className="flex-1 h-12"
                    >
                      Override AI Decision
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-3">Select Your Verdict</p>
                      <div className="grid grid-cols-2 gap-3">
                        {(["CONSUMER_WINS", "MERCHANT_WINS", "PARTIAL_REFUND", "NEED_REVIEW"] as const).map((verdict) => (
                          <label
                            key={verdict}
                            className={`cursor-pointer p-3 border-2 rounded-lg transition-colors ${
                              selectedVerdict === verdict
                                ? "border-blue-600 bg-blue-50"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="verdict"
                              value={verdict}
                              checked={selectedVerdict === verdict}
                              onChange={() => setSelectedVerdict(verdict)}
                              className="mr-2"
                            />
                            <span className="text-sm font-medium">{getVerdictDisplay(verdict)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        Explain Your Decision (required)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Provide context that helps the AI learn from your decision..."
                        className="w-full border-2 border-slate-200 rounded-lg p-3 text-sm min-h-[100px] focus:border-blue-600 focus:outline-none"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleOverride}
                        disabled={submitting || !notes.trim()}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Submit Override: {getVerdictDisplay(selectedVerdict)}
                      </Button>
                      <Button
                        onClick={() => setShowOverride(false)}
                        disabled={submitting}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  )
}
