"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PartyInfo {
  identifier: string;
  email?: string;
  name?: string;
  customerId?: string;
  merchantId?: string;
  walletAddress?: string;
}

interface PartiesCardProps {
  consumer: PartyInfo;
  merchant: PartyInfo;
}

export function PartiesCard({ consumer, merchant }: PartiesCardProps) {
  const truncateAddress = (address: string, chars: number = 8) => {
    if (address.length <= chars * 2) return address;
    return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
  };

  const PartySection = ({
    title,
    party,
    badge,
  }: {
    title: string;
    party: PartyInfo;
    badge: React.ReactNode;
  }) => (
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {badge}
      </div>
      <div className="space-y-2">
        {party.identifier && (
          <div>
            <p className="text-xs text-slate-500">Identifier</p>
            <p className="text-sm text-slate-900 font-mono">{party.identifier}</p>
          </div>
        )}

        {party.email && (
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-sm text-slate-900">{party.email}</p>
          </div>
        )}

        {party.name && (
          <div>
            <p className="text-xs text-slate-500">Name</p>
            <p className="text-sm text-slate-900">{party.name}</p>
          </div>
        )}

        {party.customerId && (
          <div>
            <p className="text-xs text-slate-500">Customer ID</p>
            <p className="text-sm text-slate-900 font-mono">{party.customerId}</p>
          </div>
        )}

        {party.merchantId && (
          <div>
            <p className="text-xs text-slate-500">Merchant ID</p>
            <p className="text-sm text-slate-900 font-mono">{party.merchantId}</p>
          </div>
        )}

        {party.walletAddress && (
          <div>
            <p className="text-xs text-slate-500">Wallet Address</p>
            <p
              className="text-sm text-slate-900 font-mono"
              title={party.walletAddress}
            >
              {truncateAddress(party.walletAddress, 6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <CardTitle>Parties</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <PartySection
            title="Consumer (Plaintiff)"
            party={consumer}
            badge={
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                Plaintiff
              </Badge>
            }
          />

          <div className="hidden md:block w-px bg-slate-200" />

          <PartySection
            title="Merchant (Defendant)"
            party={merchant}
            badge={
              <Badge className="bg-amber-50 text-amber-700 border-amber-200">
                Defendant
              </Badge>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
























