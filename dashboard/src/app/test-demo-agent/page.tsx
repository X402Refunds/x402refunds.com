'use client';

/**
 * X-402 Demo Agent Test Page
 * 
 * Test the signature-based payment flow with Brave Wallet.
 * User signs a message (no gas!) and facilitator executes the payment.
 */

import { useState } from 'react';
import { PaywallApp } from '@/components/PaywallApp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function TestDemoAgentPage() {
  const [prompt, setPrompt] = useState('a cat playing with a ball of yarn');
  const [size, setSize] = useState('1024x1024');
  const [model, setModel] = useState('stable-diffusion-xl');
  const [showPaywall, setShowPaywall] = useState(false);

  const API_URL = 'https://api.x402disputes.com/demo-agents/image-generator';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">X-402 Demo Agent Test</h1>
          <p className="text-muted-foreground">
            Test signature-based payments with Brave Wallet - no gas fees required!
          </p>
        </div>

        {/* Configuration Card */}
        {!showPaywall && (
          <Card>
            <CardHeader>
              <CardTitle>Configure Image Generation</CardTitle>
              <CardDescription>
                Set your parameters, then proceed to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Image Prompt</Label>
                <Input
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="1024x1024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="stable-diffusion-xl"
                  />
                </div>
              </div>

              <Button
                onClick={() => setShowPaywall(true)}
                className="w-full"
                size="lg"
                disabled={!prompt || prompt.length < 3}
              >
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Card */}
        {showPaywall && (
          <>
            <PaywallApp
              apiUrl={API_URL}
              prompt={prompt}
              size={size}
              model={model}
            />

            <Button
              variant="outline"
              onClick={() => setShowPaywall(false)}
              className="w-full"
            >
              ← Back to Configuration
            </Button>
          </>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Signature-Based Payment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>✅ Sign message (no gas fee!)</p>
              <p>✅ Facilitator pays gas</p>
              <p>✅ Only need USDC</p>
              <p>✅ Instant approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>Protocol:</strong> X-402 v1</p>
              <p><strong>Network:</strong> Base mainnet</p>
              <p><strong>Price:</strong> 0.01 USDC</p>
              <p><strong>Facilitator:</strong> mcpay.tech</p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">First Time Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2">1. Install Brave Wallet:</p>
              <p className="text-muted-foreground">
                Built into Brave browser - just enable it in settings
              </p>
            </div>

            <div>
              <p className="font-medium mb-2">2. Get USDC on Base:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Buy on Coinbase, send to your Brave Wallet address</li>
                <li>Select &quot;Base&quot; network when withdrawing</li>
                <li>Need at least 0.01 USDC</li>
              </ul>
            </div>

            <div>
              <p className="font-medium mb-2">3. No ETH Needed:</p>
              <p className="text-muted-foreground">
                Unlike traditional transactions, you don&apos;t need ETH for gas!
                The facilitator handles the on-chain transaction for you.
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                💡 Why This is Better:
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                Traditional crypto transactions require two tokens (USDC + ETH for gas).
                With X-402 signatures, you only need USDC. The facilitator pays gas fees
                and handles the blockchain complexity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

