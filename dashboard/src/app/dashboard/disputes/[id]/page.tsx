"use client"

import { useParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Clock } from "lucide-react"
import { useState } from "react"

type PaymentVerdict = "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW"

export default function DisputeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [showOverride, setShowOverride] = useState(false)
  const [selectedVerdict, setSelectedVerdict] = useState<PaymentVerdict>("CONSUMER_WINS")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const disputeId = params.id as string

  // Sync and get user
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkUserId: user.id } : "skip"
  )

  // Get dispute details
  const dispute = useQuery(
    api.paymentDisputes.getPaymentDispute,
    disputeId ? { paymentDisputeId: disputeId as Id<"paymentDisputes"> } : "skip"
  )

  // Get case details if available
  const caseDetails = useQuery(
    api.cases.getCase,
    dispute?.caseId ? { caseId: dispute.caseId } : "skip"
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
        finalVerdict: dispute.aiRecommendation || "CONSUMER_WINS",
      })
      router.push("/dashboard/review-queue")
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

  const formatReason = (reason: string) => {
    return reason.split("_").map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(" ")
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

  if (!isLoaded || !currentUser) {
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

  const isResolved = dispute.humanReviewedAt || dispute.customerFinalDecision

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">Dispute Details</h1>
            <p className="text-slate-600 mt-1">Transaction: {dispute.transactionId}</p>
          </div>
          {isResolved ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolved
            </Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200">
              <Clock className="h-4 w-4 mr-1" />
              Pending Review
            </Badge>
          )}
        </div>

        {/* Transaction Info */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-600">Amount</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${dispute.amount.toFixed(2)} {dispute.currency}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Transaction ID</p>
                <p className="text-sm font-mono text-slate-900">{dispute.transactionId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Dispute Reason</p>
                <p className="text-sm text-slate-900">{formatReason(dispute.disputeReason || "")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Payment Protocol</p>
                <p className="text-sm text-slate-900">{dispute.paymentProtocol || "N/A"}</p>
              </div>
              {dispute.disputeFee && (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Resolution Fee</p>
                    <p className="text-sm text-slate-900">${dispute.disputeFee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pricing Tier</p>
                    <Badge variant="secondary">{dispute.pricingTier}</Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendation */}
        {!isResolved && (
          <Card className="border-l-4 border-l-blue-600">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <div>
                  <CardTitle>AI Recommendation</CardTitle>
                  <CardDescription>
                    Based on {dispute.similarPastCases?.length || 0} similar cases
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Verdict</p>
                  <p className="text-lg font-bold text-slate-900">
                    {getVerdictDisplay(dispute.aiRecommendation)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600">Confidence</p>
                  <p className="text-lg font-bold text-blue-600">
                    {((dispute.aiRulingConfidence || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {dispute.aiReasoning && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-2">AI Analysis</p>
                  <p className="text-sm text-blue-800">{dispute.aiReasoning}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resolution Status */}
        {isResolved && (
          <Card className="border-l-4 border-l-emerald-600">
            <CardHeader>
              <CardTitle>Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Final Verdict</p>
                  <p className="text-lg font-bold text-slate-900">
                    {getVerdictDisplay(dispute.customerFinalDecision)}
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

              {dispute.customerReviewNotes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-slate-600 mb-2">Review Notes</p>
                  <p className="text-sm text-slate-700">{dispute.customerReviewNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Case Information */}
        {caseDetails && (
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-slate-600">Case ID</p>
                  <p className="text-sm font-mono text-slate-900">{caseDetails._id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Status</p>
                  <Badge variant="secondary">{caseDetails.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Filed At</p>
                  <p className="text-sm text-slate-900">
                    {new Date(caseDetails._creationTime).toLocaleString()}
                  </p>
                </div>
                {dispute.regulationEDeadline && (
                  <div>
                    <p className="text-sm font-medium text-slate-600">Regulation E Deadline</p>
                    <p className="text-sm text-slate-900">
                      {new Date(dispute.regulationEDeadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {!isResolved && (
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
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
        )}
      </div>
    </DashboardLayout>
  )
}
