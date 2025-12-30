"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DisputeHeaderProps {
  disputeReason: string;
  amount: number;
  currency: string;
  filedAt: number;
  isResolved: boolean;
}

export function DisputeHeader({
  disputeReason,
  amount,
  currency,
  filedAt,
  isResolved,
}: DisputeHeaderProps) {
  const router = useRouter();
  const [now] = useState(() => Date.now());

  const formatReason = (reason: string) => {
    return reason.split("_").map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(" ");
  };

  const getRelativeTime = (timestamp: number, currentTime: number) => {
    const diffMs = currentTime - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900 mb-1">
            Dispute: {formatReason(disputeReason)}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
            <span className="font-medium text-slate-900">
              ${amount.toFixed(2)} {currency}
            </span>
            <span>•</span>
            <span>Filed {getRelativeTime(filedAt, now)}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          {isResolved ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 h-8 px-4">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolved
            </Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 h-8 px-4">
              <Clock className="h-4 w-4 mr-2" />
              Pending Review
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

