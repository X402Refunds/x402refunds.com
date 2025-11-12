"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { Clock, FileText, TrendingUp } from "lucide-react";

interface CaseHeroStatusProps {
  status: string;
  filedAt: number;
  decidedAt?: number;
  caseId: string;
  estimatedResolution?: string;
}

export function CaseHeroStatus({ 
  status,
  filedAt,
  decidedAt,
  caseId,
  estimatedResolution = "24-48 hours"
}: CaseHeroStatusProps) {
  // Calculate progress through lifecycle
  const getProgress = (status: string): number => {
    const progressMap: Record<string, number> = {
      "FILED": 20,
      "ANALYZED": 40,
      "AUTORULED": 90,
      "IN_REVIEW": 60,
      "PANELED": 70,
      "DECIDED": 90,
      "CLOSED": 100,
    };
    return progressMap[status] || 20;
  };

  // Calculate time elapsed
  const getTimeElapsed = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ago`;
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  const progress = getProgress(status);
  const timeElapsed = getTimeElapsed(filedAt);
  const isResolved = ["DECIDED", "CLOSED"].includes(status);

  return (
    <Card className="border-2 bg-gradient-to-br from-slate-50 to-blue-50">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Case Status Overview
            </h2>
            <p className="text-sm text-muted-foreground">
              Case ID: <code className="bg-muted px-2 py-1 rounded text-xs font-mono">{caseId}</code>
            </p>
          </div>
          <CaseStatusBadge status={status} className="text-lg px-5 py-2.5" />
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">
              Resolution Progress
            </span>
            <span className="text-sm font-bold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Time Elapsed */}
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Time Elapsed</p>
              <p className="text-sm font-bold text-foreground">{timeElapsed}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Current Stage</p>
              <p className="text-sm font-bold text-foreground">
                {status === "FILED" && "Initial Review"}
                {status === "ANALYZED" && "AI Analysis"}
                {status === "IN_REVIEW" && "Human Review"}
                {status === "PANELED" && "Panel Review"}
                {status === "DECIDED" && "Resolved"}
                {status === "CLOSED" && "Closed"}
                {status === "AUTORULED" && "Auto-Resolved"}
              </p>
            </div>
          </div>

          {/* Estimated Resolution */}
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                {isResolved ? "Resolved In" : "Est. Resolution"}
              </p>
              <p className="text-sm font-bold text-foreground">
                {isResolved && decidedAt 
                  ? getTimeElapsed(decidedAt)
                  : estimatedResolution
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions (optional) */}
        {!isResolved && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              View Evidence
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

