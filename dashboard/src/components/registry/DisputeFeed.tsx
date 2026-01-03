"use client"

import { DisputeRow } from "./DisputeRow"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"

interface DisputeFeedProps {
  filter?: "all" | "pending" | "resolved"
  searchQuery?: string
  limit?: number
}

type RegistryCase = {
  caseId: string
  filedAt: number
  status: string
  buyer: string | null
  merchant: string | null
  reason: string | null
  amountMicrousdc: number | null
  currency: string | null
}

export function DisputeFeed({ filter = "all", searchQuery, limit = 20 }: DisputeFeedProps) {
  const [displayLimit, setDisplayLimit] = useState(limit)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<RegistryCase[]>([])

  const API_BASE = "https://api.x402disputes.com"

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const resp = await fetch(`${API_BASE}/live/feed?limit=${displayLimit}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        })
        if (!resp.ok) throw new Error(`Failed to load feed (${resp.status})`)
        const data = await resp.json()
        const cases = Array.isArray(data?.cases) ? (data.cases as RegistryCase[]) : []
        if (!cancelled) setRows(cases)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!cancelled) setError(msg || "Failed to load disputes")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [displayLimit])

  const filteredCases = useMemo(() => {
    const list = rows ?? []
    let out = list

    if (filter === "pending") {
      out = out.filter((c) => ["FILED", "ANALYZED", "IN_REVIEW"].includes(c.status))
    } else if (filter === "resolved") {
      out = out.filter((c) => ["DECIDED", "CLOSED"].includes(c.status))
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      out = out.filter((c) => {
        return [
          c.caseId,
          c.buyer,
          c.merchant,
          c.reason,
        ]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      })
    }

    return out
  }, [rows, filter, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Unable to load disputes. Please try again.</p>
        <p className="text-xs text-slate-400 mt-2">{error}</p>
      </div>
    )
  }

  if (filteredCases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">
          {searchQuery ? `No disputes found matching "${searchQuery}"` : 'No disputes found'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {searchQuery && (
        <div className="text-sm text-slate-600 mb-2">
          Found {filteredCases.length} dispute{filteredCases.length === 1 ? '' : 's'} matching &ldquo;{searchQuery}&rdquo;
        </div>
      )}
      {filteredCases.map((case_: RegistryCase, index: number) => {
        try {
          return (
            <DisputeRow
              key={case_.caseId || `case-${index}`}
              caseId={case_.caseId || 'unknown'}
              plaintiff={case_.buyer ?? 'Unknown'}
              defendant={case_.merchant ?? 'Unknown'}
              amount={typeof case_.amountMicrousdc === "number" ? case_.amountMicrousdc / 1_000_000 : undefined}
              currency={case_.currency ?? "USDC"}
              status={case_.status ?? 'FILED'}
              filedAt={case_.filedAt ?? 0}
            />
          )
        } catch (error) {
          console.error('Error rendering dispute row:', error, case_)
          return null
        }
      })}
      
      {filteredCases.length >= displayLimit && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setDisplayLimit(prev => prev + 20)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}

