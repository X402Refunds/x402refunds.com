"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyableField } from "@/components/case-detail/CopyableField";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useAccount, useWalletClient } from "wagmi";
import { createX402PaymentSignatureV2, parsePaymentRequiredHeaderV2 } from "@/lib/x402-signature";

const API_BASE = "https://api.x402disputes.com";

function parseUsdcToMicros(amount: string): string | null {
  const s = amount.trim();
  if (!/^\d+(\.\d{1,6})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const padded = (frac + "000000").slice(0, 6);
  const micros = BigInt(whole) * BigInt(1_000_000) + BigInt(padded);
  if (micros <= BigInt(0)) return null;
  return micros.toString(10);
}

export default function TopupPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [merchant, setMerchant] = useState("");
  const [amountUsdc, setAmountUsdc] = useState("");
  const amountMicros = useMemo(() => parseUsdcToMicros(amountUsdc), [amountUsdc]);

  const [status, setStatus] = useState<"idle" | "needs_payment" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [paymentRequiredB64, setPaymentRequiredB64] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [newBalanceMicros, setNewBalanceMicros] = useState<string | null>(null);

  const linkHeaderExample = useMemo(() => {
    const m = merchant.trim();
    if (!m) return "";
    return `Link: <${API_BASE}/v1/disputes?merchant=${encodeURIComponent(m)}>; rel="payment-dispute https://x402disputes.com/rel/payment-dispute"; type="application/json"`;
  }, [merchant]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Top up refund balance</h1>
        <p className="text-sm text-muted-foreground">
          No signup required. Fund a merchant wallet (CAIP-10). Credits are tracked per merchant, custody is pooled.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top up (Base USDC)</CardTitle>
          <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status === "idle" ? "Ready" : status === "needs_payment" ? "Payment required" : status === "processing" ? "Processing" : status === "success" ? "Credited" : "Error"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant (CAIP-10)</Label>
            <Input
              id="merchant"
              placeholder="eip155:8453:0x..."
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Example: <code className="font-mono">eip155:8453:0xabc...</code>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USDC)</Label>
            <Input
              id="amount"
              placeholder="e.g. 25.00"
              value={amountUsdc}
              onChange={(e) => setAmountUsdc(e.target.value)}
            />
            {amountUsdc && !amountMicros && (
              <div className="text-xs text-destructive">Invalid amount (max 6 decimals)</div>
            )}
          </div>

          {!isConnected ? (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Step 1: Connect wallet</div>
              <ConnectWalletButton />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Connected as <code className="font-mono">{address}</code>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              disabled={!merchant.trim() || !amountMicros}
              onClick={async () => {
                setError(null);
                setTxHash(null);
                setNewBalanceMicros(null);
                setPaymentRequiredB64(null);
                setStatus("processing");

                try {
                  const res = await fetch(`${API_BASE}/v1/topup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ merchant: merchant.trim(), amountMicrousdc: amountMicros, currency: "USDC" }),
                  });

                  if (res.status !== 402) {
                    const text = await res.text();
                    throw new Error(`Expected 402 from /v1/topup, got ${res.status}: ${text}`);
                  }

                  const pr = res.headers.get("PAYMENT-REQUIRED");
                  if (!pr) throw new Error("Missing PAYMENT-REQUIRED header");
                  setPaymentRequiredB64(pr);
                  setStatus("needs_payment");
                } catch (e: unknown) {
                  setStatus("error");
                  setError(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              Get payment requirements
            </Button>

            <Button
              disabled={!isConnected || !walletClient || !address || !paymentRequiredB64 || !amountMicros || !merchant.trim()}
              onClick={async () => {
                setError(null);
                setTxHash(null);
                setNewBalanceMicros(null);
                setStatus("processing");
                try {
                  if (!walletClient || !address) throw new Error("Wallet not ready");
                  if (!paymentRequiredB64) throw new Error("Missing payment requirements");

                  const required = parsePaymentRequiredHeaderV2(paymentRequiredB64);
                  const requirement = required.accepts[0];

                  // Prevent self-transfer
                  if (address.toLowerCase() === requirement.payTo.toLowerCase()) {
                    throw new Error(`Connected wallet is the same as payTo (${requirement.payTo}). Switch to a payer wallet.`);
                  }

                  const paymentSignature = await createX402PaymentSignatureV2(walletClient, requirement, address);

                  const res2 = await fetch(`${API_BASE}/v1/topup`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "PAYMENT-SIGNATURE": paymentSignature,
                    },
                    body: JSON.stringify({ merchant: merchant.trim(), amountMicrousdc: amountMicros, currency: "USDC" }),
                  });

                  const data = await res2.json().catch(() => ({}));
                  if (!res2.ok || !data?.ok) {
                    throw new Error(data?.message || `Topup failed: ${res2.status}`);
                  }

                  setTxHash(data.txHash || null);
                  setNewBalanceMicros(typeof data.newBalanceMicrousdc === "number" ? String(data.newBalanceMicrousdc) : String(data.newBalanceMicrousdc || ""));
                  setStatus("success");
                } catch (e: unknown) {
                  setStatus("error");
                  setError(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              Pay (gasless)
            </Button>
          </div>

          {paymentRequiredB64 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">PAYMENT-REQUIRED</div>
              <CopyableField value={paymentRequiredB64} label="Base64 payload" truncate={false} />
              <div className="text-xs text-muted-foreground">
                This is the x402 v2 payment requirement (base64 JSON). Buyers/SDKs can use it to create a PAYMENT-SIGNATURE.
              </div>
            </div>
          )}

          {txHash && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Transaction</div>
              <CopyableField value={txHash} truncate />
            </div>
          )}

          {newBalanceMicros && (
            <div className="text-xs text-muted-foreground">
              New balance (microusdc): <code className="font-mono">{newBalanceMicros}</code>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Merchant integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Publish your dispute capability in every paid response using a <code className="font-mono">Link</code> header.
          </div>
          <CopyableField
            value={linkHeaderExample || `Link: <${API_BASE}/v1/disputes?merchant=eip155:8453:0x...>; rel=\"payment-dispute https://x402disputes.com/rel/payment-dispute\"; type=\"application/json\"`}
            label="Link header"
            truncate={false}
          />
          <div className="text-xs text-muted-foreground">
            Optional: also publish <code className="font-mono">/.well-known/x402.json</code> on your domain with dispute terms.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

