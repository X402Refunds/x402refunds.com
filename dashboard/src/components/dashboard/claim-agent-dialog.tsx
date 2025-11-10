"use client";

import { useState } from 'react';
import { useSignMessage, useAccount } from 'wagmi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConnectWalletButton } from '@/components/wallet/connect-wallet-button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ClaimAgentDialogProps {
  agent: {
    _id: string;
    walletAddress: string;
    name?: string;
    endpoint?: string;
    disputeCount?: number;
  };
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId?: string;
  userId?: string;
}

export function ClaimAgentDialog({ agent, open, onClose, onSuccess, organizationId, userId }: ClaimAgentDialogProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);

  const challengeMessage = `I claim agent ${agent.walletAddress.toLowerCase()} on x402disputes.com`;

  const handleClaim = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (address.toLowerCase() !== agent.walletAddress.toLowerCase()) {
      toast.error('Connected wallet does not match agent wallet address');
      return;
    }

    setIsLoading(true);

    try {
      // Sign the challenge message
      const signature = await signMessageAsync({ message: challengeMessage });

      // Submit claim to API
      const response = await fetch('/api/agents/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: agent.walletAddress,
          signature,
          message: challengeMessage,
          organizationId,
          userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Agent claimed successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to claim agent');
      }
    } catch (error) {
      if (error instanceof Error && error.message?.includes('User rejected')) {
        toast.error('Signature rejected');
      } else {
        toast.error('Failed to claim agent');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Agent</DialogTitle>
          <DialogDescription>
            Prove ownership of this agent by signing a message with the wallet address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Agent Wallet:</p>
            <code className="text-sm bg-muted px-3 py-2 rounded block">
              {agent.walletAddress}
            </code>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Challenge Message:</p>
            <code className="text-xs bg-muted px-3 py-2 rounded block whitespace-pre-wrap">
              {challengeMessage}
            </code>
          </div>

          {!isConnected && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Step 1: Connect Wallet</p>
              <ConnectWalletButton />
            </div>
          )}

          {isConnected && address && address.toLowerCase() !== agent.walletAddress.toLowerCase() && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded">
              <p className="text-sm font-medium">Wallet Mismatch</p>
              <p className="text-xs mt-1">
                Connected: {address}<br />
                Required: {agent.walletAddress}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleClaim}
            disabled={!isConnected || address?.toLowerCase() !== agent.walletAddress.toLowerCase() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Claiming...' : 'Sign & Claim Agent'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

