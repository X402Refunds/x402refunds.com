"use client";

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { truncateTxHash, getTransactionExplorerUrl, getExplorerName } from '@/lib/ethereum';

interface TransactionHashLinkProps {
  hash: string;
  chain?: string;
}

export function TransactionHashLink({ hash, chain = 'base' }: TransactionHashLinkProps) {
  if (!hash) return null;

  const explorerUrl = getTransactionExplorerUrl(chain, hash);
  const explorerName = getExplorerName(chain);

  return (
    <div className="flex items-center gap-2">
      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
        {truncateTxHash(hash)}
      </code>
      <CopyButton value={hash} />
      <Button variant="outline" size="sm" asChild>
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="mr-2 h-4 w-4" />
          View on {explorerName}
        </a>
      </Button>
    </div>
  );
}

