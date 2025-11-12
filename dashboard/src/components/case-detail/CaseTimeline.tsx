"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface CaseTimelineProps {
  status: string;
  filedAt: number;
  decidedAt?: number;
  aiRecommendation?: {
    analyzedAt: number;
    confidence: number;
  };
  humanReviewedAt?: number;
  regulationEDeadline?: number;
}

interface TimelineMilestone {
  label: string;
  timestamp?: number;
  status: "completed" | "current" | "pending";
  description: string;
  duration?: string;
}

export function CaseTimeline({ 
  status,
  filedAt,
  decidedAt,
  aiRecommendation,
  humanReviewedAt,
  regulationEDeadline
}: CaseTimelineProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateDuration = (start: number, end: number) => {
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  const milestones: TimelineMilestone[] = [];

  // 1. Dispute Filed
  milestones.push({
    label: "Dispute Filed",
    timestamp: filedAt,
    status: "completed",
    description: "Case submitted to dispute resolution system",
  });

  // 2. AI Analysis
  if (aiRecommendation?.analyzedAt || status !== "FILED") {
    milestones.push({
      label: "AI Analysis Complete",
      timestamp: aiRecommendation?.analyzedAt,
      status: aiRecommendation?.analyzedAt ? "completed" : "current",
      description: aiRecommendation?.analyzedAt 
        ? `AI analyzed with ${Math.round(aiRecommendation.confidence * 100)}% confidence`
        : "AI system analyzing dispute details",
      duration: aiRecommendation?.analyzedAt 
        ? calculateDuration(filedAt, aiRecommendation.analyzedAt)
        : undefined,
    });
  }

  // 3. Human Review
  if (humanReviewedAt || ["IN_REVIEW", "PANELED", "DECIDED", "CLOSED"].includes(status)) {
    milestones.push({
      label: humanReviewedAt ? "Human Review Complete" : "Under Human Review",
      timestamp: humanReviewedAt,
      status: humanReviewedAt 
        ? "completed" 
        : ["DECIDED", "CLOSED"].includes(status) 
          ? "completed" 
          : "current",
      description: humanReviewedAt 
        ? "Human reviewer made final decision"
        : "Awaiting human reviewer decision",
      duration: humanReviewedAt && aiRecommendation?.analyzedAt
        ? calculateDuration(aiRecommendation.analyzedAt, humanReviewedAt)
        : undefined,
    });
  }

  // 4. Final Decision
  if (decidedAt || ["DECIDED", "CLOSED"].includes(status)) {
    milestones.push({
      label: "Final Decision",
      timestamp: decidedAt,
      status: decidedAt ? "completed" : "current",
      description: decidedAt ? "Case resolved" : "Decision pending",
      duration: decidedAt && (humanReviewedAt || aiRecommendation?.analyzedAt)
        ? calculateDuration(humanReviewedAt || aiRecommendation?.analyzedAt || filedAt, decidedAt)
        : undefined,
    });
  } else if (!["FILED", "ANALYZED", "IN_REVIEW", "PANELED"].includes(status)) {
    // Add pending final decision if not yet decided
    milestones.push({
      label: "Final Decision",
      status: "pending",
      description: "Awaiting final resolution",
    });
  }

  // Calculate time until deadline
  const daysUntilDeadline = regulationEDeadline 
    ? Math.ceil((regulationEDeadline - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resolution Timeline
          </CardTitle>
          {regulationEDeadline && daysUntilDeadline !== null && daysUntilDeadline > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-muted-foreground">
                {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''} until deadline
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const isLast = index === milestones.length - 1;
            const Icon = 
              milestone.status === "completed" ? CheckCircle2 :
              milestone.status === "current" ? Clock :
              AlertCircle;

            const iconColor = 
              milestone.status === "completed" ? "bg-emerald-100 text-emerald-600" :
              milestone.status === "current" ? "bg-blue-100 text-blue-600 animate-pulse" :
              "bg-slate-100 text-slate-400";

            const textColor = 
              milestone.status === "completed" ? "text-foreground" :
              milestone.status === "current" ? "text-foreground" :
              "text-muted-foreground";

            return (
              <div key={index}>
                <motion.div 
                  className="flex items-start gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-semibold ${textColor}`}>
                        {milestone.label}
                      </p>
                      {milestone.duration && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {milestone.duration}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {milestone.description}
                    </p>
                    {milestone.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(milestone.timestamp)}
                      </p>
                    )}
                  </div>
                </motion.div>
                {!isLast && (
                  <div className="ml-5 my-2">
                    <div className={`h-8 w-0.5 ${
                      milestone.status === "completed" ? "bg-emerald-200" : "bg-slate-200"
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {regulationEDeadline && (
          <>
            <Separator className="my-6" />
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Regulation E Deadline</p>
                <p className="text-sm text-amber-700 mt-1">
                  Final resolution must be completed by {formatTimestamp(regulationEDeadline)}
                  {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                    <span className="font-semibold"> ({daysUntilDeadline} days remaining)</span>
                  )}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

