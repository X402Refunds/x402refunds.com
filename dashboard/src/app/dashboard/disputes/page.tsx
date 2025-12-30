"use client"

export const dynamic = "force-dynamic"

import { useEffect, useMemo, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

type OrgCase = {
  _id: Id<"cases">
  status?: string
  amount?: number
  currency?: string
  plaintiff?: string
  transactionHash?: string
  description?: string
  decidedAt?: number
  humanReviewedAt?: number
  filedAt?: number
  finalVerdict?: string
  paymentDetails?: { disputeReason?: string }
}

export default function AllDisputesPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "waiting" | "decided">("all")
  const [nowMs, setNowMs] = useState<number>(0)

  const syncUser = useMutation(api.users.syncUser)
  const currentUser = useQuery(api.users.getCurrentUser, {})

  const allOrgCases = useQuery(
    api.cases.getOrganizationCases,
    currentUser?.organizationId ? { organizationId: currentUser.organizationId } : "skip",
  ) as OrgCase[] | undefined

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

  const rows = useMemo(() => {
    const list = allOrgCases ?? []
    const q = query.trim().toLowerCase()

    const filteredByStatus = list.filter((c) => {
      const decided =
        c.status === "DECIDED" ||
        typeof c.decidedAt === "number" ||
        typeof c.humanReviewedAt === "number" ||
        typeof c.finalVerdict === "string"
      if (filter === "decided") return decided
      if (filter === "waiting") return !decided
      return true
    })

    if (!q) return filteredByStatus
    return filteredByStatus.filter((c) => {
      return [
        c._id,
        c.transactionHash,
        c.plaintiff,
        c.description,
        c.paymentDetails?.disputeReason,
        c.finalVerdict,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [allOrgCases, filter, query])

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
            <h1 className="text-3xl font-bold text-slate-950">All disputes</h1>
            <p className="text-slate-600 mt-1">Search, filter, and review any dispute.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              className={filter === "all" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-300"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "waiting" ? "default" : "outline"}
              className={filter === "waiting" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-300"}
              onClick={() => setFilter("waiting")}
            >
              Waiting
            </Button>
            <Button
              variant={filter === "decided" ? "default" : "outline"}
              className={filter === "decided" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-300"}
              onClick={() => setFilter("decided")}
            >
              Decided
            </Button>
          </div>
        </div>

        <Card className="border border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-slate-950">Disputes</CardTitle>
              <div className="w-full sm:w-96">
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
            {!allOrgCases ? (
              <div className="py-10 text-sm text-slate-600">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-sm text-slate-600">No disputes found.</div>
            ) : (
              <div className="divide-y divide-slate-200">
                {rows.map((c) => {
                  const decided =
                    c.status === "DECIDED" ||
                    typeof c.decidedAt === "number" ||
                    typeof c.humanReviewedAt === "number" ||
                    typeof c.finalVerdict === "string"

                  const filedAt = typeof c.filedAt === "number" ? c.filedAt : undefined
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
                    <div key={String(c._id)} className="py-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="font-semibold text-slate-950">
                            ${(c.amount || 0).toFixed(2)} {c.currency || "USD"}
                          </div>
                          <Badge variant="secondary" className="border border-slate-200">
                            {(c.paymentDetails?.disputeReason || "dispute").replace(/_/g, " ")}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className={
                              decided
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-50 text-slate-700 border border-slate-200"
                            }
                          >
                            {decided ? "Decided" : "Waiting"}
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-200">
                            {ageLabel}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-slate-600 truncate">Customer: {c.plaintiff || "Unknown"}</div>
                        {c.finalVerdict && <div className="mt-1 text-xs text-slate-500">Decision: {c.finalVerdict}</div>}
                      </div>

                      <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => router.push(`/dashboard/disputes/${c._id}`)}>
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

