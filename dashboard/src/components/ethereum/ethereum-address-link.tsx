"use client";

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { truncateAddress, getExplorerUrl } from '@/lib/ethereum';

interface EthereumAddressLinkProps {
  address: string;
  chain?: string;
  truncate?: boolean;
}

export function EthereumAddressLink({ address, chain = 'base', truncate = true }: EthereumAddressLinkProps) {
  if (!address) return null;

  const explorerUrl = getExplorerUrl(chain, address);
  const displayAddress = truncate ? truncateAddress(address) : address;

  return (
    <div className="flex items-center gap-2">
      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
        {displayAddress}
      </code>
      <CopyButton value={address} />
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

