"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { DisputeRow } from "./DisputeRow"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DisputeFeedProps {
  filter?: "all" | "pending" | "resolved"
  searchQuery?: string
  limit?: number
}

export function DisputeFeed({ filter = "all", searchQuery, limit = 20 }: DisputeFeedProps) {
  const [displayLimit, setDisplayLimit] = useState(limit)
  
  // Real-time query with Convex subscriptions
  const cases = useQuery(api.cases.getRecentCases, { limit: displayLimit })

  if (cases === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  // Filter cases based on status
  let filteredCases = cases
  if (filter === 'pending') {
    filteredCases = cases.filter((c: typeof cases[number]) => ['FILED', 'ANALYZED', 'IN_REVIEW'].includes(c.status))
  } else if (filter === 'resolved') {
    filteredCases = cases.filter((c: typeof cases[number]) => ['DECIDED', 'CLOSED'].includes(c.status))
  }

  // Filter by search query if provided
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filteredCases = filteredCases.filter((c: typeof cases[number]) => 
      c._id.toLowerCase().includes(query) ||
      c.plaintiff?.toLowerCase().includes(query) ||
      c.defendant?.toLowerCase().includes(query)
    )
  }

  if (filteredCases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No disputes found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredCases.map((case_: typeof cases[number]) => (
        <DisputeRow
          key={case_._id}
          caseId={case_._id}
          plaintiff={case_.plaintiff ?? 'Unknown'}
          defendant={case_.defendant ?? 'Unknown'}
          amount={case_.amount}
          currency={case_.currency}
          status={case_.status ?? 'FILED'}
          filedAt={case_.filedAt ?? Date.now()}
        />
      ))}
      
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

