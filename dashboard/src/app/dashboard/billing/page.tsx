"use client"

import { useState } from "react"
import { useQuery, useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CopyableField } from "@/components/case-detail/CopyableField"
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button"
import { useAccount, useWriteContract } from "wagmi"
import { parseUnits } from "viem"

const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const
const ERC20_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const

export default function BillingPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {})
  const orgId = currentUser?.organizationId
  const { isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const credits = useQuery(
    api.refundCredits.getOrgRefundCreditsSummary,
    orgId ? { organizationId: orgId } : "skip",
  )

  const topUps = useQuery(
    api.refundCredits.listTopUpRequests,
    orgId ? { organizationId: orgId } : "skip",
  )

  const submitTopUp = useAction(api.refundCredits.submitTopUpAndAutoApply)
  const getOrCreatePlatformAccount = useAction(api.lib.coinbase.getOrCreatePlatformEvmAccount)

  const [txHash, setTxHash] = useState("")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)

  // We intentionally do NOT seed from NEXT_PUBLIC_PLATFORM_BASE_USDC_DEPOSIT_ADDRESS anymore:
  // deposit addresses must come from CDP (Coinbase Server Wallet) to ensure we can actually send refunds.
  const [depositAddress, setDepositAddress] = useState<string>("")
  const [depositLookupResult, setDepositLookupResult] = useState<string | null>(null)

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

                {depositAddress ? (
                  <CopyableField value={depositAddress} label="Deposit address" truncate />
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Not available yet. You can fetch it from Coinbase (CDP) once refunds are enabled.
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    disabled={!orgId}
                    onClick={async () => {
                      setDepositLookupResult(null)
                      try {
                        const res = await getOrCreatePlatformAccount({})
                        if (res.ok) {
                          setDepositAddress(res.address)
                          setDepositLookupResult(`Using account “${res.name}”`)
                        } else {
                          setDepositLookupResult(res.message)
                        }
                      } catch (e: unknown) {
                        const message =
                          e instanceof Error ? e.message : "Failed to fetch deposit address"
                        setDepositLookupResult(message)
                      }
                    }}
                  >
                    Fetch deposit address from Coinbase
                  </Button>
                  {depositLookupResult && (
                    <span className="text-sm text-muted-foreground">
                      {depositLookupResult}
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  After sending, we automatically verify the on-chain USDC transfer and credit your balance.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USDC)</Label>
                <Input
                  id="amount"
                  placeholder="e.g. 25.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash (0x…)</Label>
                <Input
                  id="txHash"
                  placeholder="0x..."
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                disabled={!orgId || submitting || !txHash || !amount}
                onClick={async () => {
                  if (!orgId) return
                  setSubmitting(true)
                  setSubmitResult(null)
                  try {
                    const res = await submitTopUp({
                      organizationId: orgId,
                      txHash,
                      amount,
                      amountUnit: "usdc",
                    })
                    if (res.ok) {
                      setSubmitResult(res.alreadyApplied ? "Already credited." : "Credited successfully.")
                    } else {
                      setSubmitResult(res.message || "Failed to verify top-up")
                    }
                    setTxHash("")
                    setAmount("")
                  } catch (e: unknown) {
                    const message =
                      e instanceof Error ? e.message : "Failed to submit top up request"
                    setSubmitResult(message)
                  } finally {
                    setSubmitting(false)
                  }
                }}
              >
                {submitting ? "Submitting…" : "Submit Top-Up"}
              </Button>
              {submitResult && (
                <span className="text-sm text-muted-foreground">{submitResult}</span>
              )}
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="text-sm font-medium">Top up with wallet</div>
              {!isConnected && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Connect a Base wallet that holds USDC.
                  </div>
                  <ConnectWalletButton />
                </div>
              )}
              {isConnected && (
                <Button
                  variant="default"
                  disabled={!orgId || !depositAddress || submitting || !amount}
                  onClick={async () => {
                    if (!orgId) return
                    if (!depositAddress) {
                      setSubmitResult("Fetch the deposit address first.")
                      return
                    }
                    setSubmitting(true)
                    setSubmitResult(null)
                    try {
                      const amountUnits = parseUnits(amount || "0", 6)
                      const hash = await writeContractAsync({
                        address: BASE_USDC,
                        abi: ERC20_ABI,
                        functionName: "transfer",
                        args: [depositAddress as `0x${string}`, amountUnits],
                      })
                      setTxHash(hash)
                      const res = await submitTopUp({
                        organizationId: orgId,
                        txHash: hash,
                        amount,
                        amountUnit: "usdc",
                      })
                      if (res.ok) {
                        setSubmitResult(res.alreadyApplied ? "Already credited." : "Credited successfully.")
                      } else {
                        setSubmitResult(res.message || "Failed to verify top-up")
                      }
                      setAmount("")
                    } catch (e: unknown) {
                      const message =
                        e instanceof Error ? e.message : "Wallet transfer failed"
                      setSubmitResult(message)
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                >
                  Send USDC from connected wallet
                </Button>
              )}
              <div className="text-xs text-muted-foreground">
                This sends an on-chain USDC transfer to the platform deposit address, then auto-credits your org after verification.
              </div>
            </div>

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
                  {topUps.map((t) => (
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


