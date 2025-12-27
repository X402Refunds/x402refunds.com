"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CopyableField } from "@/components/case-detail/CopyableField"
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button"
import { useAccount, useWalletClient } from "wagmi"
import { createX402PaymentSignature, parsePaymentRequirements } from "@/lib/x402-signature"
import type { Doc } from "@convex/_generated/dataModel"

export default function BillingPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {})
  const orgId = currentUser?.organizationId
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const credits = useQuery(
    api.refundCredits.getOrgRefundCreditsSummary,
    orgId ? { organizationId: orgId } : "skip",
  )

  const topUps = useQuery(
    api.refundCredits.listTopUpRequests,
    orgId ? { organizationId: orgId } : "skip",
  )

  const deposit = useQuery(api.refundCredits.getPlatformDepositAddress, {})

  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)
  const [lastTxHash, setLastTxHash] = useState<string | null>(null)

  const depositAddress = deposit?.ok ? deposit.address : ""

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Billing</h1>
            <p className="text-sm text-muted-foreground">
              View your refund credits and submit top-ups.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Refund Credits</CardTitle>
            {credits ? (
              <Badge variant={credits.enabled ? "default" : "secondary"}>
                {credits.enabled ? "Enabled" : "Disabled"}
              </Badge>
            ) : (
              <Badge variant="secondary">Loading…</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {!orgId && (
              <p className="text-sm text-muted-foreground">
                Sign in to view your organization balance.
              </p>
            )}

            {orgId && !credits && (
              <p className="text-sm text-muted-foreground">
                No credits record found yet—refresh in a few seconds.
              </p>
            )}

            {credits && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Remaining</div>
                  <div className="text-2xl font-semibold">
                    {credits.remainingUsdc.toFixed(2)} USDC
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Spent</div>
                  <div className="text-2xl font-semibold">
                    {credits.spentUsdc.toFixed(2)} USDC
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Top-Ups</div>
                  <div className="text-lg font-medium">
                    {credits.topUpUsdc.toFixed(2)} USDC
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Trial Credit</div>
                  <div className="text-lg font-medium">
                    {credits.trialCreditUsdc.toFixed(2)} USDC
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="text-sm text-muted-foreground">Max Refund / Case</div>
                  <div className="text-lg font-medium">
                    {credits.maxPerCaseUsdc.toFixed(2)} USDC
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Note: $0.05 dispute fee is charged when a dispute becomes reviewable by your org.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Up (Base USDC)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <div className="text-sm text-muted-foreground">
                  Send USDC on Base to the platform deposit address:
                </div>

                {deposit?.ok ? (
                  <CopyableField value={depositAddress} label="Deposit address" truncate />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Deposit address is not configured yet. Set{" "}
                    <code className="font-mono">PLATFORM_BASE_USDC_DEPOSIT_ADDRESS</code> in Convex.
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  After sending, we automatically verify the on-chain USDC transfer and credit your balance.
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USDC)</Label>
              <Input
                id="amount"
                placeholder="e.g. 25.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {!isConnected && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Step 1: Connect wallet</div>
                <ConnectWalletButton />
              </div>
            )}

            {isConnected && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Step 2: Pay (gasless)</div>
                <Button
                  variant="default"
                  disabled={!orgId || !depositAddress || submitting || !amount || !walletClient || !address}
                  onClick={async () => {
                    if (!orgId) return
                    if (!depositAddress) {
                      setSubmitResult("Deposit address is not configured.")
                      return
                    }
                    if (!walletClient || !address) {
                      setSubmitResult("Wallet not ready.")
                      return
                    }
                    setSubmitting(true)
                    setSubmitResult(null)
                    setLastTxHash(null)
                    try {
                      // Step 1: Get 402 payment requirements
                      const r1 = await fetch("/api/billing/topup", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          organizationId: orgId,
                          amount,
                          amountUnit: "usdc",
                        }),
                      })

                      if (r1.status !== 402) {
                        const data = await r1.json().catch(() => ({}))
                        throw new Error(data?.error?.message || `Expected 402, got ${r1.status}`)
                      }

                      const paymentData = await r1.json()
                      const requirements = parsePaymentRequirements(paymentData)

                      // Prevent self-transfer (payer == payTo)
                      if (address.toLowerCase() === requirements.payTo.toLowerCase()) {
                        throw new Error(
                          `Connected wallet is the same as the deposit address (${requirements.payTo}). Switch to a payer wallet.`
                        )
                      }

                      // Step 2: Sign X-PAYMENT (no gas)
                      const xPaymentHeader = await createX402PaymentSignature(
                        walletClient,
                        requirements,
                        address
                      )

                      // Step 3: Retry with X-PAYMENT, server settles and credits
                      const r2 = await fetch("/api/billing/topup", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-PAYMENT": xPaymentHeader,
                        },
                        body: JSON.stringify({
                          organizationId: orgId,
                          amount,
                          amountUnit: "usdc",
                        }),
                      })

                      const data2 = await r2.json().catch(() => ({}))
                      if (!r2.ok || !data2.success) {
                        throw new Error(data2?.error?.message || `Payment failed: ${r2.status}`)
                      }

                      setLastTxHash(data2.txHash)
                      setSubmitResult("Credited successfully.")
                      setAmount("")
                    } catch (e: unknown) {
                      const message = e instanceof Error ? e.message : "Wallet transfer failed"
                      setSubmitResult(message)
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                >
                  {submitting ? "Processing…" : "Pay (gasless)"}
                </Button>

                {lastTxHash && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Transaction</div>
                    <CopyableField value={lastTxHash} truncate />
                  </div>
                )}

                {submitResult && (
                  <div className="text-sm text-muted-foreground">{submitResult}</div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Recent Top-Ups</div>
              {!topUps && (
                <div className="text-sm text-muted-foreground">Loading…</div>
              )}
              {topUps && topUps.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No top-ups submitted yet.
                </div>
              )}
              {topUps && topUps.length > 0 && (
                <div className="space-y-2">
                  {topUps.map((t: Doc<"refundTopUps">) => (
                    <div
                      key={t._id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {(t.amountMicrousdc / 1_000_000).toFixed(2)} USDC{" "}
                          <span className="text-xs text-muted-foreground">
                            ({t.blockchain})
                          </span>
                        </div>
                        <CopyableField value={t.txHash} truncate truncateLength={18} />
                      {t.blockchain === "base" && (
                        <a
                          href={`https://basescan.org/tx/${t.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                        >
                          View on BaseScan
                        </a>
                      )}
                      </div>
                      <Badge
                        variant={
                          t.status === "APPROVED"
                            ? "default"
                            : t.status === "REJECTED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}


