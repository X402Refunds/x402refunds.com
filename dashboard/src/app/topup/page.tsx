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
import { normalizeMerchantToCaip10Base } from "@/lib/caip10";

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

  const [merchantAddress, setMerchantAddress] = useState("");
  const [amountUsdc, setAmountUsdc] = useState("");
  const amountMicros = useMemo(() => parseUsdcToMicros(amountUsdc), [amountUsdc]);
  const merchantNormalized = useMemo(() => normalizeMerchantToCaip10Base(merchantAddress), [merchantAddress]);
  const merchantCaip10 = merchantNormalized.caip10;

  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [newBalanceMicros, setNewBalanceMicros] = useState<string | null>(null);

  const linkHeaderExample = useMemo(() => {
    const m = merchantCaip10?.trim() ?? "";
    if (!m) return "";
    return `Link: <${API_BASE}/v1/disputes?merchant=${encodeURIComponent(m)}>; rel="payment-dispute https://x402disputes.com/rel/payment-dispute"; type="application/json"`;
  }, [merchantCaip10]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Top up refund balance</h1>
        <p className="text-sm text-muted-foreground">
          No signup required. Fund a merchant wallet. Credits are tracked per merchant, custody is pooled.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top up (Base USDC)</CardTitle>
          <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status === "idle" ? "Ready" : status === "processing" ? "Processing" : status === "success" ? "Credited" : "Error"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant wallet address</Label>
            <Input
              id="merchant"
              placeholder="0x..."
              value={merchantAddress}
              onChange={(e) => setMerchantAddress(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Example: <code className="font-mono">0xabc...</code> (we’ll normalize it to CAIP-10 automatically)
            </div>
            {merchantAddress.trim() && merchantNormalized.error && (
              <div className="text-xs text-destructive">{merchantNormalized.error}</div>
            )}
            {merchantCaip10 && (
              <div className="text-xs text-muted-foreground">
                Normalized identity: <code className="font-mono">{merchantCaip10}</code>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Blockchain</Label>
            <div className="text-sm text-muted-foreground">Base (USDC)</div>
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
              <div className="text-sm text-muted-foreground">Connect payer wallet</div>
              <ConnectWalletButton />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Payer wallet (connected): <code className="font-mono">{address}</code>
            </div>
          )}

          <Button
            disabled={!merchantCaip10 || !amountMicros || !isConnected || !walletClient || !address}
            onClick={async () => {
              setError(null);
              setTxHash(null);
              setNewBalanceMicros(null);
              setStatus("processing");
              try {
                if (!walletClient || !address) throw new Error("Wallet not ready");
                if (!merchantCaip10) throw new Error(merchantNormalized.error || "Merchant wallet is required");
                if (!amountMicros) throw new Error("Amount is required");

                // 1) request payment requirements (402)
                const res = await fetch(`${API_BASE}/v1/topup`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ merchant: merchantCaip10, amountMicrousdc: amountMicros, currency: "USDC" }),
                });
                if (res.status !== 402) {
                  const text = await res.text();
                  throw new Error(`Expected 402 from /v1/topup, got ${res.status}: ${text}`);
                }
                const pr = res.headers.get("PAYMENT-REQUIRED");
                if (!pr) throw new Error("Missing PAYMENT-REQUIRED header");

                // 2) sign
                const required = parsePaymentRequiredHeaderV2(pr);
                const requirement = required.accepts[0];
                if (address.toLowerCase() === requirement.payTo.toLowerCase()) {
                  throw new Error(`Connected wallet is the same as payTo (${requirement.payTo}). Switch to a payer wallet.`);
                }
                const paymentSignature = await createX402PaymentSignatureV2(walletClient, requirement, address);

                // 3) settle
                const res2 = await fetch(`${API_BASE}/v1/topup`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "PAYMENT-SIGNATURE": paymentSignature,
                  },
                  body: JSON.stringify({ merchant: merchantCaip10, amountMicrousdc: amountMicros, currency: "USDC" }),
                });

                const data = await res2.json().catch(() => ({}));
                if (!res2.ok || !data?.ok) {
                  throw new Error(data?.message || `Topup failed: ${res2.status}`);
                }

                setTxHash(data.txHash || null);
                setNewBalanceMicros(String(data.newBalanceMicrousdc ?? ""));
                setStatus("success");
              } catch (e: unknown) {
                setStatus("error");
                setError(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Top up (gasless)
          </Button>

          {txHash && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Transaction</div>
              <CopyableField value={txHash} truncate={false} />
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
            value={
              linkHeaderExample ||
              `Link: <${API_BASE}/v1/disputes?merchant=eip155:8453:0x...>; rel="payment-dispute https://x402disputes.com/rel/payment-dispute"; type="application/json"`
            }
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

