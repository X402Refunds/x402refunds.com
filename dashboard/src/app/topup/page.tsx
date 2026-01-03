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
const MAX_TOPUP_MICROUSDC = BigInt(10_000_000); // $10.00
const MIN_TOPUP_MICROUSDC = BigInt(10_000); // $0.01

function parseUsdcToMicros(amount: string): string | null {
  const s = amount.trim();
  // Accept "5", "5.", "5.0" ... up to 6 decimals.
  if (!/^\d+(\.\d{0,6})?$/.test(s)) return null;
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
  const amountMicrosBig = useMemo(() => {
    try {
      return amountMicros ? BigInt(amountMicros) : null;
    } catch {
      return null;
    }
  }, [amountMicros]);
  const overMax = !!amountMicrosBig && amountMicrosBig > MAX_TOPUP_MICROUSDC;
  const underMin = !!amountMicrosBig && amountMicrosBig > BigInt(0) && amountMicrosBig < MIN_TOPUP_MICROUSDC;

  const merchantNormalized = useMemo(() => normalizeMerchantToCaip10Base(merchantAddress), [merchantAddress]);
  const merchantCaip10 = merchantNormalized.caip10;

  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [newBalanceMicros, setNewBalanceMicros] = useState<string | null>(null);

  const aiPrompt = useMemo(() => {
    const m = merchantCaip10 || "eip155:8453:0xYOUR_MERCHANT_WALLET";
    return [
      "You are helping me add dispute + refund support for my x402-monetized API resource.",
      "",
      "Context:",
      "- x402 is an HTTP payment flow: an API can return 402 Payment Required with payment requirements,",
      "  and the client retries with a payment proof header (e.g. PAYMENT-SIGNATURE / X-PAYMENT).",
      "- After a successful paid response, I want buyers to discover a dispute URL and file disputes.",
      "",
      `My merchant wallet identity (CAIP-10) is: ${m}`,
      "",
      "Goal:",
      "1) For every successful paid response (i.e. after x402 payment is accepted), include this HTTP header:",
      `Link: <https://api.x402disputes.com/v1/disputes?merchant=${m}>; rel=\"payment-dispute https://x402disputes.com/rel/payment-dispute\"; type=\"application/json\"`,
      "",
      "2) Do NOT change my payloads. Just add the header.",
      "3) Show me exactly where to add it in my code for the framework I use (Express/Fastify/Next/etc).",
      "",
      "Bonus (optional): show how to publish /.well-known/x402.json with my dispute terms and the dispute URL.",
    ].join("\n");
  }, [merchantCaip10]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Top up refund credits</h1>
        <p className="text-sm text-muted-foreground">
          Add USDC so approved disputes can be refunded automatically. No account required.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top up balance</CardTitle>
          <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status === "idle" ? "Ready" : status === "processing" ? "Processing" : status === "success" ? "Credited" : "Error"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant wallet</Label>
            <Input
              id="merchant"
              placeholder="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
              value={merchantAddress}
              onChange={(e) => setMerchantAddress(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Example: <code className="font-mono">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</code>
            </div>
            {merchantAddress.trim() && merchantNormalized.error && (
              <div className="text-xs text-destructive">{merchantNormalized.error}</div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Blockchain</Label>
            <div className="text-sm text-muted-foreground">Base (USDC)</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <span className="text-xs text-muted-foreground">Max $10</span>
            </div>
            <Input
              id="amount"
              placeholder="e.g. 5.00"
              value={amountUsdc}
              onChange={(e) => setAmountUsdc(e.target.value)}
            />
            {amountUsdc && !amountMicros && (
              <div className="text-xs text-destructive">Invalid amount (max 6 decimals)</div>
            )}
            {overMax && (
              <div className="text-xs text-destructive">Max top up is $10 USDC</div>
            )}
            {underMin && (
              <div className="text-xs text-destructive">Minimum top up is $0.01 USDC</div>
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
            disabled={status === "processing"}
            onClick={async () => {
              setError(null);
              setTxHash(null);
              setNewBalanceMicros(null);
              setStatus("processing");
              try {
                if (!merchantCaip10) throw new Error(merchantNormalized.error || "Merchant wallet is required");
                if (!amountMicros) throw new Error("Enter an amount");
                if (!amountMicrosBig) throw new Error("Enter an amount");
                if (overMax) throw new Error("Max top up is $10 USDC");
                if (underMin) throw new Error("Minimum top up is $0.01 USDC");
                if (!isConnected || !walletClient || !address) throw new Error("Connect a wallet to pay");

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
          <CardTitle>Step 2 — Copy/paste into an AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Copy/paste this prompt into ChatGPT/Claude and follow the instructions.
          </div>
          <CopyableField value={aiPrompt} label="AI prompt" truncate={false} />
        </CardContent>
      </Card>
    </div>
  );
}

