"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle, XCircle } from "lucide-react"

interface Dispute {
  _id: string
  amount: number
  currency: string
  transactionId: string
  disputeReason: string
  aiRecommendation?: string
  aiRulingConfidence?: number
  aiReasoning?: string
  similarPastCases?: string[]
  regulationEDeadline: number
  caseData?: {
    description?: string
    evidenceIds?: string[]
  }
}

interface DisputeReviewCardProps {
  dispute: Dispute
  onApprove: (verdict: string, notes?: string) => void
  onOverride: (verdict: string, notes: string) => void
}

export function DisputeReviewCard({ dispute, onApprove, onOverride }: DisputeReviewCardProps) {
  const [showOverride, setShowOverride] = useState(false)
  const [selectedVerdict, setSelectedVerdict] = useState<"UPHELD" | "DISMISSED">("UPHELD")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  const formatReason = (reason: string) => {
    return reason.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }
  
  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await onApprove(dispute.aiRecommendation || "UPHELD")
    } finally {
      setSubmitting(false)
    }
  }
  
  const handleOverride = async () => {
    if (!notes.trim()) {
      alert("Please provide notes explaining why you're overriding the AI recommendation")
      return
    }
    setSubmitting(true)
    try {
      await onOverride(selectedVerdict, notes)
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
            <p className="text-sm text-gray-600 mt-1">
              Transaction: {dispute.transactionId}
            </p>
            <p className="text-sm text-gray-500">
              {formatReason(dispute.disputeReason)}
            </p>
          </div>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Needs Review
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* AI Recommendation */}
        <div className="bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🤖</span>
            <h4 className="font-semibold text-purple-900 dark:text-purple-100">
              AI Recommendation: {dispute.aiRecommendation || "UPHELD"}
            </h4>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-purple-800 dark:text-purple-200">
              Confidence: <strong>{((dispute.aiRulingConfidence || 0) * 100).toFixed(1)}%</strong>
            </span>
            {dispute.similarPastCases && dispute.similarPastCases.length > 0 && (
              <span className="text-xs text-purple-600 dark:text-purple-300">
                • Based on {dispute.similarPastCases.length} similar cases
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {dispute.aiReasoning || "AI analysis pending..."}
          </p>
        </div>
        
        {/* Dispute Description */}
        <div>
          <h4 className="text-sm font-semibold mb-1">Description:</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {dispute.caseData?.description || "No description provided"}
          </p>
        </div>
        
        {/* Evidence */}
        {dispute.caseData?.evidenceIds && dispute.caseData.evidenceIds.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Evidence ({dispute.caseData.evidenceIds.length}):</h4>
            <div className="space-y-1">
              {dispute.caseData.evidenceIds.slice(0, 3).map((evidenceId: string, i: number) => (
                <div key={i} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>Evidence {i + 1}</span>
                </div>
              ))}
              {dispute.caseData.evidenceIds.length > 3 && (
                <p className="text-xs text-gray-500">
                  + {dispute.caseData.evidenceIds.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
        
        {/* Deadline Warning */}
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span>⏰</span>
          <span>
            Regulation E deadline: {new Date(dispute.regulationEDeadline).toLocaleDateString()}
          </span>
        </div>
        
        {/* Action Buttons */}
        {!showOverride ? (
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve AI Decision
            </Button>
            <Button
              onClick={() => setShowOverride(true)}
              disabled={submitting}
              variant="outline"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Override AI
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold">Override AI Recommendation:</h4>
            
            {/* Verdict Selection */}
            <div className="flex gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  value="UPHELD"
                  checked={selectedVerdict === "UPHELD"}
                  onChange={() => setSelectedVerdict("UPHELD")}
                  className="mr-2"
                />
                <span className="text-sm">UPHOLD (Customer wins)</span>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="verdict"
                  value="DISMISSED"
                  checked={selectedVerdict === "DISMISSED"}
                  onChange={() => setSelectedVerdict("DISMISSED")}
                  className="mr-2"
                />
                <span className="text-sm">DISMISS (Merchant wins)</span>
              </label>
            </div>
            
            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Why are you overriding? (helps AI learn)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Example: Customer has history of fraud claims, evidence shows service was actually delivered..."
                className="w-full border rounded-md p-2 text-sm min-h-[80px] bg-white dark:bg-slate-900"
                rows={3}
              />
            </div>
            
            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleOverride}
                disabled={submitting || !notes.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Submit Override: {selectedVerdict}
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
  )
}

