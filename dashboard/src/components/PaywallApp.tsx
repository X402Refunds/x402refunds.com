'use client';

/**
 * PaywallApp Component
 * 
 * Handles X-402 payment flow using signature-based payments.
 * User signs a message (no gas fees!) and facilitator executes the transaction.
 * 
 * Based on x402-echo-merchant PaywallApp pattern.
 */

import { useState } from 'react';
import { WagmiProvider, useWalletClient, useAccount, useConnect, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getWagmiConfig } from '@/lib/wagmi';
import { createX402PaymentSignature, parsePaymentRequirements } from '@/lib/x402-signature';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaywallAppProps {
  apiUrl: string;
  prompt: string;
  size?: string;
  model?: string;
}

type PaymentDetails = {
  transactionHash?: string;
  transaction?: string;
  amount?: string | number;
};

function PaywallAppInner({ apiUrl, prompt, size = '1024x1024', model = 'stable-diffusion-xl' }: PaywallAppProps) {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  async function handlePayment() {
    if (!isConnected || !walletClient || !address) {
      // Connect wallet first
      const injected = connectors.find(c => c.id === 'injected' || c.name === 'Injected');
      if (injected) {
        connect({ connector: injected });
      } else {
        setError('No wallet connector found. Please install Brave Wallet.');
      }
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Getting payment requirements...');

    try {
      // Step 1: Get payment requirements (402 response)
      const response1 = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, size, model }),
      });

      if (response1.status !== 402) {
        throw new Error(`Expected 402 Payment Required, got ${response1.status}`);
      }

      const paymentData = await response1.json();
      const requirements = parsePaymentRequirements(paymentData);

      // IMPORTANT: The demo agent uses a fixed receiving wallet (`payTo`).
      // If the user connects the SAME wallet as the payer, the facilitator will
      // attempt a no-op/self-transfer which can fail (and often surfaces as a 500
      // from the facilitator). Make this failure mode explicit.
      if (address.toLowerCase() === requirements.payTo.toLowerCase()) {
        throw new Error(
          `You are connected to the demo agent's receiving wallet (${requirements.payTo}). ` +
            `Please switch Brave Wallet to a different account/address (the payer) that holds USDC, ` +
            `then try again.`
        );
      }

      setStatus('Creating payment signature (no gas needed)...');

      // Step 2: Create X-PAYMENT signature (USER SIGNS MESSAGE - NO GAS!)
      const xPaymentHeader = await createX402PaymentSignature(
        walletClient,
        requirements,
        address
      );

      setStatus('Sending signed payment to server...');

      // Step 3: Retry with X-PAYMENT header
      const response2 = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PAYMENT': xPaymentHeader,
        },
        body: JSON.stringify({ prompt, size, model }),
      });

      const result = await response2.json();

      if (response2.status === 200 && result.success) {
        setStatus('✅ Payment successful! Image generated.');
        setImageUrl(result.data.image_url);
        const rawPayment = result.metadata?.payment ?? result.metadata?.settlement;
        if (rawPayment && typeof rawPayment === 'object') {
          const p = rawPayment as Record<string, unknown>;
          setPaymentDetails({
            transactionHash: typeof p.transactionHash === 'string' ? p.transactionHash : undefined,
            transaction: typeof p.transaction === 'string' ? p.transaction : undefined,
            amount:
              typeof p.amount === 'string' || typeof p.amount === 'number'
                ? (p.amount as string | number)
                : undefined,
          });
        } else {
          setPaymentDetails(null);
        }
      } else {
        throw new Error(result.error?.message || `Payment failed: ${response2.status}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🖼️ X-402 Image Generator (Gas-Free!)</CardTitle>
        <CardDescription>
          Pay 0.01 USDC by signing a message - no gas fees required!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Connection */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          {isConnected ? (
            <>
              <div>
                <p className="text-sm font-medium">Connected</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {address?.substring(0, 10)}...{address?.substring(address.length - 8)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Connect Brave Wallet to continue</p>
              <Button onClick={handlePayment}>Connect Wallet</Button>
            </>
          )}
        </div>

        {/* Prompt Display */}
        <div className="p-4 bg-accent rounded-lg">
          <p className="text-sm font-medium mb-1">Prompt:</p>
          <p className="text-sm text-muted-foreground">{prompt}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Size: {size} | Model: {model}
          </p>
        </div>

        {/* Payment Button */}
        {isConnected && !imageUrl && (
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? status : 'Generate Image (0.01 USDC - No Gas!)'}
          </Button>
        )}

        {/* Status */}
        {status && !error && (
          <Alert>
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success - Display Image */}
        {imageUrl && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={prompt} className="w-full" />
            </div>

            {paymentDetails && (
              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <p className="font-medium">Payment Details:</p>
                <div className="space-y-1 text-xs font-mono">
                  {paymentDetails.transactionHash ? (
                    <p>TX: {paymentDetails.transactionHash.substring(0, 20)}...</p>
                  ) : null}
                  {paymentDetails.transaction ? (
                    <p>TX: {paymentDetails.transaction.substring(0, 20)}...</p>
                  ) : null}
                  <p>Amount: {paymentDetails.amount ?? '0.01 USDC'}</p>
                  <p>Network: Base (facilitator paid gas)</p>
                </div>
                {(paymentDetails.transactionHash || paymentDetails.transaction) && (
                  <a
                    href={`https://basescan.org/tx/${paymentDetails.transactionHash || paymentDetails.transaction}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs"
                  >
                    View on BaseScan →
                  </a>
                )}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setImageUrl('');
                setPaymentDetails(null);
                setStatus('');
              }}
              className="w-full"
            >
              Generate Another Image
            </Button>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How This Works:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200 text-xs">
            <li>Connect your Brave Wallet (just permission, no transaction)</li>
            <li>Click to generate image</li>
            <li>Brave Wallet prompts you to <strong>sign a message</strong> (NO GAS!)</li>
            <li>Your signature authorizes payment</li>
            <li>Facilitator executes the payment on-chain (facilitator pays gas)</li>
            <li>You receive your image instantly!</li>
          </ol>
          <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
            💡 You only need USDC - no ETH for gas required!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PaywallApp(props: PaywallAppProps) {
  // Defensive: ensure wagmi hooks are ALWAYS rendered under a WagmiProvider.
  // We still keep providers in layouts, but this eliminates “WagmiProviderNotFoundError”
  // even if the page renders in a different provider boundary.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000 },
        },
      })
  );
  const config = getWagmiConfig();

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <PaywallAppInner {...props} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

