"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyableField } from "./CopyableField";
import { EthereumAddressLink } from "@/components/ethereum/ethereum-address-link";
import { Users, ArrowRightLeft } from "lucide-react";

interface PartyMetadata {
  email?: string;
  name?: string;
  customerId?: string;
  merchantId?: string;
  walletAddress?: string;
}

interface CasePartiesProps {
  plaintiff: string;
  defendant: string;
  plaintiffMetadata?: PartyMetadata;
  defendantMetadata?: PartyMetadata;
  crypto?: {
    fromAddress?: string;
    toAddress?: string;
    blockchain?: string;
  };
}

export function CaseParties({ 
  plaintiff, 
  defendant, 
  plaintiffMetadata,
  defendantMetadata,
  crypto
}: CasePartiesProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Parties Involved
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-start">
          {/* Plaintiff */}
          <div className="space-y-4">
            <div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 mb-3">
                Plaintiff (Consumer)
              </Badge>
              <h3 className="text-lg font-bold text-foreground">
                {plaintiffMetadata?.name || plaintiff}
              </h3>
            </div>

            <div className="space-y-3">
              {plaintiffMetadata?.email && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Email</p>
                  <CopyableField 
                    value={plaintiffMetadata.email} 
                    label="Email copied"
                  />
                </div>
              )}

              {plaintiffMetadata?.customerId && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Customer ID</p>
                  <CopyableField 
                    value={plaintiffMetadata.customerId} 
                    label="Customer ID copied"
                  />
                </div>
              )}

              {(plaintiffMetadata?.walletAddress || crypto?.fromAddress) && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Wallet Address</p>
                  <EthereumAddressLink 
                    address={plaintiffMetadata?.walletAddress || crypto?.fromAddress || ""} 
                    chain={crypto?.blockchain || "base"}
                  />
                </div>
              )}

              {!plaintiffMetadata?.email && !plaintiffMetadata?.customerId && !(plaintiffMetadata?.walletAddress || crypto?.fromAddress) && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Identifier</p>
                  <CopyableField 
                    value={plaintiff} 
                    label="Identifier copied"
                    truncate
                    truncateLength={30}
                  />
                </div>
              )}
            </div>
          </div>

          {/* VS Separator */}
          <div className="hidden md:flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <ArrowRightLeft className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
              <span className="text-xs font-semibold text-muted-foreground">VS</span>
            </div>
          </div>

          {/* Defendant */}
          <div className="space-y-4">
            <div>
              <Badge className="bg-red-50 text-red-700 border-red-200 mb-3">
                Defendant (Merchant)
              </Badge>
              <h3 className="text-lg font-bold text-foreground">
                {defendantMetadata?.name || defendant}
              </h3>
            </div>

            <div className="space-y-3">
              {defendantMetadata?.email && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Email</p>
                  <CopyableField 
                    value={defendantMetadata.email} 
                    label="Email copied"
                  />
                </div>
              )}

              {defendantMetadata?.merchantId && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Merchant ID</p>
                  <CopyableField 
                    value={defendantMetadata.merchantId} 
                    label="Merchant ID copied"
                  />
                </div>
              )}

              {(defendantMetadata?.walletAddress || crypto?.toAddress) && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Wallet Address</p>
                  <EthereumAddressLink 
                    address={defendantMetadata?.walletAddress || crypto?.toAddress || ""} 
                    chain={crypto?.blockchain || "base"}
                  />
                </div>
              )}

              {!defendantMetadata?.email && !defendantMetadata?.merchantId && !(defendantMetadata?.walletAddress || crypto?.toAddress) && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Identifier</p>
                  <CopyableField 
                    value={defendant} 
                    label="Identifier copied"
                    truncate
                    truncateLength={30}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

