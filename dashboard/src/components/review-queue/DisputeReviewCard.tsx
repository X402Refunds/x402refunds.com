"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle, XCircle } from "lucide-react"

type PaymentVerdict = "CONSUMER_WINS" | "MERCHANT_WINS" | "PARTIAL_REFUND" | "NEED_REVIEW";

interface Dispute {
  _id: string
  amount: number
  currency: string
  transactionId: string
  disputeReason: string
  paymentType?: "custodial" | "non_custodial" | "traditional"
  aiRecommendation?: PaymentVerdict
  aiRulingConfidence?: number
  aiReasoning?: string
  similarPastCases?: string[]
  regulationEDeadline: number
  caseData?: {
    description?: string
    evidenceIds?: string[]
  }
  disputeFee?: number
  pricingTier?: string
  metadata?: Record<string, unknown>
}

interface DisputeReviewCardProps {
  dispute: Dispute
  onApprove: (verdict: string, notes?: string) => void
  onOverride: (verdict: string, notes: string) => void
  onManualDecision?: (verdict: string, notes: string) => void // AI unable, human makes primary decision
}

export function DisputeReviewCard({ dispute, onApprove, onOverride, onManualDecision }: DisputeReviewCardProps) {
  // If AI says NEED_REVIEW, skip straight to manual decision (no AI recommendation to approve)
  const hasAiRecommendation = typeof dispute.aiRecommendation === "string"
  const aiNeedsReview = dispute.aiRecommendation === "NEED_REVIEW"
  const [showOverride, setShowOverride] = useState(aiNeedsReview)
  const [selectedVerdict, setSelectedVerdict] = useState<PaymentVerdict>("CONSUMER_WINS")
  const [selectedPartialAmount, setSelectedPartialAmount] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  const formatReason = (reason: string) => {
    return reason.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }
  
  const getVerdictDisplay = (verdict?: PaymentVerdict) => {
    switch (verdict) {
      case "CONSUMER_WINS": return "Consumer Wins (Refund)"
      case "MERCHANT_WINS": return "Merchant Wins (No Refund)"
      case "PARTIAL_REFUND": return "Partial Refund"
      case "NEED_REVIEW": return "Needs Review"
      default: return "Unknown"
    }
  }

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      if (!hasAiRecommendation) {
        alert("AI recommendation is not ready yet.")
        return
      }
      if (aiNeedsReview) {
        alert("AI marked this dispute as NEED_REVIEW. Please make a manual decision.")
        return
      }
      if (!dispute.aiRecommendation) return
      await onApprove(dispute.aiRecommendation)
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleOverride = async () => {
    if (!notes.trim()) {
      const message = aiNeedsReview 
        ? "Please explain your decision (helps AI learn)"
        : "Please provide notes explaining why you're overriding the AI recommendation"
      alert(message)
      return
    }
    setSubmitting(true)
    try {
      // If AI said NEED_REVIEW, this is a manual decision (not an override)
      if (aiNeedsReview && onManualDecision) {
        await onManualDecision(selectedVerdict, notes)
      } else {
        // AI made a recommendation, human is overriding it
        await onOverride(selectedVerdict, notes)
      }
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">
              ${dispute.amount.toFixed(2)} {dispute.currency}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Transaction: {dispute.transactionId}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatReason(dispute.disputeReason)}
            </p>
            {/* Payment Type Badge */}
            {dispute.paymentType && (
              <Badge className={
                dispute.paymentType === "non_custodial" ? "bg-purple-100 text-purple-700 border-purple-300 mt-2" :
                dispute.paymentType === "custodial" ? "bg-blue-100 text-blue-700 border-blue-300 mt-2" :
                dispute.paymentType === "traditional" ? "bg-green-100 text-green-700 border-green-300 mt-2" :
                "mt-2"
              }>
                {dispute.paymentType === "non_custodial" ? "🔷 Crypto" :
                 dispute.paymentType === "custodial" ? "🔵 Custodial" :
                 dispute.paymentType === "traditional" ? "💳 Traditional" :
                 dispute.paymentType}
              </Badge>
            )}
          </div>
          <Badge variant="secondary">
            Needs Review
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Analysis */}
        <div className={`border-2 p-4 rounded-lg ${
          aiNeedsReview 
            ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" 
            : "bg-accent border-border"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{aiNeedsReview ? "⚠️" : "🤖"}</span>
            <h4 className="font-semibold text-foreground">
              {aiNeedsReview 
                ? "AI Analysis: Unable to Make Recommendation" 
                : `AI Recommendation: ${getVerdictDisplay(dispute.aiRecommendation)}`
              }
            </h4>
          </div>
          {!aiNeedsReview && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-foreground">
                Confidence: <strong>{((dispute.aiRulingConfidence || 0) * 100).toFixed(1)}%</strong>
              </span>
              {dispute.similarPastCases && dispute.similarPastCases.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  • Based on {dispute.similarPastCases.length} similar cases
                </span>
              )}
            </div>
          )}
          {dispute.disputeFee && (
            <div className="text-xs text-muted-foreground mt-2">
              Resolution Fee: ${dispute.disputeFee.toFixed(2)} ({dispute.pricingTier} tier)
            </div>
          )}
          <p className="text-sm text-foreground mt-2">
            {aiNeedsReview 
              ? dispute.aiReasoning || "This case requires manual review. The AI was unable to make a confident recommendation based on available evidence and precedents."
              : (dispute.aiReasoning || "AI analysis pending...")
            }
          </p>
        </div>
        
        {/* Dispute Description */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Description:</h4>
          <p className="text-sm text-foreground">
            {dispute.caseData?.description || "No description provided"}
          </p>
        </div>
        
        {/* Evidence */}
        {dispute.caseData?.evidenceIds && dispute.caseData.evidenceIds.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Evidence ({dispute.caseData.evidenceIds.length}):</h4>
            <div className="space-y-1">
              {dispute.caseData.evidenceIds.slice(0, 3).map((evidenceId: string, i: number) => (
                <div key={i} className="text-sm text-primary flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>Evidence {i + 1}</span>
                </div>
              ))}
              {dispute.caseData.evidenceIds.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  + {dispute.caseData.evidenceIds.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Deadline Warning */}
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <span>⏰</span>
          <span>
            Regulation E deadline: {new Date(dispute.regulationEDeadline).toLocaleDateString()}
          </span>
        </div>
        
        {/* Action Buttons */}
        {!showOverride ? (
          <div className="flex gap-3 pt-2">
            {/* Only show Approve button if AI made an actual recommendation (not NEED_REVIEW) */}
            {hasAiRecommendation && !aiNeedsReview && (
              <Button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            )}
            <Button
              onClick={() => setShowOverride(true)}
              disabled={submitting}
              variant={aiNeedsReview ? "default" : "outline"}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {aiNeedsReview ? "Make Your Decision" : "Override AI"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold">
              {aiNeedsReview ? "Make Your Decision:" : "Override AI Recommendation:"}
            </h4>
            
            {/* Verdict Selection */}
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  value="CONSUMER_WINS"
                  checked={selectedVerdict === "CONSUMER_WINS"}
                  onChange={() => setSelectedVerdict("CONSUMER_WINS")}
                  className="mr-2"
                />
                <span className="text-sm">Consumer Wins (Refund)</span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  value="MERCHANT_WINS"
                  checked={selectedVerdict === "MERCHANT_WINS"}
                  onChange={() => setSelectedVerdict("MERCHANT_WINS")}
                  className="mr-2"
                />
                <span className="text-sm">Merchant Wins (No Refund)</span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  value="PARTIAL_REFUND"
                  checked={selectedVerdict === "PARTIAL_REFUND"}
                  onChange={() => setSelectedVerdict("PARTIAL_REFUND")}
                  className="mr-2"
                />
                <span className="text-sm">Partial Refund</span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  value="NEED_REVIEW"
                  checked={selectedVerdict === "NEED_REVIEW"}
                  onChange={() => setSelectedVerdict("NEED_REVIEW")}
                  className="mr-2"
                />
                <span className="text-sm">Escalate to Panel</span>
              </label>
            </div>

            {selectedVerdict === "PARTIAL_REFUND" && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Partial Refund Amount (USDC)
                </label>
                <input
                  value={selectedPartialAmount}
                  onChange={(e) => setSelectedPartialAmount(e.target.value)}
                  placeholder="e.g. 0.250000"
                  inputMode="decimal"
                  className="w-full border rounded-md p-2 text-sm bg-background"
                />
              </div>
            )}
            
            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                {aiNeedsReview 
                  ? "Explain your decision (helps AI learn):" 
                  : "Why are you overriding? (helps AI learn)"
                }
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={aiNeedsReview
                  ? "Example: Based on transaction history and evidence, this appears to be a legitimate service failure..."
                  : "Example: Customer has history of fraud claims, evidence shows service was actually delivered..."
                }
                className="w-full border rounded-md p-2 text-sm min-h-[80px] bg-background"
                rows={3}
              />
            </div>
            
            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleOverride}
                disabled={submitting || !notes.trim()}
                className="flex-1"
              >
                {aiNeedsReview 
                  ? `Submit Decision: ${getVerdictDisplay(selectedVerdict)}` 
                  : `Submit Override: ${getVerdictDisplay(selectedVerdict)}`
                }
              </Button>
              {!aiNeedsReview && (
                <Button
                  onClick={() => setShowOverride(false)}
                  disabled={submitting}
                  variant="ghost"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

