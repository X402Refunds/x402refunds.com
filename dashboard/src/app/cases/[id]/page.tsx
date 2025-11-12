"use client";

import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

// Import new components
import { CaseHeroStatus } from "@/components/case-detail/CaseHeroStatus";
import { CaseParties } from "@/components/case-detail/CaseParties";
import { CaseAIRecommendation } from "@/components/case-detail/CaseAIRecommendation";
import { CaseHumanReview } from "@/components/case-detail/CaseHumanReview";
import { CaseFinancialBreakdown } from "@/components/case-detail/CaseFinancialBreakdown";
import { CaseTransactionDetails } from "@/components/case-detail/CaseTransactionDetails";
import { CaseTimeline } from "@/components/case-detail/CaseTimeline";
import { CaseEvidence } from "@/components/case-detail/CaseEvidence";
import { CaseMetadata } from "@/components/case-detail/CaseMetadata";

export default function PublicCaseTrackingPage() {
  const params = useParams();
  const caseId = params.id as Id<"cases">;

  // Fetch case details (public endpoint - no auth required)
  const caseDetails = useQuery(api.cases.getCaseById, { caseId });
  const caseEvidence = useQuery(api.evidence.getEvidenceByCaseId, { caseId });

  // Fetch payment dispute data if this is a payment dispute case
  const paymentDispute = useQuery(
    api.paymentDisputes.getPaymentDisputeByCaseId,
    caseDetails ? { caseId } : "skip"
  );

  if (!caseDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        <div className="container max-w-6xl mx-auto py-12 px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-slate-900">x402Disputes</h1>
            </div>
            <p className="text-sm text-slate-600">Case Tracking</p>
          </div>

          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading case details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <motion.div 
        className="container max-w-6xl mx-auto py-12 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">x402Disputes</h1>
          </div>
          <p className="text-sm text-slate-600">Dispute Resolution Case Tracking</p>
        </motion.div>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* 1. Hero Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CaseHeroStatus
              status={caseDetails.status}
              filedAt={caseDetails.filedAt}
              decidedAt={caseDetails.decidedAt}
              caseId={caseId}
            />
          </motion.div>

          {/* 2. Parties Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
            <CaseParties
              plaintiff={caseDetails.plaintiff}
              defendant={caseDetails.defendant}
              plaintiffMetadata={caseDetails.paymentDetails?.plaintiffMetadata}
              defendantMetadata={caseDetails.paymentDetails?.defendantMetadata}
              crypto={caseDetails.signedEvidence?.crypto || caseDetails.paymentDetails?.crypto}
            />
            </motion.div>

          {/* 3. AI Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
            <CaseAIRecommendation
              aiRecommendation={caseDetails.aiRecommendation}
            />
            </motion.div>

          {/* 4. Human Review (conditional) */}
          {(caseDetails.humanReviewRequired || caseDetails.humanReviewedAt || caseDetails.humanOverrideReason) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <CaseHumanReview
                humanReviewRequired={caseDetails.humanReviewRequired}
                humanReviewedAt={caseDetails.humanReviewedAt}
                humanReviewedBy={caseDetails.humanReviewedBy}
                humanAgreesWithAI={caseDetails.humanAgreesWithAI}
                humanOverrideReason={caseDetails.humanOverrideReason}
                finalVerdict={caseDetails.finalVerdict}
                aiRecommendation={caseDetails.aiRecommendation}
              />
            </motion.div>
          )}

          {/* 5. Financial Breakdown */}
          {(caseDetails.amount || paymentDispute) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
              <CaseFinancialBreakdown
                amount={caseDetails.amount || paymentDispute?.amount || 0}
                currency={caseDetails.currency || paymentDispute?.currency}
                disputeFee={caseDetails.paymentDetails?.disputeFee || paymentDispute?.paymentDetails?.disputeFee}
                pricingTier={caseDetails.paymentDetails?.pricingTier || paymentDispute?.paymentDetails?.pricingTier}
                finalVerdict={caseDetails.finalVerdict}
                aiRecommendation={caseDetails.aiRecommendation}
              />
            </motion.div>
          )}

          {/* 6. Transaction Details */}
          {caseDetails.paymentDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <CaseTransactionDetails
                transactionId={caseDetails.paymentDetails.transactionId}
                crypto={caseDetails.signedEvidence?.crypto || caseDetails.paymentDetails.crypto}
                custodial={caseDetails.signedEvidence?.custodial || caseDetails.paymentDetails.custodial}
                traditional={caseDetails.signedEvidence?.traditional || caseDetails.paymentDetails.traditional}
              />
            </motion.div>
          )}

          {/* 7. Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <CaseTimeline
              status={caseDetails.status}
              filedAt={caseDetails.filedAt}
              decidedAt={caseDetails.decidedAt}
              aiRecommendation={caseDetails.aiRecommendation}
              humanReviewedAt={caseDetails.humanReviewedAt}
              regulationEDeadline={caseDetails.paymentDetails?.regulationEDeadline || caseDetails.regulationEDeadline}
            />
          </motion.div>

          {/* 8. Evidence */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <CaseEvidence
              evidence={caseEvidence}
              signedEvidence={caseDetails.signedEvidence}
            />
          </motion.div>

          {/* 9. Metadata (collapsed by default) */}
          {(caseDetails.metadata || caseDetails.paymentDetails?.metadata) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <CaseMetadata
                metadata={caseDetails.metadata}
                paymentMetadata={caseDetails.paymentDetails?.metadata}
              />
            </motion.div>
          )}

          {/* 10. Support Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="py-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-slate-900">Need assistance?</p>
                <p className="text-xs text-slate-600">
                  Contact your payment provider for questions about this dispute.
                </p>
                <p className="text-xs text-slate-500 mt-4">
                  Case disputes are resolved in accordance with applicable regulations.
                </p>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
