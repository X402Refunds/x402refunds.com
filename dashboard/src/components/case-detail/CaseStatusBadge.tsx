"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Clock, AlertCircle, Scale, XCircle } from "lucide-react";

interface CaseStatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
  showTooltip?: boolean;
}

const STATUS_CONFIG: Record<string, {
  color: string;
  label: string;
  description: string;
  icon: typeof Clock;
}> = {
  FILED: {
    color: "bg-blue-50 text-blue-700 border-blue-200",
    label: "Filed",
    description: "Dispute has been filed and is awaiting analysis",
    icon: Clock,
  },
  ANALYZED: {
    color: "bg-purple-50 text-purple-700 border-purple-200",
    label: "Analyzed",
    description: "AI analysis complete, awaiting human review",
    icon: AlertCircle,
  },
  AUTORULED: {
    color: "bg-purple-50 text-purple-700 border-purple-200",
    label: "Auto-Ruled",
    description: "Automatically resolved by AI with high confidence",
    icon: CheckCircle2,
  },
  IN_REVIEW: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    label: "In Review",
    description: "Under human review for final decision",
    icon: Scale,
  },
  PANELED: {
    color: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Paneled",
    description: "Assigned to review panel for deliberation",
    icon: Scale,
  },
  DECIDED: {
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Decided",
    description: "Final decision has been reached",
    icon: CheckCircle2,
  },
  CLOSED: {
    color: "bg-slate-50 text-slate-700 border-slate-200",
    label: "Closed",
    description: "Case is closed and resolution complete",
    icon: CheckCircle2,
  },
  DISMISSED: {
    color: "bg-slate-50 text-slate-700 border-slate-200",
    label: "Dismissed",
    description: "Case has been dismissed",
    icon: XCircle,
  },
};

export function CaseStatusBadge({ 
  status, 
  className = "", 
  showIcon = true,
  showTooltip = true 
}: CaseStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.FILED;
  const Icon = config.icon;

  const badge = (
    <Badge className={`${config.color} border-2 px-3 py-1 text-sm font-semibold ${className}`}>
      {showIcon && <Icon className="h-4 w-4 mr-1.5" />}
      {config.label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

