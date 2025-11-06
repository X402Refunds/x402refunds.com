"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface DisputeHeaderProps {
  disputeReason: string;
  amount: number;
  currency: string;
  plaintiff: string;
  defendant: string;
  filedAt: number;
  deadline?: number;
  isResolved: boolean;
}

export function DisputeHeader({
  disputeReason,
  amount,
  currency,
  plaintiff,
  defendant,
  filedAt,
  deadline,
  isResolved,
}: DisputeHeaderProps) {
  const router = useRouter();

  const formatReason = (reason: string) => {
    return reason.split("_").map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(" ");
  };

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getDeadlineInfo = (deadline: number) => {
    const now = Date.now();
    const diffMs = deadline - now;
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor((diffMs % 86400000) / 3600000);

    if (diffMs < 0) {
      return { text: "Overdue", color: "text-red-600", icon: AlertCircle, urgent: true };
    }
    if (diffDays === 0) {
      return {
        text: `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`,
        color: "text-red-600",
        icon: AlertCircle,
        urgent: true
      };
    }
    if (diffDays === 1) {
      return { text: "1 day remaining", color: "text-amber-600", icon: Clock, urgent: true };
    }
    if (diffDays < 3) {
      return { text: `${diffDays} days remaining`, color: "text-amber-600", icon: Clock, urgent: true };
    }
    return { text: `${diffDays} days remaining`, color: "text-slate-600", icon: Clock, urgent: false };
  };

  const deadlineInfo = deadline ? getDeadlineInfo(deadline) : null;
  const DeadlineIcon = deadlineInfo?.icon;

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
            Dispute: {formatReason(disputeReason)} - ${amount.toFixed(2)} {currency}
          </h1>
          <p className="text-slate-600 text-lg">
            {plaintiff} vs {defendant}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
            <span>Filed {getRelativeTime(filedAt)}</span>
            {deadlineInfo && !isResolved && (
              <>
                <span>•</span>
                <span className={`flex items-center gap-1 ${deadlineInfo.color} ${deadlineInfo.urgent ? 'font-semibold' : ''}`}>
                  {DeadlineIcon && <DeadlineIcon className="h-4 w-4" />}
                  {deadlineInfo.text}
                </span>
              </>
            )}
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

