"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

interface CaseFinancialBreakdownProps {
  amount?: number;
  currency?: string;
  disputeFee?: number;
  pricingTier?: string;
  finalVerdict?: string;
  aiRecommendation?: {
    verdict: string;
  };
}

export function CaseFinancialBreakdown({ 
  amount = 0,
  currency = "USD",
  disputeFee,
  pricingTier,
  finalVerdict,
  aiRecommendation
}: CaseFinancialBreakdownProps) {
  // Determine refund based on verdict
  const verdict = finalVerdict || aiRecommendation?.verdict;
  
  let refundAmount = 0;
  let refundLabel = "No Refund";
  let refundColor = "text-slate-600";
  let refundIcon = AlertCircle;

  if (verdict === "CONSUMER_WINS" || verdict === "PLAINTIFF_WINS") {
    refundAmount = amount;
    refundLabel = "Full Refund";
    refundColor = "text-emerald-600";
    refundIcon = TrendingUp;
  } else if (verdict === "PARTIAL_REFUND" || verdict === "SPLIT") {
    // Estimate 50% for partial (would need actual data for real calculation)
    refundAmount = amount * 0.5;
    refundLabel = "Partial Refund";
    refundColor = "text-amber-600";
    refundIcon = TrendingDown;
  } else if (verdict === "MERCHANT_WINS" || verdict === "DEFENDANT_WINS") {
    refundAmount = 0;
    refundLabel = "No Refund";
    refundColor = "text-slate-600";
    refundIcon = AlertCircle;
  }

  const RefundIcon = refundIcon;

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Disputed Amount */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">
              Disputed Amount
            </p>
            <p className="text-3xl font-bold text-foreground">
              ${amount.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{currency}</p>
          </div>

          {/* Resolution Fee */}
          {disputeFee !== undefined && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">
                Resolution Fee
              </p>
              <p className="text-3xl font-bold text-foreground">
                ${disputeFee.toFixed(2)}
              </p>
              {pricingTier && (
                <Badge variant="outline" className="text-xs mt-2">
                  {pricingTier} tier
                </Badge>
              )}
            </div>
          )}

          {/* Potential/Actual Refund */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-1">
              {finalVerdict ? "Refund Amount" : "Potential Refund"}
            </p>
            <div className="flex items-center gap-2 mb-1">
              <RefundIcon className={`h-6 w-6 ${refundColor}`} />
              <p className={`text-3xl font-bold ${refundColor}`}>
                ${refundAmount.toFixed(2)}
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs mt-2 ${
                refundAmount === amount ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                refundAmount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" :
                "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {refundLabel}
            </Badge>
          </div>
        </div>

        {/* Refund Calculation Breakdown (if partial) */}
        {verdict === "PARTIAL_REFUND" || verdict === "SPLIT" ? (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              Refund Calculation
            </p>
            <div className="space-y-1 text-sm text-amber-700">
              <div className="flex justify-between">
                <span>Original Amount:</span>
                <span className="font-mono">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Refund Percentage:</span>
                <span className="font-mono">~50%</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-amber-300 pt-1 mt-2">
                <span>Refund Amount:</span>
                <span className="font-mono">${refundAmount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-3">
              Note: Actual refund amount may vary based on specific case details and ruling.
            </p>
          </div>
        ) : null}

        {/* Status Message */}
        {!verdict && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Pending decision:</span> Financial outcome will be determined once the case is resolved.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

