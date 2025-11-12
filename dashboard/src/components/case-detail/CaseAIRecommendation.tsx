"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Clock, Database } from "lucide-react";

interface AIRecommendation {
  verdict: string;
  confidence: number;
  reasoning: string;
  analyzedAt: number;
  similarCases: string[];
  tokensUsed?: number;
}

interface CaseAIRecommendationProps {
  aiRecommendation?: AIRecommendation;
}

const VERDICT_CONFIG: Record<string, { color: string; label: string; bgColor: string }> = {
  CONSUMER_WINS: { 
    color: "bg-emerald-500 text-white", 
    label: "Consumer Wins",
    bgColor: "bg-emerald-50 border-emerald-200"
  },
  PLAINTIFF_WINS: { 
    color: "bg-emerald-500 text-white", 
    label: "Plaintiff Wins",
    bgColor: "bg-emerald-50 border-emerald-200"
  },
  MERCHANT_WINS: { 
    color: "bg-red-500 text-white", 
    label: "Merchant Wins",
    bgColor: "bg-red-50 border-red-200"
  },
  DEFENDANT_WINS: { 
    color: "bg-red-500 text-white", 
    label: "Defendant Wins",
    bgColor: "bg-red-50 border-red-200"
  },
  PARTIAL_REFUND: { 
    color: "bg-amber-500 text-white", 
    label: "Partial Refund",
    bgColor: "bg-amber-50 border-amber-200"
  },
  SPLIT: { 
    color: "bg-amber-500 text-white", 
    label: "Split Decision",
    bgColor: "bg-amber-50 border-amber-200"
  },
  NEED_REVIEW: { 
    color: "bg-blue-500 text-white", 
    label: "Needs Review",
    bgColor: "bg-blue-50 border-blue-200"
  },
  NEED_PANEL: { 
    color: "bg-blue-500 text-white", 
    label: "Needs Panel Review",
    bgColor: "bg-blue-50 border-blue-200"
  },
};

export function CaseAIRecommendation({ aiRecommendation }: CaseAIRecommendationProps) {
  if (!aiRecommendation) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-foreground mb-2">AI Analysis in Progress</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Our AI system is analyzing the dispute details and will provide a recommendation shortly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const verdictConfig = VERDICT_CONFIG[aiRecommendation.verdict] || VERDICT_CONFIG.NEED_REVIEW;
  const confidencePercent = Math.round(aiRecommendation.confidence * 100);
  const confidenceColor = 
    aiRecommendation.confidence >= 0.8 ? "text-emerald-600" : 
    aiRecommendation.confidence >= 0.5 ? "text-amber-600" : 
    "text-red-600";

  return (
    <Card className={`border-2 ${verdictConfig.bgColor}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[300px,1fr] gap-6">
          {/* Left Column: Verdict & Confidence */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">AI Verdict</p>
              <Badge className={`${verdictConfig.color} text-base px-4 py-2 font-bold`}>
                {verdictConfig.label}
              </Badge>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-muted-foreground">Confidence Score</p>
                <span className={`text-2xl font-bold ${confidenceColor}`}>
                  {confidencePercent}%
                </span>
              </div>
              <Progress 
                value={confidencePercent} 
                className="h-3"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {aiRecommendation.confidence >= 0.8 && "High confidence - Strong evidence"}
                {aiRecommendation.confidence >= 0.5 && aiRecommendation.confidence < 0.8 && "Moderate confidence - Review recommended"}
                {aiRecommendation.confidence < 0.5 && "Low confidence - Human review required"}
              </p>
            </div>

            {aiRecommendation.similarCases.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Database className="h-4 w-4" />
                <span>Based on {aiRecommendation.similarCases.length} similar case{aiRecommendation.similarCases.length !== 1 ? 's' : ''}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Analyzed {new Date(aiRecommendation.analyzedAt).toLocaleString()}
              </span>
            </div>

            {aiRecommendation.tokensUsed && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{aiRecommendation.tokensUsed.toLocaleString()} tokens used</span>
              </div>
            )}
          </div>

          {/* Right Column: Reasoning */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-3">Analysis & Reasoning</p>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {aiRecommendation.reasoning}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

