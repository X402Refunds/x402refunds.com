"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ChainVerificationBadge({ caseId }: { caseId: Id<"cases"> }) {
  const verification = useQuery(api.custody.verifyCustodyChain, { caseId });
  
  if (!verification) {
    return (
      <Badge variant="outline" className="gap-1">
        <Shield className="h-3 w-3" />
        Verifying...
      </Badge>
    );
  }
  
  if (verification.totalEvents === 0) {
    return (
      <Badge variant="outline" className="gap-1">
        <Shield className="h-3 w-3" />
        No events
      </Badge>
    );
  }
  
  if (verification.valid) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
              <ShieldCheck className="h-3 w-3" />
              Chain Verified
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p className="font-semibold">Custody chain verified</p>
              <p>{verification.totalEvents} events cryptographically linked</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                Root: {verification.firstEventHash?.substring(0, 16)}...
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="h-3 w-3" />
            Chain Broken
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <p className="font-semibold">Custody chain integrity compromised</p>
            <p>Break detected at event #{verification.brokenAt}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

