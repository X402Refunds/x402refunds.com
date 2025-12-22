"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

/**
 * x402r Escrow Badge Component
 * 
 * Displays escrow status for x402r disputes
 * Shows:
 * - Escrow state (HELD, DISPUTED, RELEASED)
 * - Escrow contract address
 * - Link to BaseScan for verification
 * - Explanation of x402r escrow process
 */

interface X402rEscrowBadgeProps {
  escrowAddress: string;
  escrowState: "PENDING" | "HELD" | "DISPUTED" | "RELEASED_TO_BUYER" | "RELEASED_TO_MERCHANT";
  blockchain: string;
  depositTxHash?: string;
  releaseTxHash?: string;
  amount?: number;
  currency?: string;
}

export function X402rEscrowBadge({
  escrowAddress,
  escrowState,
  blockchain,
  depositTxHash,
  releaseTxHash,
  amount,
  currency = "USDC",
}: X402rEscrowBadgeProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // Get BaseScan URL based on network
  const getExplorerUrl = (hash: string, type: "address" | "tx") => {
    const baseUrl = blockchain === "base-mainnet" 
      ? "https://basescan.org"
      : "https://sepolia.basescan.org";
    return `${baseUrl}/${type}/${hash}`;
  };

  // Copy to clipboard handler
  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Get badge variant based on state
  const getBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (escrowState) {
      case "PENDING":
        return "secondary";
      case "HELD":
        return "default";
      case "DISPUTED":
        return "destructive";
      case "RELEASED_TO_BUYER":
      case "RELEASED_TO_MERCHANT":
        return "outline";
      default:
        return "default";
    }
  };

  // Get icon based on state
  const getIcon = () => {
    switch (escrowState) {
      case "PENDING":
      case "HELD":
        return <Lock className="h-4 w-4" />;
      case "DISPUTED":
        return <AlertCircle className="h-4 w-4" />;
      case "RELEASED_TO_BUYER":
      case "RELEASED_TO_MERCHANT":
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  // Get human-readable state label
  const getStateLabel = () => {
    switch (escrowState) {
      case "PENDING":
        return "Pending Deposit";
      case "HELD":
        return "Funds in Escrow";
      case "DISPUTED":
        return "Dispute Filed";
      case "RELEASED_TO_BUYER":
        return "Refunded to Buyer";
      case "RELEASED_TO_MERCHANT":
        return "Released to Merchant";
      default:
        return escrowState;
    }
  };

  // Get explanation text
  const getExplanation = () => {
    switch (escrowState) {
      case "PENDING":
        return "Waiting for funds to be deposited into escrow contract.";
      case "HELD":
        return "Funds are safely held in an x402r escrow smart contract until the service is completed.";
      case "DISPUTED":
        return "A dispute has been filed. Funds remain locked in escrow pending arbiter decision.";
      case "RELEASED_TO_BUYER":
        return "Funds have been released from escrow back to the buyer as a refund.";
      case "RELEASED_TO_MERCHANT":
        return "Funds have been released from escrow to the merchant.";
      default:
        return "Escrow status unknown.";
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {getIcon()}
            x402r Escrow
          </CardTitle>
          <Badge variant={getBadgeVariant()}>
            {getStateLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explanation */}
        <p className="text-sm text-muted-foreground">
          {getExplanation()}
        </p>

        {/* Amount (if available) */}
        {amount !== undefined && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium text-foreground">Escrow Amount</span>
            <span className="text-lg font-bold text-primary">
              ${amount.toFixed(2)} {currency}
            </span>
          </div>
        )}

        {/* Escrow Contract Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Escrow Contract</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono text-foreground break-all">
              {escrowAddress}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(escrowAddress, setCopiedAddress)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href={getExplorerUrl(escrowAddress, "address")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
          {copiedAddress && (
            <p className="text-xs text-primary">Address copied!</p>
          )}
        </div>

        {/* Deposit Transaction (if available) */}
        {depositTxHash && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Deposit Transaction</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono text-foreground break-all">
                {depositTxHash}
              </code>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={getExplorerUrl(depositTxHash, "tx")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Release Transaction (if available) */}
        {releaseTxHash && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Release Transaction</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded text-xs font-mono text-foreground break-all">
                {releaseTxHash}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(releaseTxHash, setCopiedTxHash)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={getExplorerUrl(releaseTxHash, "tx")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            {copiedTxHash && (
              <p className="text-xs text-primary">Transaction hash copied!</p>
            )}
          </div>
        )}

        {/* Network Info */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Network</span>
            <Badge variant="outline" className="text-xs">
              {blockchain === "base-mainnet" ? "Base Mainnet" : "Base Sepolia"}
            </Badge>
          </div>
        </div>

        {/* Learn More */}
        <div className="pt-2 border-t">
          <a
            href="https://www.x402r.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Learn about x402r escrow protocol
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

