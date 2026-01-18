"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { makeFunctionReference } from "convex/server"
import { useUser } from "@clerk/nextjs"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type PartnerProgram = {
  _id: string
  partnerKey: string
  canonicalEmail: string
  enabled: boolean
  autoDecideEnabled: boolean
  autoExecuteEnabled: boolean
  maxAutoRefundMicrousdc: number
  platformOpsEmail: string
  partnerOpsEmail: string
  protectedEndpointsMode: "noop_true_poc"
  broadcastUrl?: string
}

type GetPartnerProgramResult =
  | { ok: true; partnerProgram: PartnerProgram | null }
  | { ok: false; code: string; message?: string }

export default function PartnersPage() {
  const { user, isLoaded } = useUser()

  const qGetCurrentUser = makeFunctionReference<"query">("users:getCurrentUser")
  const qGetPartnerProgram = makeFunctionReference<"query">("partnerPrograms:getPartnerProgram")
  const mUpsertPartnerProgram = makeFunctionReference<"mutation">("partnerPrograms:upsertPartnerProgram")

  const currentUser = useQuery(qGetCurrentUser, {}) as { organizationId?: string } | null | undefined
  const orgId = currentUser?.organizationId

  const existingRes = useQuery(
    qGetPartnerProgram,
    orgId ? { organizationId: orgId, partnerKey: "dexter" } : "skip",
  ) as GetPartnerProgramResult | undefined

  const existing = existingRes?.ok === true ? existingRes.partnerProgram : null
  const existingError = existingRes?.ok === false ? String(existingRes.code || "ERROR") : null

  const upsert = useMutation(mUpsertPartnerProgram)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  const [enabled, setEnabled] = useState(true)
  const [autoDecideEnabled, setAutoDecideEnabled] = useState(true)
  const [autoExecuteEnabled, setAutoExecuteEnabled] = useState(true)
  const [canonicalEmail, setCanonicalEmail] = useState("refunds@dexter.cash")
  const [platformOpsEmail, setPlatformOpsEmail] = useState("vbkotecha@gmail.com")
  const [partnerOpsEmail, setPartnerOpsEmail] = useState("refunds@dexter.cash")
  const [maxAutoRefundMicrousdc, setMaxAutoRefundMicrousdc] = useState("2000000")

  useEffect(() => {
    if (!existing) return
    setEnabled(Boolean(existing.enabled))
    setAutoDecideEnabled(Boolean(existing.autoDecideEnabled))
    setAutoExecuteEnabled(Boolean(existing.autoExecuteEnabled))
    setCanonicalEmail(existing.canonicalEmail || "refunds@dexter.cash")
    setPlatformOpsEmail(existing.platformOpsEmail || "vbkotecha@gmail.com")
    setPartnerOpsEmail(existing.partnerOpsEmail || "refunds@dexter.cash")
    setMaxAutoRefundMicrousdc(String(existing.maxAutoRefundMicrousdc ?? 2000000))
  }, [existing])

  const maxUsdc = useMemo(() => {
    const n = Number(maxAutoRefundMicrousdc)
    if (!Number.isFinite(n) || n <= 0) return null
    return (n / 1_000_000).toFixed(2)
  }, [maxAutoRefundMicrousdc])

  if (!isLoaded || !user) {
    return (
      <DashboardLayout>
        <div className="text-sm text-muted-foreground">Loading…</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Partners</h1>
            <p className="text-sm text-muted-foreground">
              Configure marketplace partner automation (Dexter POC).
            </p>
          </div>
          <Badge variant={existing ? "default" : "secondary"}>
            {existing ? "Configured" : "Not configured"}
          </Badge>
        </div>

        {existingError && (
          <Card>
            <CardContent className="py-6 text-sm">
              <div className="font-medium text-foreground">Access denied</div>
              <div className="text-muted-foreground mt-1">
                This page requires an org admin. Convex returned: <span className="font-mono">{existingError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!orgId && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              No organization found for this user yet. Refresh after user sync completes.
            </CardContent>
          </Card>
        )}

        {orgId && !existingError && (
          <Card>
            <CardHeader>
              <CardTitle>Dexter partner program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="canonicalEmail">Canonical email</Label>
                  <Input
                    id="canonicalEmail"
                    value={canonicalEmail}
                    onChange={(e) => setCanonicalEmail(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    Disputes are treated as Dexter-managed when refund-contact email equals this value.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max">Max auto refund (microusdc)</Label>
                  <Input
                    id="max"
                    value={maxAutoRefundMicrousdc}
                    onChange={(e) => setMaxAutoRefundMicrousdc(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    {maxUsdc ? `Current cap: $${maxUsdc}` : "Enter a positive integer"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platformOpsEmail">Platform ops email</Label>
                  <Input
                    id="platformOpsEmail"
                    value={platformOpsEmail}
                    onChange={(e) => setPlatformOpsEmail(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    &quot;Received&quot; and &quot;refund executed&quot; emails go here.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnerOpsEmail">Partner ops email</Label>
                  <Input
                    id="partnerOpsEmail"
                    value={partnerOpsEmail}
                    onChange={(e) => setPartnerOpsEmail(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">
                    &quot;Refund request processed&quot; summary email goes here (POC override applies if this is refunds@dexter.cash).
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">Enabled</div>
                    <div className="text-xs text-muted-foreground">Turn partner flow on/off.</div>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">Auto decide</div>
                    <div className="text-xs text-muted-foreground">AI decides automatically.</div>
                  </div>
                  <Switch checked={autoDecideEnabled} onCheckedChange={setAutoDecideEnabled} />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-foreground">Auto execute</div>
                    <div className="text-xs text-muted-foreground">Executes refunds automatically (money moves).</div>
                  </div>
                  <Switch checked={autoExecuteEnabled} onCheckedChange={setAutoExecuteEnabled} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true)
                    setSaveError(null)
                    setSaveOk(false)
                    try {
                      const max = Number(maxAutoRefundMicrousdc)
                      if (!Number.isFinite(max) || !Number.isSafeInteger(max) || max <= 0) {
                        throw new Error("maxAutoRefundMicrousdc must be a positive integer")
                      }
                      await upsert({
                        organizationId: orgId,
                        partnerKey: "dexter",
                        canonicalEmail,
                        enabled,
                        autoDecideEnabled,
                        autoExecuteEnabled,
                        maxAutoRefundMicrousdc: max,
                        platformOpsEmail,
                        partnerOpsEmail,
                        protectedEndpointsMode: "noop_true_poc",
                        broadcastUrl: undefined,
                      })
                      setSaveOk(true)
                    } catch (e: unknown) {
                      setSaveError(e instanceof Error ? e.message : String(e))
                    } finally {
                      setSaving(false)
                    }
                  }}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
                {saveOk && <div className="text-sm text-muted-foreground">Saved.</div>}
                {saveError && <div className="text-sm text-destructive">{saveError}</div>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

