"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyableField } from "./CopyableField";
import { ExternalLink, Receipt } from "lucide-react";
import { getTransactionExplorerUrl, getExplorerName } from "@/lib/ethereum";

interface CryptoDetails {
  currency: string;
  blockchain: string;
  layer?: string;
  fromAddress?: string;
  toAddress?: string;
  transactionHash?: string;
  blockNumber?: number;
  explorerUrl?: string;
}

interface CustodialDetails {
  platform: string;
  platformTransactionId?: string;
  isOnChain?: boolean;
}

interface TraditionalDetails {
  paymentMethod: string;
  processor?: string;
  processorTransactionId?: string;
  cardBrand?: string;
  lastFourDigits?: string;
}

interface CaseTransactionDetailsProps {
  transactionId?: string;
  crypto?: CryptoDetails;
  custodial?: CustodialDetails;
  traditional?: TraditionalDetails;
}

export function CaseTransactionDetails({ 
  transactionId,
  crypto,
  custodial,
  traditional 
}: CaseTransactionDetailsProps) {
  if (!transactionId && !crypto && !custodial && !traditional) {
    return null;
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Transaction Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction ID */}
        {transactionId && (
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Transaction ID</p>
            <CopyableField 
              value={transactionId} 
              label="Transaction ID copied"
              truncate
              truncateLength={40}
            />
          </div>
        )}

        {/* Crypto Payment */}
        {crypto && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                Crypto Payment
              </Badge>
              <span className="text-sm font-semibold text-foreground">
                {crypto.currency} • {crypto.blockchain}
                {crypto.layer && ` (${crypto.layer})`}
              </span>
            </div>

            {crypto.transactionHash && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Transaction Hash</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="flex-1 w-full">
                    <CopyableField 
                      value={crypto.transactionHash} 
                      label="Transaction hash copied"
                      truncate
                      truncateLength={20}
                    />
                  </div>
                  {(crypto.explorerUrl || crypto.blockchain) && (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap"
                      onClick={() => {
                        const url = crypto.explorerUrl || getTransactionExplorerUrl(crypto.blockchain, crypto.transactionHash!);
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      View on {getExplorerName(crypto.blockchain)}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {crypto.blockNumber && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">Block Number</p>
                <p className="text-sm font-mono text-foreground">
                  {crypto.blockNumber.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Custodial Platform */}
        {custodial && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                Custodial Platform
              </Badge>
              <span className="text-sm font-semibold text-foreground capitalize">
                {custodial.platform}
              </span>
            </div>

            {custodial.platformTransactionId && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Platform Transaction ID</p>
                <CopyableField 
                  value={custodial.platformTransactionId} 
                  label="Transaction ID copied"
                  truncate
                  truncateLength={40}
                />
              </div>
            )}

            {custodial.isOnChain !== undefined && (
              <div className="flex items-center gap-2">
                {custodial.isOnChain ? (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    ✓ On-chain transaction
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    ⊙ Off-chain (internal ledger)
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Traditional Payment */}
        {traditional && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                Traditional Payment
              </Badge>
              <span className="text-sm font-semibold text-foreground capitalize">
                {traditional.paymentMethod}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {traditional.processor && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Processor</p>
                  <p className="text-sm text-foreground capitalize">{traditional.processor}</p>
                </div>
              )}

              {traditional.cardBrand && traditional.lastFourDigits && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Card</p>
                  <p className="text-sm text-foreground">
                    {traditional.cardBrand} ••••{traditional.lastFourDigits}
                  </p>
                </div>
              )}
            </div>

            {traditional.processorTransactionId && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Processor Transaction ID</p>
                <CopyableField 
                  value={traditional.processorTransactionId} 
                  label="Transaction ID copied"
                  truncate
                  truncateLength={40}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

