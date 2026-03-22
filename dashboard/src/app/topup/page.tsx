"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyableField } from "@/components/case-detail/CopyableField";
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import { PublicKey } from "@solana/web3.js";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
import { ArrowLeftRight, CheckCircle2, Coins, Loader2, Wallet } from "lucide-react";
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

function ChainIcon({
  network,
  className,
}: {
  network: "base" | "solana";
  className?: string;
}) {
  if (network === "base") {
    // Base logo: blue circle with stylized "B"
    return (
      <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#0052FF" />
        <path
          d="M12 10h4.5c2.5 0 4 1.5 4 4s-1.5 4-4 4H14v4H12V10zm2.5 6.5c1.1 0 1.8-.7 1.8-1.8s-.7-1.8-1.8-1.8H14v3.6h.5z"
          fill="#fff"
        />
      </svg>
    );
  }

  // Solana logo: gradient bars (green, cyan, purple)
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="solana-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14F195" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="solana-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#80ECFF" />
          <stop offset="100%" stopColor="#80ECFF" />
        </linearGradient>
        <linearGradient id="solana-grad-3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#9945FF" />
        </linearGradient>
      </defs>
      <rect x="6" y="8" width="20" height="4" rx="2" fill="url(#solana-grad-1)" />
      <rect x="6" y="14" width="20" height="4" rx="2" fill="url(#solana-grad-2)" />
      <rect x="6" y="20" width="20" height="4" rx="2" fill="url(#solana-grad-3)" />
    </svg>
  );
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
  const [friendlyError, setFriendlyError] = useState<{ title: string; body: string } | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [estimatedNewBalanceUsdc, setEstimatedNewBalanceUsdc] = useState<number | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [balanceMicros, setBalanceMicros] = useState<string | null>(null);

  const [notificationRequiredUsdc, setNotificationRequiredUsdc] = useState<number | null>(null);

  const [completionStatus, setCompletionStatus] = useState<"idle" | "waiting" | "done" | "error">("idle");
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const isEmailActionFlow = Boolean(actionToken.trim()) && Boolean(caseId);

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

  function decodePaymentRequiredHeader(value: string): unknown | null {
    const raw = (value || "").trim();
    if (!raw) return null;
    const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
    try {
      const json = atob(normalized);
      return JSON.parse(json) as unknown;
    } catch {
      return null;
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
  const enteredAmountUsdc = amountMicrosBig ? Number(amountMicrosBig) / 1_000_000 : null;
  const previewBalanceUsdc =
    typeof availableUsdc === "number" && typeof enteredAmountUsdc === "number" ? availableUsdc + enteredAmountUsdc : null;

  const formatUsdc2 = useMemo(() => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }, []);

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
        <h1 className="text-2xl font-semibold text-foreground">Add refund credits</h1>
        {!isEmailActionFlow && (
          <p className="text-sm text-muted-foreground">
            Add USDC credits so refunds can be executed automatically.
          </p>
        )}
        {isEmailActionFlow ? (
          <p className="text-sm text-muted-foreground">
            Approving case{" "}
            <code className="font-mono">{caseId}</code>.
            {" "}Add credits to complete this approval automatically.
          </p>
        ) : caseId ? (
          <p className="text-sm text-muted-foreground">
            After you add credits, we&apos;ll automatically complete your selected action for case{" "}
            <code className="font-mono">{caseId}</code>.
          </p>
        ) : null}
      </div>

      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b bg-muted/10 sm:flex-row sm:items-start">
          <div className="flex-1 space-y-2">
            {status !== "idle" && (
              <Badge variant={status === "submitted" ? "default" : status === "error" ? "destructive" : "secondary"}>
                {status === "processing" ? "Processing" : status === "submitted" ? "Submitted" : "Error"}
              </Badge>
            )}
            <div className="space-y-1">
              <CardTitle className="text-base">Funding details</CardTitle>
              <CardDescription>
                Confirm the merchant wallet, choose the payer network, and add USDC credits.
              </CardDescription>
            </div>
          </div>
          {merchantCaip10 && (
            <div className="ml-auto text-right">
              <div className="text-xs text-muted-foreground">Credit Balance</div>
              <div className="text-sm font-medium text-foreground">
                {balanceStatus === "loading"
                  ? "Loading…"
                  : balanceStatus === "success" && typeof availableUsdc === "number"
                    ? `${formatUsdc2.format(availableUsdc)} USDC`
                    : balanceStatus === "error"
                      ? "Unable to load"
                      : "—"}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Confirm */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="space-y-3">
              {!isEmailActionFlow && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span>Confirm merchant wallet</span>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Paste the merchant wallet that should receive refund credits. We&apos;ll detect the correct
                    network automatically.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant</Label>
                {isEmailActionFlow ? (
                  <div className="space-y-2">
                    <CopyableField
                      value={merchantAddress || merchantCaip10 || ""}
                      label="Copied merchant"
                    />
                  </div>
                ) : (
                  <Input
                    id="merchant"
                    placeholder="Paste a Base/EVM wallet, Solana wallet, or CAIP-10 wallet ID"
                    value={merchantAddress}
                    disabled={isEmailActionFlow}
                    onChange={(e) => setMerchantAddress(e.target.value)}
                  />
                )}
                {!isEmailActionFlow && (
                  <p className="text-xs text-muted-foreground">
                    Supports <code className="font-mono">0x...</code>, raw Solana base58 addresses, and CAIP-10
                    wallet IDs.
                  </p>
                )}

                {merchantAddress.trim() && inferred.error && (
                  <div className="text-xs text-destructive">{inferred.error}</div>
                )}

                {merchantCaip10 && (
                  <>
                    {inferred.network && !inferred.error ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1.5">
                          <ChainIcon
                            network={inferred.network === "solana" ? "solana" : "base"}
                            className="h-3.5 w-3.5"
                          />
                          {inferred.network === "solana" ? "Solana wallet detected" : "Base / EVM wallet detected"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Credits will be added to this merchant wallet.
                        </span>
                      </div>
                    ) : null}
                    {caseId ? (
                      <div className="text-sm">
                        <div className="text-xs text-muted-foreground">Case</div>
                        <code className="mt-1 block font-mono text-sm break-all text-foreground">{caseId}</code>
                      </div>
                    ) : null}
                  </>
                )}

                {!isEmailActionFlow && (
                  <Accordion
                    type="single"
                    collapsible
                    className="rounded-lg border border-border/60 bg-background/80 px-3"
                  >
                    <AccordionItem value="examples" className="border-none">
                      <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                        Wallet format examples
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              <ChainIcon network="base" className="h-3.5 w-3.5" />
                              Base / EVM
                            </div>
                            <div className="space-y-2 text-xs text-muted-foreground">
                              <code className="block break-all font-mono text-foreground">
                                0x742d35Cc6634C0532925a3b844Bc454e4438f44e
                              </code>
                              <code className="block break-all font-mono text-foreground">
                                eip155:8453:0x742d35Cc6634C0532925a3b844Bc454e4438f44e
                              </code>
                            </div>
                          </div>
                          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              <ChainIcon network="solana" className="h-3.5 w-3.5" />
                              Solana
                            </div>
                            <div className="space-y-2 text-xs text-muted-foreground">
                              <code className="block break-all font-mono text-foreground">
                                FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N
                              </code>
                              <code className="block break-all font-mono text-foreground">
                                solana:mainnet:FiZy3ch8QSDVWhJfZJYA75ZvDQgu4FJY4NfesZhbda4N
                              </code>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            </div>
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
            </div>
          )}

          {/* Step 2: Pay on */}
          {!isEmailActionFlow && (
            <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  <span>Choose a payer network</span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Select the wallet you&apos;ll use to fund this top-up. If the merchant wallet only supports one
                  network, we&apos;ll lock the correct option automatically.
                </p>
              </div>
              <Tabs
                value={payNetwork}
                className="w-full"
                onValueChange={(v) => setPayNetwork(v === "solana" ? "solana" : "base")}
              >
                <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2">
                  <TabsTrigger
                    aria-label="Base (USDC)"
                    value="base"
                    disabled={inferred.locked && inferred.network === "solana"}
                    className="h-auto min-h-[92px] flex-col items-start justify-start gap-2 rounded-xl border border-border bg-background px-4 py-3 text-left whitespace-normal data-[state=active]:border-primary/30 data-[state=active]:bg-primary/5 data-[state=active]:text-foreground data-[state=active]:shadow-sm disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <ChainIcon network="base" className="h-4 w-4" />
                      Base
                    </span>
                    <span className="text-xs font-normal leading-5 text-muted-foreground">
                      Use Coinbase Wallet, MetaMask, or another Base-compatible wallet to pay in USDC.
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    aria-label="Solana (USDC)"
                    value="solana"
                    disabled={inferred.locked && inferred.network === "base"}
                    className="h-auto min-h-[92px] flex-col items-start justify-start gap-2 rounded-xl border border-border bg-background px-4 py-3 text-left whitespace-normal data-[state=active]:border-primary/30 data-[state=active]:bg-primary/5 data-[state=active]:text-foreground data-[state=active]:shadow-sm disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <ChainIcon network="solana" className="h-4 w-4" />
                      Solana
                    </span>
                    <span className="text-xs font-normal leading-5 text-muted-foreground">
                      Use Phantom or another Solana wallet to pay in USDC on Solana.
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              {inferred.locked && inferred.network && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  Merchant wallet is on{" "}
                  <span className="font-medium text-foreground">
                    {inferred.network === "solana" ? "Solana" : "Base / EVM"}
                  </span>
                  , so we&apos;ve preselected the matching payer network.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Amount + Pay */}
          <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            {!isEmailActionFlow && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Coins className="h-4 w-4 text-primary" />
                  <span>Set top-up amount</span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  Choose how much USDC to add. Suggested amounts are auto-filled when a case needs more credits to
                  complete.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                {isEmailActionFlow ? (
                  <div className="text-sm font-medium text-foreground">Amount</div>
                ) : (
                  <Label htmlFor="amount">Amount</Label>
                )}
              </div>
              {typeof requiredUsdc === "number" && caseId && (
                <div className="text-xs text-muted-foreground">
                  Required to proceed: <code className="font-mono">{requiredUsdc.toFixed(6)}</code> USDC
                </div>
              )}
              {isEmailActionFlow ? (
                <div aria-label="Amount" className="text-base font-medium text-foreground/70 font-mono">
                  {amountUsdc
                    ? `${amountUsdc} USDC`
                    : typeof requiredUsdc === "number"
                      ? `${formatUsdc2.format(requiredUsdc)} USDC`
                      : "—"}
                </div>
              ) : (
                <Input
                  id="amount"
                  placeholder="e.g. 5.00"
                  value={amountUsdc}
                  onChange={(e) => setAmountUsdc(e.target.value)}
                />
              )}
              {!isEmailActionFlow && (
                <p className="text-xs text-muted-foreground">
                  Minimum 0.01 USDC, maximum 10.00 USDC, up to 6 decimal places.
                </p>
              )}
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

            {!isEmailActionFlow && (typeof availableUsdc === "number" || typeof requiredUsdc === "number" || amountMicros) && (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Current balance
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {typeof availableUsdc === "number" ? `${formatUsdc2.format(availableUsdc)} USDC` : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Required
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {typeof requiredUsdc === "number" ? `${formatUsdc2.format(requiredUsdc)} USDC` : "Optional"}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Balance after top-up
                  </div>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {typeof previewBalanceUsdc === "number" ? `${formatUsdc2.format(previewBalanceUsdc)} USDC` : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Wallet className="h-4 w-4 text-primary" />
                <span>Connect payer wallet</span>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {payNetwork === "base"
                  ? "Use a Base-compatible wallet to approve the payment. If needed, we’ll prompt a switch to Base before signing."
                  : "Use a Solana wallet to sign the payment. Phantom is the smoothest option today."}
              </p>
            </div>

            {payNetwork === "base" ? (
              walletReadyEvm ? (
                <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <Badge variant="secondary" className="w-fit gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Base wallet connected
                      </Badge>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Payer wallet</div>
                        <code className="block break-all font-mono text-xs text-foreground">{address}</code>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Payment will be signed from this wallet on Base.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 bg-background/70 p-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ChainIcon network="base" className="h-4 w-4" />
                      <span>Connect a Base wallet to continue</span>
                    </div>
                    <Badge variant="outline">Base</Badge>
                  </div>
                  <ConnectWalletButton />
                </div>
              )
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ChainIcon network="solana" className="h-4 w-4" />
                    <span>Connect a Solana wallet to continue</span>
                  </div>
                  <Badge variant="outline">Solana</Badge>
                </div>
                {solanaAddress ? (
                  <div className="rounded-lg border border-border/60 bg-background/80 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="w-fit gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Solana wallet connected
                        </Badge>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Payer wallet</div>
                          <code className="block break-all font-mono text-xs text-foreground">{solanaAddress}</code>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => void disconnectSolanaWallet()}>
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-background/70 p-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void connectSolanaWallet()}
                      disabled={solanaConnectStatus === "connecting"}
                    >
                      {solanaConnectStatus === "connecting" ? "Connecting…" : "Connect Phantom"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            disabled={status === "processing"}
            onClick={async () => {
              setError(null);
              setFriendlyError(null);
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
                if (res.status === 400) {
                  const parsed = (await res.json().catch(() => null)) as unknown;
                  const obj: Record<string, unknown> | null =
                    parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
                  const code = typeof obj?.code === "string" ? obj.code : "";
                  if (code === "ACTION_TOKEN_USED") {
                    setFriendlyError({
                      title: "Already processed",
                      body: "This case has already been decided, so there’s nothing to process.",
                    });
                    setStatus("error");
                    return;
                  }
                  const msg = typeof obj?.message === "string" ? obj.message : "";
                  setError(msg || "Unable to process this request.");
                  setStatus("error");
                  return;
                }
                if (res.status !== 402) {
                  const text = await res.text();
                  throw new Error(`Expected 402 from /v1/topup, got ${res.status}: ${text}`);
                }
                const paymentRequiredHeader = res.headers.get("PAYMENT-REQUIRED") || res.headers.get("payment-required") || "";
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

                  const parsedHeader = paymentRequiredHeader ? decodePaymentRequiredHeader(paymentRequiredHeader) : null;
                  const parsedObj: Record<string, unknown> | null =
                    parsedHeader && typeof parsedHeader === "object" ? (parsedHeader as Record<string, unknown>) : null;
                  const acceptsRaw = parsedObj?.accepts;
                  const headerAccepts = Array.isArray(acceptsRaw) ? (acceptsRaw as unknown[]) : [];
                  const solReq = headerAccepts.find((x) => {
                    if (!x || typeof x !== "object") return false;
                    const net = String((x as Record<string, unknown>).network || "").toLowerCase();
                    return net.includes("solana");
                  }) as
                    | {
                        scheme: string;
                        network: string;
                        asset: string;
                        amount: string;
                        payTo: string;
                        maxTimeoutSeconds: number;
                        extra?: Record<string, unknown>;
                      }
                    | undefined;
                  if (!solReq) throw new Error("Missing Solana v2 requirement (PAYMENT-REQUIRED).");

                  const feePayer = typeof solReq.extra?.feePayer === "string" ? solReq.extra.feePayer : "";
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
                    payTo: new PublicKey(String(solReq.payTo)),
                    mint: new PublicKey(String(solReq.asset)),
                    amountMicrousdc: getSolanaAmountMicrousdcFromRequirement(solReq),
                  });
                  const signed = await provider.signTransaction(tx);
                  const partialTx = encodePartialSolanaTransactionBase64(signed);

                  // Canonical x402 v2 Solana payment payload (matches demo agent flow).
                  const amount = getSolanaAmountMicrousdcFromRequirement(solReq);
                  const paymentPayload = {
                    x402Version: 2,
                    scheme: solReq.scheme,
                    network: solReq.network,
                    accepted: {
                      scheme: solReq.scheme,
                      network: solReq.network,
                      amount: String(amount),
                      asset: solReq.asset,
                      payTo: solReq.payTo,
                      maxTimeoutSeconds: solReq.maxTimeoutSeconds,
                      extra: { feePayer },
                    },
                    payload: { transaction: partialTx },
                  };
                  xPayment = btoa(JSON.stringify(paymentPayload));
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
            {isEmailActionFlow ? "Process refund" : "Add USDC credits"}
          </Button>
          <div className="text-xs text-muted-foreground">No gas fees. Powered by X-402.</div>

          {friendlyError && (
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-sm font-medium text-foreground">{friendlyError.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{friendlyError.body}</div>
            </div>
          )}

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

