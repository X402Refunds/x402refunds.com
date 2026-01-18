"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyableField } from "@/components/case-detail/CopyableField";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import { PublicKey } from "@solana/web3.js";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inferTopupPayNetworkFromMerchant } from "@/lib/topup-network";
import {
  createX402PaymentSignature,
  parsePaymentRequirements,
  pickPaymentRequirementByNetwork,
} from "@/lib/x402-signature";
import {
  createSolanaExactPaymentTransaction,
  encodePartialSolanaTransactionBase64,
  getSolanaAmountMicrousdcFromRequirement,
  getSolanaProvider,
} from "@/lib/x402-solana";
import { Loader2 } from "lucide-react";
const API_BASE = "https://api.x402refunds.com";
const TOPUP_PROXY_PATH = "/api/wallet-first/topup";
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
  const { switchChainAsync } = useSwitchChain();

  // Avoid React hydration mismatch (#418) by ensuring any wallet-dependent UI
  // (and other browser-initialized state) only renders after the component is mounted on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const didPrefill = useRef(false);
  const didPrefillAmount = useRef(false);
  const [merchantAddress, setMerchantAddress] = useState("");
  const [caseId, setCaseId] = useState<string>("");
  const [actionToken, setActionToken] = useState<string>("");
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

  const inferred = useMemo(() => inferTopupPayNetworkFromMerchant(merchantAddress), [merchantAddress]);
  const merchantCaip10 = inferred.merchantCaip10;
  const [payNetwork, setPayNetwork] = useState<"base" | "solana">("base");
  const [solanaAddress, setSolanaAddress] = useState<string>("");
  const [solanaConnectStatus, setSolanaConnectStatus] = useState<"idle" | "connecting">("idle");

  const [status, setStatus] = useState<"idle" | "processing" | "submitted" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [estimatedNewBalanceUsdc, setEstimatedNewBalanceUsdc] = useState<number | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [balanceMicros, setBalanceMicros] = useState<string | null>(null);

  const [notificationRequiredUsdc, setNotificationRequiredUsdc] = useState<number | null>(null);

  const [completionStatus, setCompletionStatus] = useState<"idle" | "waiting" | "done" | "error">("idle");
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const walletReadyEvm = mounted && isConnected && !!address && !!walletClient;
  const walletReadySolana = mounted && !!solanaAddress;

  useEffect(() => {
    // Auto-switch and lock based on merchant input.
    if (!inferred.locked || !inferred.network) return;
    setPayNetwork(inferred.network);
  }, [inferred.locked, inferred.network]);

  async function getActiveEvmChainId(): Promise<number | null> {
    const w = walletClient as unknown as {
      request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      chain?: { id?: unknown };
    };
    if (typeof w?.request === "function") {
      try {
        const res = await w.request({ method: "eth_chainId" });
        if (typeof res === "string" && res.startsWith("0x")) {
          const id = parseInt(res, 16);
          if (Number.isFinite(id) && id > 0) return id;
        }
        if (typeof res === "number" && Number.isFinite(res) && res > 0) return res;
      } catch {
        // ignore
      }
    }
    const id = w?.chain?.id;
    return typeof id === "number" ? id : null;
  }

  async function connectSolanaWallet(): Promise<string | null> {
    const provider = getSolanaProvider();
    if (!provider) {
      setError("No Solana wallet found. Please install Phantom (or a Solana wallet that injects window.solana).");
      return null;
    }
    setSolanaConnectStatus("connecting");
    try {
      const res = await provider.connect();
      const pk = res.publicKey?.toBase58?.() || provider.publicKey?.toBase58?.() || "";
      if (!pk) {
        setError("Failed to connect Solana wallet.");
        return null;
      }
      setSolanaAddress(pk);
      return pk;
    } finally {
      setSolanaConnectStatus("idle");
    }
  }

  async function disconnectSolanaWallet() {
    const provider = getSolanaProvider() as unknown as { disconnect?: () => Promise<void> | void };
    try {
      if (provider && typeof provider.disconnect === "function") await provider.disconnect();
    } catch {
      // ignore
    } finally {
      setSolanaAddress("");
    }
  }

  useEffect(() => {
    // Prefill from email links: /topup?merchant=...&caseId=...&amount=...
    if (didPrefill.current) return;
    didPrefill.current = true;
    try {
      const url = new URL(window.location.href);
      const merchantFromQuery = url.searchParams.get("merchant");
      const caseFromQuery = url.searchParams.get("caseId") || url.searchParams.get("case") || "";
      const actionTokenFromQuery = url.searchParams.get("actionToken") || url.searchParams.get("token") || "";
      const amountFromQuery = url.searchParams.get("amount") || url.searchParams.get("amountUsdc") || "";
      if (merchantFromQuery) setMerchantAddress((prev) => (prev.trim() ? prev : merchantFromQuery));
      if (caseFromQuery) setCaseId((prev) => (prev ? prev : caseFromQuery));
      if (actionTokenFromQuery) setActionToken((prev) => (prev ? prev : actionTokenFromQuery));
      if (amountFromQuery) {
        const normalized = amountFromQuery.trim();
        if (normalized) {
          // Only prefill if user hasn't already typed and the query parses as USDC.
          if (!amountUsdc.trim() && parseUsdcToMicros(normalized)) {
            setAmountUsdc(normalized);
            didPrefillAmount.current = true;
          }
        }
      }
    } catch {
      // Ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // If we have a case id, fetch notification status (email + verification + required credits).
  useEffect(() => {
    if (!caseId) {
      setNotificationRequiredUsdc(null);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/merchant/notification-status?caseId=${encodeURIComponent(caseId)}`, {
          method: "GET",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) return;
        setNotificationRequiredUsdc(typeof data.requiredUsdc === "number" ? data.requiredUsdc : null);
      } catch {
        // ignore
      }
    })();
  }, [caseId]);

  // After submitting a top-up for an action, poll the case until it is finalized.
  useEffect(() => {
    if (!caseId || !txHash || !actionToken.trim()) return;
    let stopped = false;
    let attempts = 0;
    const maxAttempts = 30; // ~60s at 2s interval
    setCompletionStatus("waiting");
    setCompletionMessage(null);

    const interval = setInterval(() => {
      if (stopped) return;
      attempts += 1;
      void (async () => {
        try {
          const res = await fetch(`${API_BASE}/v1/refund?id=${encodeURIComponent(caseId)}`, { method: "GET" });
          const data = await res.json().catch(() => ({}));
          const status = String(data?.refundRequest?.status || "");
          if (res.ok && data?.ok && status === "DECIDED") {
            stopped = true;
            clearInterval(interval);
            setCompletionStatus("done");
            setCompletionMessage("All set — refund is processing.");
          } else if (attempts >= maxAttempts) {
            stopped = true;
            clearInterval(interval);
            setCompletionStatus("error");
            setCompletionMessage("Top-up submitted, but the case is still processing. Please check the case page.");
          }
        } catch {
          if (attempts >= maxAttempts) {
            stopped = true;
            clearInterval(interval);
            setCompletionStatus("error");
            setCompletionMessage("Top-up submitted, but we couldn't confirm completion yet. Please check the case page.");
          }
        }
      })();
    }, 2000);

    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [actionToken, caseId, txHash]);

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

  // UX: If we know the required credits for a dispute and the merchant's current credits,
  // prefill the top-up amount with the missing delta (without overriding user input).
  useEffect(() => {
    if (didPrefillAmount.current) return;
    if (amountUsdc.trim()) return; // user typed (or query param already filled)
    if (typeof requiredUsdc !== "number") return;
    const available = typeof availableUsdc === "number" ? availableUsdc : 0;
    const deficit = requiredUsdc - available;
    if (!(deficit > 0)) return;

    const clamped = Math.min(deficit, 10);
    // Keep up to 6 decimals (USDC precision) and strip trailing zeros for cleanliness.
    const formatted = clamped
      .toFixed(6)
      .replace(/\.?0+$/, "");

    if (!formatted) return;
    if (!parseUsdcToMicros(formatted)) return;
    setAmountUsdc(formatted);
    didPrefillAmount.current = true;
  }, [amountUsdc, availableUsdc, requiredUsdc]);

  // Prevent SSR/client markup divergence entirely by rendering a stable placeholder until mounted.
  // This avoids hydration issues across browsers/extensions that may mutate DOM or wallet state eagerly.
  if (!mounted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Top up refund credits</h1>
        <p className="text-sm text-muted-foreground">
          Add USDC so approved disputes can be refunded automatically. No account required.
        </p>
        {caseId && (
          <p className="text-sm text-muted-foreground">
            After you top up, we&apos;ll automatically complete your selected action for case{" "}
            <code className="font-mono">{caseId}</code>.
          </p>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-end">
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
              placeholder="0x... or <Solana base58> or solana:<chainRef>:<base58>"
              value={merchantAddress}
              onChange={(e) => setMerchantAddress(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Examples:{" "}
              <code className="font-mono">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</code> or{" "}
              <code className="font-mono">
                FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N
              </code>
            </div>
            {merchantAddress.trim() && inferred.error && (
              <div className="text-xs text-destructive">{inferred.error}</div>
            )}
            {merchantCaip10 && (
              <div className="text-sm">
                <div className="text-xs text-muted-foreground">Refund credit balance</div>
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

          {caseId && completionStatus !== "idle" && (
            <div className={completionStatus === "done" ? "rounded-lg border border-border bg-muted/20 p-3 text-sm text-foreground" : "rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground"}>
              <div className="flex items-center gap-2">
                {completionStatus === "waiting" && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {completionStatus === "waiting"
                    ? "Top-up received — starting the refund…"
                    : completionStatus === "done"
                      ? "All set — refund is processing. We’ll email you when it’s processed. You can close this page."
                      : completionMessage || "Top-up submitted — processing…"}
                </span>
              </div>
              <div className="mt-2">
                <a
                  className="text-xs underline text-muted-foreground"
                  href={`/cases/${encodeURIComponent(caseId)}`}
                >
                  View case
                </a>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Top-up payment network</Label>
            <Tabs value={payNetwork} onValueChange={(v) => setPayNetwork(v === "solana" ? "solana" : "base")}>
              <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
                <TabsTrigger
                  value="base"
                  disabled={inferred.locked && inferred.network === "solana"}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-50"
                >
                  Base (USDC)
                </TabsTrigger>
                <TabsTrigger
                  value="solana"
                  disabled={inferred.locked && inferred.network === "base"}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-50"
                >
                  Solana (USDC)
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="text-xs text-muted-foreground">
              {payNetwork === "base"
                ? "Pay gasless via Base (facilitator executes the transfer)."
                : "Pay gasless via Solana (facilitator is the fee payer)."}
            </div>
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

          {payNetwork === "base" ? (
            !isConnected ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Connect payer wallet (Base)</div>
                <ConnectWalletButton />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Payer wallet (connected): <code className="font-mono">{address}</code>
              </div>
            )
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Connect payer wallet (Solana)</div>
              {solanaAddress ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    Connected: <code className="font-mono">{solanaAddress}</code>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => void disconnectSolanaWallet()}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void connectSolanaWallet()}
                  disabled={solanaConnectStatus === "connecting"}
                >
                  {solanaConnectStatus === "connecting" ? "Connecting…" : "Connect Phantom"}
                </Button>
              )}
            </div>
          )}

          <Button
            disabled={status === "processing"}
            onClick={async () => {
              setError(null);
              setTxHash(null);
              setEstimatedNewBalanceUsdc(null);
              setCompletionStatus("idle");
              setCompletionMessage(null);
              setStatus("processing");
              try {
                if (!merchantCaip10) throw new Error(inferred.error || "Merchant wallet is required");
                if (!amountMicros) throw new Error("Enter an amount");
                if (!amountMicrosBig) throw new Error("Enter an amount");
                if (overMax) throw new Error("Max top up is $10 USDC");
                if (underMin) throw new Error("Minimum top up is $0.01 USDC");
                if (payNetwork === "base" && !walletReadyEvm) throw new Error("Connect a Base wallet to pay");
                if (payNetwork === "solana" && !walletReadySolana) throw new Error("Connect a Solana wallet to pay");

                if (payNetwork === "base" && walletClient) {
                  // Best-effort: switch to Base before signing (prevents chainId mismatch errors).
                  const active = await getActiveEvmChainId();
                  if (typeof active === "number" && active !== 8453) {
                    try {
                      await switchChainAsync({ chainId: 8453 });
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : String(e);
                      throw new Error(`Please switch your wallet to Base (chainId 8453). ${msg}`);
                    }
                  }
                }

                // 1) request payment requirements (402)
                const res = await fetch(TOPUP_PROXY_PATH, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    merchant: merchantCaip10,
                    amountMicrousdc: amountMicros,
                    currency: "USDC",
                    blockchain: payNetwork,
                    caseId: caseId || undefined,
                    actionToken: actionToken || undefined,
                  }),
                });
                if (res.status !== 402) {
                  const text = await res.text();
                  throw new Error(`Expected 402 from /v1/topup, got ${res.status}: ${text}`);
                }
                const response402 = await res.json().catch(() => ({}));
                const requirement =
                  payNetwork === "base"
                    ? pickPaymentRequirementByNetwork(response402, "base")
                    : pickPaymentRequirementByNetwork(response402, "solana");
                if (!requirement) throw new Error("Missing payment requirement.");

                let xPayment: string;

                if (payNetwork === "base") {
                  if (!address || !walletClient) throw new Error("Connect a Base wallet to pay");
                  // v1 requirement
                  const req = parsePaymentRequirements(response402);
                  if (address.toLowerCase() === String(req.payTo).toLowerCase()) {
                    throw new Error(`Connected wallet is the same as payTo (${req.payTo}). Switch to a payer wallet.`);
                  }
                  xPayment = await createX402PaymentSignature(walletClient, req, address);
                } else {
                  const pk = solanaAddress || (await connectSolanaWallet());
                  if (!pk) throw new Error("Connect a Solana wallet to pay");

                  const reqV2 = requirement as unknown as {
                    scheme: string;
                    network: string;
                    asset: string;
                    amount: string;
                    payTo: string;
                    extra?: Record<string, unknown>;
                  };
                  const feePayer = typeof reqV2.extra?.feePayer === "string" ? reqV2.extra.feePayer : "";
                  if (!feePayer) throw new Error("Solana fee payer not provided by facilitator. Please retry.");

                  const bhRes = await fetch(`${API_BASE}/demo-agents/solana/blockhash`, { method: "GET" });
                  const bhJson = (await bhRes.json().catch(() => null)) as unknown;
                  const blockhash =
                    bhRes.ok && bhJson && typeof bhJson === "object"
                      ? (bhJson as Record<string, unknown>).blockhash
                      : null;
                  if (typeof blockhash !== "string" || !blockhash) {
                    throw new Error("Failed to fetch recent blockhash from server.");
                  }

                  const provider = getSolanaProvider();
                  if (!provider) throw new Error("No Solana wallet found.");

                  const tx = await createSolanaExactPaymentTransaction({
                    recentBlockhash: blockhash,
                    payer: new PublicKey(pk),
                    feePayer: new PublicKey(feePayer),
                    payTo: new PublicKey(String(reqV2.payTo)),
                    mint: new PublicKey(String(reqV2.asset)),
                    amountMicrousdc: getSolanaAmountMicrousdcFromRequirement(reqV2),
                  });
                  const signed = await provider.signTransaction(tx);
                  const partialTx = encodePartialSolanaTransactionBase64(signed);

                  const payload = {
                    x402Version: 2,
                    type: "solana-transaction",
                    transaction: partialTx,
                    network: reqV2.network,
                    requirement: reqV2,
                    paymentRequirements: response402?.accepts,
                  };
                  xPayment = btoa(JSON.stringify(payload));
                }

                // 3) settle (send X-PAYMENT header)
                const res2 = await fetch(TOPUP_PROXY_PATH, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    merchant: merchantCaip10,
                    amountMicrousdc: amountMicros,
                    currency: "USDC",
                    blockchain: payNetwork,
                    paymentHeader: xPayment,
                    caseId: caseId || undefined,
                    actionToken: actionToken || undefined,
                  }),
                });

                const text = await res2.text().catch(() => "");
                let parsed: unknown = null;
                try {
                  parsed = text ? (JSON.parse(text) as unknown) : null;
                } catch {
                  parsed = null;
                }

                const obj: Record<string, unknown> | null =
                  parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
                const ok = obj?.ok === true;
                if (!res2.ok || !ok) {
                  const message = typeof obj?.message === "string" ? obj.message : "";
                  const code = typeof obj?.code === "string" ? obj.code : "";
                  const details = obj
                    ? JSON.stringify(obj, null, 2).slice(0, 2000)
                    : text
                      ? text.slice(0, 2000)
                      : "";
                  throw new Error(
                    `${message || `Topup failed: ${res2.status}`}${code ? ` (${code})` : ""}${details ? `\n\n${details}` : ""}`,
                  );
                }

                setTxHash(typeof obj?.txHash === "string" ? obj.txHash : null);
                setEstimatedNewBalanceUsdc(
                  typeof obj?.estimatedNewBalanceUsdc === "number" ? obj.estimatedNewBalanceUsdc : null,
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
              <div className="text-sm font-medium text-foreground">
                Payment transaction hash ({payNetwork === "solana" ? "Solana" : "Base"})
              </div>
              <CopyableField value={txHash} truncate={false} label="Copied transaction hash" />
              <a
                className="text-xs text-muted-foreground underline"
                href={
                  payNetwork === "solana"
                    ? `https://solscan.io/tx/${encodeURIComponent(txHash)}`
                    : `https://basescan.org/tx/${encodeURIComponent(txHash)}`
                }
                target="_blank"
                rel="noreferrer"
              >
                View on {payNetwork === "solana" ? "Solscan" : "Basescan"}
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

