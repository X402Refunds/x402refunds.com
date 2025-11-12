"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, GitCompare, Clock, CheckCircle2, XCircle } from "lucide-react";

interface CaseHumanReviewProps {
  humanReviewRequired?: boolean;
  humanReviewedAt?: number;
  humanReviewedBy?: string;
  humanAgreesWithAI?: boolean;
  humanOverrideReason?: string;
  finalVerdict?: string;
  aiRecommendation?: {
    verdict: string;
  };
}

export function CaseHumanReview({
  humanReviewRequired,
  humanReviewedAt,
  humanReviewedBy,
  humanAgreesWithAI,
  humanOverrideReason,
  finalVerdict,
  aiRecommendation
}: CaseHumanReviewProps) {
  // Don't show if human review is not required/applicable
  if (!humanReviewRequired && !humanReviewedAt && !humanOverrideReason) {
    return null;
  }

  const isPending = humanReviewRequired && !humanReviewedAt;
  const isReviewed = humanReviewedAt !== undefined;

  return (
    <Card className="border-2 bg-blue-50/50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-blue-600" />
          Human Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review Status */}
        {isPending ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Review in Progress</p>
              <p className="text-sm text-amber-700 mt-1">
                This case is awaiting human review for final decision.
              </p>
            </div>
          </div>
        ) : isReviewed ? (
          <div className="space-y-4">
            {/* Review Complete Badge */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">Review Complete</p>
                {humanReviewedBy && (
                  <p className="text-sm text-emerald-700 mt-1">
                    Reviewed by {humanReviewedBy}
                  </p>
                )}
                {humanReviewedAt && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {new Date(humanReviewedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* AI vs Human Comparison */}
            {aiRecommendation && finalVerdict && (
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <GitCompare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    Decision Comparison
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* AI Recommendation */}
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                    <p className="text-xs font-semibold text-purple-700 mb-2">
                      AI Recommendation
                    </p>
                    <Badge className="bg-purple-500 text-white">
                      {aiRecommendation.verdict.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {/* Human Decision */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs font-semibold text-blue-700 mb-2">
                      Final Decision
                    </p>
                    <Badge className="bg-blue-500 text-white">
                      {finalVerdict.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Agreement Status */}
                <div className="mt-4 flex items-center gap-2">
                  {humanAgreesWithAI ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <p className="text-sm text-emerald-700 font-semibold">
                        Human reviewer agreed with AI recommendation
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm text-amber-700 font-semibold">
                        Human reviewer overrode AI recommendation
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Override Reasoning */}
            {humanOverrideReason && (
              <div className="p-4 bg-white border rounded-lg">
                <p className="text-sm font-semibold text-foreground mb-2">
                  {humanAgreesWithAI ? "Review Notes" : "Override Reasoning"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {humanOverrideReason}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Educational Message */}
        <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded p-3">
          <p className="font-semibold mb-1">Why human review?</p>
          <p>
            Cases requiring nuanced judgment, low AI confidence, or regulatory compliance undergo human review 
            to ensure fair and accurate resolutions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

