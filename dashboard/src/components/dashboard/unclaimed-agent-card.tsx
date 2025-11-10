"use client";

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { truncateAddress } from '@/lib/ethereum';
import { Wallet, AlertTriangle } from 'lucide-react';

interface UnclaimedAgentCardProps {
  agent: {
    _id: string;
    walletAddress: string;
    name?: string;
    endpoint?: string;
    disputeCount?: number;
    createdAt: number;
  };
  onClaim: () => void;
}

export function UnclaimedAgentCard({ agent, onClaim }: UnclaimedAgentCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <code className="text-sm font-mono">{truncateAddress(agent.walletAddress)}</code>
            <CopyButton value={agent.walletAddress} />
          </div>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Unclaimed
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Endpoint:</span>
            <span className="font-mono text-xs">{agent.endpoint || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active Disputes:</span>
            <Badge variant="destructive">{agent.disputeCount || 0}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span className="text-xs">{new Date(agent.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onClaim} className="w-full">
          Claim This Agent
        </Button>
      </CardFooter>
    </Card>
  );
}

