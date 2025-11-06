"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface PaymentProofCardProps {
  amount: number;
  currency: string;
  crypto?: {
    currency: string;
    blockchain: string;
    transactionHash?: string;
    fromAddress?: string;
    toAddress?: string;
    explorerUrl?: string;
    blockNumber?: number;
    layer?: string;
  };
  custodial?: {
    platform: string;
    platformTransactionId?: string;
    isOnChain?: boolean;
  };
  traditional?: {
    paymentMethod: string;
    processor?: string;
    processorTransactionId?: string;
    lastFourDigits?: string;
    cardBrand?: string;
  };
}

export function PaymentProofCard({
  amount,
  currency,
  crypto,
  custodial,
  traditional,
}: PaymentProofCardProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncateAddress = (address: string, chars: number = 8) => {
    if (address.length <= chars * 2) return address;
    return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
  };

  const getExplorerName = (blockchain: string) => {
    const explorers: Record<string, string> = {
      'ethereum': 'Etherscan',
      'base': 'Basescan',
      'solana': 'Solscan',
      'bitcoin': 'Blockchain.com',
      'polygon': 'Polygonscan',
      'arbitrum': 'Arbiscan',
      'optimism': 'Optimistic Etherscan',
    };
    return explorers[blockchain.toLowerCase()] || 'Explorer';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <CardTitle>Payment Proof</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount */}
        <div>
          <p className="text-sm font-medium text-slate-600">Amount</p>
          <p className="text-2xl font-bold text-slate-900">
            ${amount.toFixed(2)} {currency}
          </p>
          {crypto && crypto.currency && (
            <p className="text-sm text-slate-600 mt-1">
              {amount} {crypto.currency} on {crypto.blockchain}
              {crypto.layer && ` (${crypto.layer})`}
            </p>
          )}
        </div>

        {/* Crypto Payment */}
        {crypto && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                Crypto Payment
              </Badge>
              <span className="text-sm text-slate-600">
                {crypto.currency} • {crypto.blockchain}
              </span>
            </div>

            {crypto.transactionHash && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-slate-50 px-3 py-2 rounded border border-slate-200 font-mono text-slate-700 truncate">
                    {crypto.transactionHash}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9"
                    onClick={() => copyToClipboard(crypto.transactionHash!)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copiedHash ? 'Copied!' : 'Copy'}
                  </Button>
                  {crypto.explorerUrl && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-9 bg-purple-600 hover:bg-purple-700"
                      onClick={() => window.open(crypto.explorerUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View on {getExplorerName(crypto.blockchain)}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {(crypto.fromAddress || crypto.toAddress) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crypto.fromAddress && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">From (Consumer)</p>
                    <code
                      className="block text-xs bg-slate-50 px-3 py-2 rounded border border-slate-200 font-mono text-slate-700 truncate"
                      title={crypto.fromAddress}
                    >
                      {truncateAddress(crypto.fromAddress, 6)}
                    </code>
                  </div>
                )}

                {crypto.toAddress && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">To (Merchant)</p>
                    <code
                      className="block text-xs bg-slate-50 px-3 py-2 rounded border border-slate-200 font-mono text-slate-700 truncate"
                      title={crypto.toAddress}
                    >
                      {truncateAddress(crypto.toAddress, 6)}
                    </code>
                  </div>
                )}
              </div>
            )}

            {crypto.blockNumber && (
              <div className="text-sm text-slate-600">
                Block: <span className="font-mono">{crypto.blockNumber.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Custodial Payment */}
        {custodial && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                Custodial Platform
              </Badge>
              <span className="text-sm text-slate-600 capitalize">
                {custodial.platform}
              </span>
            </div>

            {custodial.platformTransactionId && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Platform Transaction ID</p>
                <code className="block text-xs bg-slate-50 px-3 py-2 rounded border border-slate-200 font-mono text-slate-700">
                  {custodial.platformTransactionId}
                </code>
              </div>
            )}

            {custodial.isOnChain !== undefined && (
              <div className="text-sm text-slate-600">
                {custodial.isOnChain ? (
                  <span className="text-emerald-600">✓ On-chain transaction</span>
                ) : (
                  <span className="text-amber-600">⊙ Off-chain (internal transfer)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Traditional Payment */}
        {traditional && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                Traditional Payment
              </Badge>
              <span className="text-sm text-slate-600 capitalize">
                {traditional.paymentMethod}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {traditional.processor && (
                <div>
                  <p className="text-sm font-medium text-slate-600">Processor</p>
                  <p className="text-sm text-slate-900 capitalize">{traditional.processor}</p>
                </div>
              )}

              {traditional.cardBrand && traditional.lastFourDigits && (
                <div>
                  <p className="text-sm font-medium text-slate-600">Card</p>
                  <p className="text-sm text-slate-900">
                    {traditional.cardBrand} ••{traditional.lastFourDigits}
                  </p>
                </div>
              )}
            </div>

            {traditional.processorTransactionId && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Transaction ID</p>
                <code className="block text-xs bg-slate-50 px-3 py-2 rounded border border-slate-200 font-mono text-slate-700">
                  {traditional.processorTransactionId}
                </code>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

