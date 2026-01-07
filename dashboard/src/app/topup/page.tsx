"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyableField } from "@/components/case-detail/CopyableField";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useAccount, useWalletClient } from "wagmi";
import { createX402PaymentSignature, parsePaymentRequirements } from "@/lib/x402-signature";
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

  const didPrefill = useRef(false);
  const [merchantAddress, setMerchantAddress] = useState("");
  const [caseId, setCaseId] = useState<string>("");
  const [prefilledEmail, setPrefilledEmail] = useState<string>("");
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

  const [status, setStatus] = useState<"idle" | "processing" | "submitted" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [estimatedNewBalanceUsdc, setEstimatedNewBalanceUsdc] = useState<number | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [balanceMicros, setBalanceMicros] = useState<string | null>(null);

  const [notificationEmail, setNotificationEmail] = useState<string | null>(null);
  const [notificationVerified, setNotificationVerified] = useState<boolean | null>(null);
  const [notificationRequiredUsdc, setNotificationRequiredUsdc] = useState<number | null>(null);
  const [notificationHasSufficientCredits, setNotificationHasSufficientCredits] = useState<boolean | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    // Prefill from email links: /topup?merchant=...&caseId=...
    if (didPrefill.current) return;
    didPrefill.current = true;
    try {
      const url = new URL(window.location.href);
      const merchantFromQuery = url.searchParams.get("merchant");
      const caseFromQuery = url.searchParams.get("caseId") || url.searchParams.get("case") || "";
      const emailFromQuery = url.searchParams.get("email") || "";
      if (merchantFromQuery) setMerchantAddress((prev) => (prev.trim() ? prev : merchantFromQuery));
      if (caseFromQuery) setCaseId((prev) => (prev ? prev : caseFromQuery));
      if (emailFromQuery) setPrefilledEmail((prev) => (prev ? prev : emailFromQuery));
    } catch {
      // Ignore
    }
  }, []);

  const fetchBalance = async (merchant: string) => {
    setBalanceStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/v1/merchant/balance?merchant=${encodeURIComponent(merchant)}`, {
        method: "GET",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || `Failed to fetch balance: ${res.status}`);
      }
      setBalanceMicros(String(data.availableMicrousdc ?? "0"));
      setBalanceStatus("success");
    } catch (e: unknown) {
      setBalanceStatus("error");
      setBalanceMicros(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  // Automatically fetch current credits when merchant wallet becomes valid.
  useEffect(() => {
    if (!merchantCaip10) {
      setBalanceStatus("idle");
      setBalanceMicros(null);
      return;
    }
    void fetchBalance(merchantCaip10);
  }, [merchantCaip10]);

  // If we have a dispute case, fetch notification status (email + verification + required credits).
  useEffect(() => {
    if (!caseId) {
      setNotificationEmail(null);
      setNotificationVerified(null);
      setNotificationRequiredUsdc(null);
      setNotificationHasSufficientCredits(null);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/merchant/notification-status?caseId=${encodeURIComponent(caseId)}`, {
          method: "GET",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) return;
        setNotificationEmail(typeof data.supportEmail === "string" ? data.supportEmail : null);
        setNotificationVerified(typeof data.verified === "boolean" ? data.verified : null);
        setNotificationRequiredUsdc(typeof data.requiredUsdc === "number" ? data.requiredUsdc : null);
        setNotificationHasSufficientCredits(
          typeof data.hasSufficientCredits === "boolean" ? data.hasSufficientCredits : null,
        );
      } catch {
        // ignore
      }
    })();
  }, [caseId]);

  // After submitting a top-up, auto-refresh credits for a short time (no user action).
  useEffect(() => {
    if (!merchantCaip10 || !txHash) return;
    let stopped = false;
    let attempts = 0;
    const maxAttempts = 15; // ~30s at 2s interval
    const interval = setInterval(() => {
      if (stopped) return;
      attempts += 1;
      void fetchBalance(merchantCaip10);
      if (attempts >= maxAttempts) {
        stopped = true;
        clearInterval(interval);
      }
    }, 2000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [merchantCaip10, txHash]);

  const availableUsdc =
    balanceStatus === "success" && balanceMicros ? Number(balanceMicros) / 1_000_000 : null;
  const requiredUsdc = typeof notificationRequiredUsdc === "number" ? notificationRequiredUsdc : null;
  const hasEnoughForActions =
    typeof notificationHasSufficientCredits === "boolean" ? notificationHasSufficientCredits : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Top up refund credits</h1>
        <p className="text-sm text-muted-foreground">
          Add USDC so approved disputes can be refunded automatically. No account required.
        </p>
        {caseId && (
          <p className="text-sm text-muted-foreground">
            After you top up, we&apos;ll re-send one-click actions for case{" "}
            <code className="font-mono">{caseId}</code>.
          </p>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top up balance</CardTitle>
          <Badge variant={status === "submitted" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status === "idle"
              ? "Ready"
              : status === "processing"
                ? "Processing"
                : status === "submitted"
                  ? "Submitted"
                  : "Error"}
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
            {merchantCaip10 && (
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">Refund credits</div>
                <div className="font-medium text-foreground">
                  {balanceStatus === "loading"
                    ? "Loading…"
                    : balanceStatus === "success" && typeof availableUsdc === "number"
                      ? `${availableUsdc.toFixed(6)} USDC`
                      : balanceStatus === "error"
                        ? "Unable to load"
                        : "—"}
                </div>
              </div>
            )}
          </div>

          {caseId && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
              <div className="text-sm font-medium text-foreground">For dispute {caseId.slice(0, 8)}…</div>
              {typeof requiredUsdc === "number" ? (
                <div className="text-xs text-muted-foreground">
                  One-click actions require at least <code className="font-mono">{requiredUsdc.toFixed(6)} USDC</code>{" "}
                  (refund + dispute fee).
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  We’ll email one-click actions after your credits are sufficient.
                </div>
              )}
              {typeof hasEnoughForActions === "boolean" && (
                <div className="text-xs">
                  {hasEnoughForActions ? (
                    <span className="text-foreground">
                      Status: <span className="font-medium">Enough credits</span> — you should receive approve/reject
                      links by email.
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Status: <span className="font-medium text-foreground">Not enough credits yet</span> — top up a
                      bit more to enable approve/reject links.
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2 text-xs text-muted-foreground space-y-1">
                <div>
                  Notifications sent to:{" "}
                  <code className="font-mono">
                    {notificationEmail || prefilledEmail || "from /.well-known/x402.json"}
                  </code>
                </div>
                {prefilledEmail && notificationEmail && prefilledEmail !== notificationEmail && (
                  <div>
                    Note: link email differs from x402.json. Using <code className="font-mono">{notificationEmail}</code>.
                  </div>
                )}
                {typeof notificationVerified === "boolean" && (
                  <div>
                    Email verification:{" "}
                    <span className="font-medium text-foreground">{notificationVerified ? "Verified" : "Not verified"}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={resendStatus === "sending"}
                  onClick={async () => {
                    setResendStatus("sending");
                    setResendMessage(null);
                    try {
                      const res = await fetch(`${API_BASE}/v1/merchant/resend`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ caseId }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok || !data?.ok) {
                        const msg =
                          typeof data?.message === "string"
                            ? data.message
                            : typeof data?.code === "string"
                              ? data.code
                              : `Failed: ${res.status}`;
                        throw new Error(msg);
                      }
                      setResendStatus("sent");
                      setResendMessage("Sent. Check inbox/spam.");
                    } catch (e: unknown) {
                      setResendStatus("error");
                      setResendMessage(e instanceof Error ? e.message : String(e));
                    }
                  }}
                >
                  Resend email
                </Button>
                {resendMessage && (
                  <div className={resendStatus === "error" ? "text-xs text-destructive mt-2" : "text-xs text-muted-foreground mt-2"}>
                    {resendMessage}
                  </div>
                )}
              </div>
            </div>
          )}

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
              setEstimatedNewBalanceUsdc(null);
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
                  body: JSON.stringify({
                    merchant: merchantCaip10,
                    amountMicrousdc: amountMicros,
                    currency: "USDC",
                    caseId: caseId || undefined,
                  }),
                });
                if (res.status !== 402) {
                  const text = await res.text();
                  throw new Error(`Expected 402 from /v1/topup, got ${res.status}: ${text}`);
                }
                const response402 = await res.json().catch(() => ({}));
                const requirement = parsePaymentRequirements(response402);
                if (address.toLowerCase() === String(requirement.payTo).toLowerCase()) {
                  throw new Error(
                    `Connected wallet is the same as payTo (${requirement.payTo}). Switch to a payer wallet.`,
                  );
                }

                // 2) sign (x402 v1: X-PAYMENT)
                const xPayment = await createX402PaymentSignature(walletClient, requirement, address);

                // 3) settle (send X-PAYMENT header)
                const res2 = await fetch(`${API_BASE}/v1/topup`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "X-PAYMENT": xPayment,
                  },
                  body: JSON.stringify({
                    merchant: merchantCaip10,
                    amountMicrousdc: amountMicros,
                    currency: "USDC",
                    caseId: caseId || undefined,
                  }),
                });

                const data = await res2.json().catch(() => ({}));
                if (!res2.ok || !data?.ok) {
                  throw new Error(data?.message || `Topup failed: ${res2.status}`);
                }

                setTxHash(data.txHash || null);
                setEstimatedNewBalanceUsdc(
                  typeof data.estimatedNewBalanceUsdc === "number" ? data.estimatedNewBalanceUsdc : null,
                );
                setStatus("submitted");
              } catch (e: unknown) {
                setStatus("error");
                setError(e instanceof Error ? e.message : String(e));
              }
            }}
          >
            Top up (gasless)
          </Button>

          {txHash && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Payment transaction hash (Base)</div>
              <CopyableField value={txHash} truncate={false} label="Copied transaction hash" />
              <a
                className="text-xs text-muted-foreground underline"
                href={`https://basescan.org/tx/${encodeURIComponent(txHash)}`}
                target="_blank"
                rel="noreferrer"
              >
                View on Basescan
              </a>
            </div>
          )}

          {typeof estimatedNewBalanceUsdc === "number" && (
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Estimated new balance (USDC):{" "}
                <code className="font-mono">{estimatedNewBalanceUsdc.toFixed(6)}</code>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

