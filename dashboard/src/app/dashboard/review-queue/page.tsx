"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DisputeReviewCard } from "@/components/review-queue/DisputeReviewCard"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function ReviewQueuePage() {
  const { user, isLoaded } = useUser()
  
  // Sync and get user
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkUserId: user.id } : "skip"
  )
  
  // Get review queue for user's organization
  const reviewQueue = useQuery(
    api.paymentDisputes.getCustomerReviewQueue,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip"
  )
  
  const customerReview = useMutation(api.paymentDisputes.customerReview)
  
  const handleApprove = async (paymentDisputeId: Id<"paymentDisputes">, verdict: string) => {
    if (!currentUser) return
    
    try {
      await customerReview({
        paymentDisputeId,
        reviewerUserId: currentUser._id,
        decision: "APPROVE_AI",
        finalVerdict: verdict as "UPHELD" | "DISMISSED" | "SPLIT" | "NEED_PANEL",
      })
    } catch (error) {
      console.error("Failed to approve:", error)
      alert("Failed to approve decision. Please try again.")
    }
  }
  
  const handleOverride = async (paymentDisputeId: Id<"paymentDisputes">, verdict: string, notes: string) => {
    if (!currentUser) return
    
    try {
      await customerReview({
        paymentDisputeId,
        reviewerUserId: currentUser._id,
        decision: "OVERRIDE",
        finalVerdict: verdict as "UPHELD" | "DISMISSED" | "SPLIT" | "NEED_PANEL",
        notes,
      })
    } catch (error) {
      console.error("Failed to override:", error)
      alert("Failed to submit override. Please try again.")
    }
  }
  
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
  
  return (
    <DashboardLayout>
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Payment Dispute Review Queue</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review disputes that need your domain expertise. AI handles 95%, you review the rest.
          </p>
        </div>
        
        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  95%
                </div>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Auto-Resolved by AI
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                  {reviewQueue.length}
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Awaiting Your Review
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  &lt;5 min
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Avg Resolution Time
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Info Banner */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold mb-1">Infrastructure Model</p>
                <p>
                  You make all final decisions. The AI provides recommendations based on pattern matching
                  and historical data. When you approve or override, the system learns from your expertise
                  to improve future recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Review Queue */}
        {reviewQueue.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
                <p className="text-sm">
                  No disputes need review. The AI is handling everything automatically.
                </p>
                <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                  95%+ of disputes are resolved instantly by AI pattern matching.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviewQueue.map((dispute) => (
              <DisputeReviewCard
                key={dispute._id}
                dispute={dispute as unknown as Parameters<typeof DisputeReviewCard>[0]['dispute']}
                onApprove={(verdict) => handleApprove(dispute._id, verdict)}
                onOverride={(verdict, notes) => handleOverride(dispute._id, verdict, notes)}
              />
            ))}
          </div>
        )}
        
        {/* Footer Help */}
        {reviewQueue.length > 0 && (
          <Card className="mt-6 bg-gray-50 dark:bg-gray-900">
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
        )}
      </div>
    </DashboardLayout>
  )
}

