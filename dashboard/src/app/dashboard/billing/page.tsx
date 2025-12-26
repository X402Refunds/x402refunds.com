"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CopyableField } from "@/components/case-detail/CopyableField"

export default function BillingPage() {
  const currentUser = useQuery(api.users.getCurrentUser, {})
  const orgId = currentUser?.organizationId

  const credits = useQuery(
    api.refundCredits.getOrgRefundCreditsSummary,
    orgId ? { organizationId: orgId } : "skip",
  )

  const topUps = useQuery(
    api.refundCredits.listTopUpRequests,
    orgId ? { organizationId: orgId } : "skip",
  )

  const submitTopUp = useMutation(api.refundCredits.submitTopUpRequest)

  const [txHash, setTxHash] = useState("")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)

  const depositAddress =
    process.env.NEXT_PUBLIC_PLATFORM_BASE_USDC_DEPOSIT_ADDRESS || ""

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
            {depositAddress ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Send USDC on Base to this deposit address:
                </div>
                <CopyableField value={depositAddress} label="Deposit address" truncate />
                <div className="text-xs text-muted-foreground">
                  Balance updates are manual for now. After sending, submit the tx hash below.
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Deposit address is not configured yet. Set{" "}
                <code className="font-mono">NEXT_PUBLIC_PLATFORM_BASE_USDC_DEPOSIT_ADDRESS</code>{" "}
                to show it here.
              </div>
            )}

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
                      blockchain: "base",
                      txHash,
                      amount,
                      amountUnit: "usdc",
                    })
                    setSubmitResult(`Submitted: ${res.status}`)
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


