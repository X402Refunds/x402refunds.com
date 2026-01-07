"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Info, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ChainVerificationBadge({ caseId }: { caseId: Id<"cases"> }) {
  const verification = useQuery(api.custody.verifyCustodyChain, { caseId });
  
  if (!verification || verification.totalEvents === 0) {
    return null; // Hidden if no events
  }
  
  const isValid = verification.valid;
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <Info className="h-3 w-3 mr-1" />
          Audit Trail
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isValid ? (
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            )}
            Chain of Custody
          </DialogTitle>
          <DialogDescription>
            Cryptographic verification of case events
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className={isValid ? "text-blue-600 font-medium" : "text-destructive font-medium"}>
                {isValid ? "Verified" : "Broken"}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Events:</span>
              <span className="font-medium">{verification.totalEvents}</span>
            </div>
            
            {!isValid && verification.brokenAt !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Break at Event:</span>
                <span className="font-medium text-destructive">#{verification.brokenAt}</span>
              </div>
            )}
          </div>
          
          {isValid && verification.firstEventHash && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">Chain Root Hash:</p>
              <code className="block text-[10px] bg-muted p-2 rounded break-all font-mono">
                {verification.firstEventHash}
              </code>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground pt-2">
            All case events are cryptographically linked to ensure tamper-proof audit trail.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

