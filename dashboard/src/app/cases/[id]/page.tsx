"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Clock, FileText, Scale, DollarSign, Calendar, Shield, ExternalLink } from "lucide-react"
import { motion } from "framer-motion";
import { CopyableField } from "@/components/case-detail/CopyableField";
import { EthereumAddressLink } from "@/components/ethereum/ethereum-address-link";
import { getTransactionExplorerUrl, getExplorerName } from "@/lib/ethereum";

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


  // Helper function to format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Helper function to get status description
  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      "FILED": "Your dispute has been filed and is under review",
      "AUTORULED": "Your dispute has been automatically resolved",
      "PANELED": "Your dispute is being reviewed by our panel",
      "DECIDED": "A final decision has been reached",
      "CLOSED": "This case is now closed"
    };
    return descriptions[status] || "Processing your dispute";
  };

  if (!caseDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
        <div className="container max-w-4xl mx-auto py-12 px-4">
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

  const statusColors: Record<string, string> = {
    "FILED": "bg-blue-50 text-blue-700 border-blue-200",
    "DECIDED": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "DISMISSED": "bg-slate-50 text-slate-700 border-slate-200",
    "APPEALED": "bg-blue-50 text-blue-700 border-blue-200",
    "AUTORULED": "bg-purple-50 text-purple-700 border-purple-200",
    "PANELED": "bg-amber-50 text-amber-700 border-amber-200",
    "CLOSED": "bg-slate-50 text-slate-700 border-slate-200"
  };
  const statusColor = statusColors[caseDetails.status] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50">
      <motion.div 
        className="container max-w-4xl mx-auto py-12 px-4"
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
          {/* Status Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Case Status</CardTitle>
                  <CardDescription className="mt-2">
                    {getStatusDescription(caseDetails.status)}
                  </CardDescription>
                </div>
                <Badge className={`${statusColor} border-2 px-4 py-2 text-base font-semibold`}>
                  {caseDetails.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Case ID</p>
                  <CopyableField value={caseId} label="Case ID copied" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Filed On</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <p className="text-sm">{formatTimestamp(caseDetails.filedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          {(paymentDispute || caseDetails.amount) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">
                      {paymentDispute ? "Disputed Amount" : "Claim Amount"}
                    </p>
                    {paymentDispute ? (
                      <>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          ${paymentDispute.amount?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-xs text-slate-500">{paymentDispute.currency || "USD"}</p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        ${caseDetails.amount?.toLocaleString() || "N/A"}
                      </p>
                    )}
                  </div>
                  {paymentDispute && paymentDispute.paymentDetails?.disputeFee && (
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Resolution Fee</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">
                        ${paymentDispute.paymentDetails.disputeFee.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{paymentDispute.paymentDetails.pricingTier} tier</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Payment Type & Details */}
          {caseDetails.paymentDetails && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Type Badge */}
                {caseDetails.paymentDetails.paymentType && (
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">Payment Type</p>
                    <Badge className={
                      caseDetails.paymentDetails.paymentType === "non_custodial" ? "bg-purple-100 text-purple-700 border-purple-300" :
                      caseDetails.paymentDetails.paymentType === "custodial" ? "bg-blue-100 text-blue-700 border-blue-300" :
                      caseDetails.paymentDetails.paymentType === "traditional" ? "bg-green-100 text-green-700 border-green-300" :
                      "bg-slate-100 text-slate-700 border-slate-300"
                    }>
                      {caseDetails.paymentDetails.paymentType === "non_custodial" ? "🔷 Crypto (Non-Custodial)" :
                       caseDetails.paymentDetails.paymentType === "custodial" ? "🔵 Crypto (Custodial)" :
                       caseDetails.paymentDetails.paymentType === "traditional" ? "💳 Traditional Payment" :
                       "Payment"}
                    </Badge>
                  </div>
                )}

                {/* Crypto Details */}
                {caseDetails.paymentDetails.crypto && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-purple-900">Crypto Transaction</p>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Currency:</span>
                        <span className="font-mono font-semibold">{caseDetails.paymentDetails.crypto.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Blockchain:</span>
                        <span className="font-semibold capitalize">{caseDetails.paymentDetails.crypto.blockchain}</span>
                      </div>
                      {caseDetails.paymentDetails.crypto.layer && (
                        <div className="flex justify-between">
                          <span className="text-purple-700">Layer:</span>
                          <span className="font-semibold">{caseDetails.paymentDetails.crypto.layer}</span>
                        </div>
                      )}
                      {caseDetails.paymentDetails.crypto.fromAddress && (
                        <div>
                          <span className="text-purple-700 text-xs block mb-1">From (Consumer):</span>
                          <EthereumAddressLink 
                            address={caseDetails.paymentDetails.crypto.fromAddress} 
                            chain={caseDetails.paymentDetails.crypto.blockchain}
                          />
                        </div>
                      )}
                      {caseDetails.paymentDetails.crypto.toAddress && (
                        <div>
                          <span className="text-purple-700 text-xs block mb-1">To (Merchant):</span>
                          <EthereumAddressLink 
                            address={caseDetails.paymentDetails.crypto.toAddress} 
                            chain={caseDetails.paymentDetails.crypto.blockchain}
                          />
                        </div>
                      )}
                      {caseDetails.paymentDetails.crypto.transactionHash && (
                        <div className="space-y-2">
                          <span className="text-purple-700 text-xs block">Transaction Hash:</span>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <div className="flex-1 w-full">
                              <CopyableField 
                                value={caseDetails.paymentDetails.crypto.transactionHash}
                                label="Transaction hash copied"
                                truncate
                                truncateLength={20}
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap h-8"
                              onClick={() => {
                                const url = caseDetails.paymentDetails.crypto.explorerUrl || 
                                           getTransactionExplorerUrl(
                                             caseDetails.paymentDetails.crypto.blockchain, 
                                             caseDetails.paymentDetails.crypto.transactionHash
                                           );
                                window.open(url, '_blank');
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1.5" />
                              View on {getExplorerName(caseDetails.paymentDetails.crypto.blockchain)}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Custodial Details */}
                {caseDetails.paymentDetails.custodial && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-blue-900">Custodial Platform</p>
                    <div className="text-sm">
                      <span className="text-blue-700">Platform: </span>
                      <span className="font-semibold capitalize">{caseDetails.paymentDetails.custodial.platform}</span>
                    </div>
                    {caseDetails.paymentDetails.custodial.platformTransactionId && (
                      <div className="text-sm">
                        <span className="text-blue-700">Transaction ID: </span>
                        <span className="font-mono text-xs">{caseDetails.paymentDetails.custodial.platformTransactionId}</span>
                      </div>
                    )}
                    {caseDetails.paymentDetails.custodial.isOnChain !== undefined && (
                      <div className="text-sm">
                        <span className="text-blue-700">On-Chain: </span>
                        <span className="font-semibold">{caseDetails.paymentDetails.custodial.isOnChain ? "Yes" : "No (Internal Ledger)"}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Traditional Payment Details */}
                {caseDetails.paymentDetails.traditional && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-green-900">Traditional Payment</p>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Method:</span>
                        <span className="font-semibold capitalize">{caseDetails.paymentDetails.traditional.paymentMethod}</span>
                      </div>
                      {caseDetails.paymentDetails.traditional.processor && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Processor:</span>
                          <span className="font-semibold capitalize">{caseDetails.paymentDetails.traditional.processor}</span>
                        </div>
                      )}
                      {caseDetails.paymentDetails.traditional.processorTransactionId && (
                        <div>
                          <span className="text-green-700 text-xs">Transaction ID: </span>
                          <span className="font-mono text-xs">{caseDetails.paymentDetails.traditional.processorTransactionId}</span>
                        </div>
                      )}
                      {caseDetails.paymentDetails.traditional.cardBrand && (
                        <div className="flex justify-between">
                          <span className="text-green-700">Card:</span>
                          <span className="font-semibold capitalize">{caseDetails.paymentDetails.traditional.cardBrand}</span>
                          {caseDetails.paymentDetails.traditional.lastFourDigits && (
                            <span className="text-xs">•••• {caseDetails.paymentDetails.traditional.lastFourDigits}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transaction ID */}
                <div>
                  <p className="text-sm font-semibold text-slate-600 mb-1">Transaction ID</p>
                  <CopyableField 
                    value={caseDetails.paymentDetails.transactionId} 
                    label="Transaction ID copied"
                    truncate
                    truncateLength={40}
                  />
                </div>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Custom Metadata */}
          {(caseDetails.metadata || caseDetails.paymentDetails?.metadata) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Custom Fields
                </CardTitle>
                <CardDescription>Merchant-specific identifiers and metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-50 border rounded p-4 text-xs overflow-auto max-h-96">
                  {JSON.stringify(caseDetails.metadata || caseDetails.paymentDetails?.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Resolution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <div className="h-3 w-3 rounded-full bg-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Dispute Filed</p>
                    <p className="text-sm text-slate-600">{formatTimestamp(caseDetails.filedAt)}</p>
                  </div>
                </div>

                {["PANELED", "DECIDED", "CLOSED"].includes(caseDetails.status) && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <div className="h-3 w-3 rounded-full bg-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Under Review</p>
                        <p className="text-sm text-slate-600">Case assigned to resolution panel</p>
                      </div>
                    </div>
                  </>
                )}

                {["DECIDED", "CLOSED"].includes(caseDetails.status) && caseDetails.decidedAt && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <div className="h-3 w-3 rounded-full bg-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Decision Reached</p>
                        <p className="text-sm text-slate-600">
                          {caseDetails.decidedAt ? formatTimestamp(caseDetails.decidedAt) : "Recently"}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {!["DECIDED", "CLOSED"].includes(caseDetails.status) && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <div className="h-3 w-3 rounded-full bg-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-500">Final Decision</p>
                        <p className="text-sm text-slate-400">Pending review completion</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          </motion.div>

          {/* Final Decision (if available) */}
          {caseDetails.finalVerdict && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-blue-700" />
                  Final Decision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">Verdict</p>
                    <Badge className="text-base px-4 py-2 bg-blue-600 text-white">
                      {caseDetails.finalVerdict.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  {caseDetails.aiRecommendation?.confidence && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-600 mb-1">AI Confidence</p>
                      <p className="text-lg font-bold text-slate-900">
                        {Math.round(caseDetails.aiRecommendation.confidence * 100)}%
                      </p>
                    </div>
                  )}
                </div>
                {(caseDetails.aiRecommendation?.reasoning || caseDetails.humanOverrideReason) && (
                  <div>
                    <p className="text-sm font-semibold text-slate-600 mb-2">Explanation</p>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {caseDetails.humanOverrideReason || caseDetails.aiRecommendation?.reasoning || "Decision rendered"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </motion.div>
          )}

          {/* Evidence Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Evidence Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {caseEvidence?.length || 0}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                {caseEvidence?.length === 1 ? "item" : "items"} submitted for review
              </p>
            </CardContent>
          </Card>
          </motion.div>

          {/* Footer */}
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
