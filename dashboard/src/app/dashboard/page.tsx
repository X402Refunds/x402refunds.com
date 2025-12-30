"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"

type InboxDispute = {
  _id: Id<"cases">
  amount?: number
  currency?: string
  plaintiff?: string
  transactionHash?: string
  description?: string
  filedAt?: number
  paymentDetails?: { disputeReason?: string }
  aiRecommendation?: { verdict: string; confidence: number }
}

export default function DashboardInboxPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [nowMs, setNowMs] = useState<number>(0)

  // Sync user on page load (keeps dashboard resilient for new accounts).
  const syncUser = useMutation(api.users.syncUser)
  const currentUser = useQuery(api.users.getCurrentUser, {})

  const reviewQueue = useQuery(
    api.paymentDisputes.getCustomerReviewQueue,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId, limit: 50 } : "skip",
  ) as InboxDispute[] | undefined

  useEffect(() => {
    if (user && isLoaded && !currentUser) {
      syncUser({
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || undefined,
      }).catch((error) => {
        console.error("Failed to sync user:", error)
      })
    }
  }, [user, isLoaded, currentUser, syncUser])

  // Keep render pure (eslint react-hooks/purity) by reading time in an effect.
  useEffect(() => {
    const update = () => setNowMs(Date.now())
    // Schedule the first update asynchronously to satisfy react-hooks/set-state-in-effect.
    queueMicrotask(update)
    const t = setInterval(update, 60_000)
    return () => clearInterval(t)
  }, [])

  const needsDecisionCount = reviewQueue?.length || 0
  const disputedAmount = (reviewQueue || []).reduce((sum, d) => sum + (d.amount || 0), 0)
  const newTodayCount = (reviewQueue || []).filter((d) => {
    if (typeof d.filedAt !== "number") return false
    const hours = (nowMs - d.filedAt) / (1000 * 60 * 60)
    return hours <= 24
  }).length

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = reviewQueue ?? []
    if (!q) return list
    return list.filter((d) => {
      return [
        d._id,
        d.transactionHash,
        d.plaintiff,
        d.description,
        d.paymentDetails?.disputeReason,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [query, reviewQueue])

  if (!isLoaded || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Loading…</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600">Syncing user data…</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Inbox</h1>
            <p className="text-slate-600 mt-1">Disputes waiting on you.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border border-slate-200">
              {needsDecisionCount} waiting
            </Badge>
            <Button variant="outline" className="border-slate-300" onClick={() => router.push("/dashboard/disputes")}>
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Needs decision</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-950">{needsDecisionCount}</div>
              <div className="text-xs text-slate-500 mt-1">Disputes in your inbox</div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">Disputed amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-950">${disputedAmount.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-1">Total amount in disputes</div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-700">New today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-950">{newTodayCount}</div>
              <div className="text-xs text-slate-500 mt-1">Filed in the last 24 hours</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-slate-950">Disputes</CardTitle>
              <div className="w-full sm:w-80">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by case ID, tx hash, email…"
                  className="border-slate-300"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {!reviewQueue ? (
              <div className="py-10 text-sm text-slate-600">Loading…</div>
            ) : items.length === 0 ? (
              <div className="py-10 text-sm text-slate-600">
                {needsDecisionCount === 0 ? "You’re all caught up." : "No matches."}
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {items.map((d) => {
                  const filedAt = typeof d.filedAt === "number" ? d.filedAt : undefined
                  const ageHours = typeof filedAt === "number" ? (nowMs - filedAt) / (1000 * 60 * 60) : undefined
                  const ageLabel =
                    typeof ageHours !== "number"
                      ? "Filed: unknown"
                      : ageHours < 1
                        ? "Filed <1h ago"
                        : ageHours < 24
                          ? `Filed ${Math.floor(ageHours)}h ago`
                          : `Filed ${Math.floor(ageHours / 24)}d ago`

                  return (
                    <div key={String(d._id)} className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="font-semibold text-slate-950">
                            ${(d.amount || 0).toFixed(2)} {d.currency || "USD"}
                          </div>
                          <Badge variant="secondary" className="border border-slate-200">
                            {(d.paymentDetails?.disputeReason || "dispute").replace(/_/g, " ")}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-slate-50 text-slate-700 border border-slate-200"
                          >
                            {ageLabel}
                          </Badge>
                        </div>

                        <div className="mt-1 text-sm text-slate-600 truncate">Customer: {d.plaintiff || "Unknown"}</div>

                        {d.aiRecommendation && (
                          <div className="mt-1 text-xs text-slate-500">
                            AI: {d.aiRecommendation.verdict} • {Math.round((d.aiRecommendation.confidence || 0) * 100)}%
                          </div>
                        )}
                      </div>

                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push(`/dashboard/disputes/${d._id}`)}>
                        Review <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

