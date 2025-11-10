"use client";

import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { truncateAddress } from '@/lib/ethereum';
import { Wallet } from 'lucide-react';

export function ConnectWalletButton() {
  const { connect, connectors } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <code className="text-sm text-foreground bg-muted px-2 py-1 rounded">
          {truncateAddress(address)}
        </code>
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          onClick={() => connect({ connector })}
          variant="default"
          className="w-full"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect {connector.name}
        </Button>
      ))}
    </div>
  );
}

