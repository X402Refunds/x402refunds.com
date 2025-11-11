"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { TrendingUp, Clock, CheckCircle, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export function StatsBar() {
  const stats = useQuery(api.events.getSystemStats)

  // Default values while loading
  const displayStats = {
    totalDisputes: stats?.totalCases ?? 0,
    resolved24h: stats?.casesLast24h ?? 0,
    avgResolutionTime: "18 hrs", // TODO: Calculate from actual data
    activeMerchants: stats?.totalAgents ?? 0
  }

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={TrendingUp}
            label="Total Disputes"
            value={displayStats.totalDisputes.toLocaleString()}
            iconColor="text-emerald-600"
            bgColor="bg-emerald-50"
          />
          <StatCard
            icon={Clock}
            label="Resolved (24h)"
            value={displayStats.resolved24h.toLocaleString()}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
          />
          <StatCard
            icon={CheckCircle}
            label="Avg Resolution"
            value={displayStats.avgResolutionTime}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
          />
          <StatCard
            icon={Users}
            label="Active Merchants"
            value={displayStats.activeMerchants.toLocaleString()}
            iconColor="text-amber-600"
            bgColor="bg-amber-50"
          />
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value,
  iconColor,
  bgColor
}: { 
  icon: LucideIcon
  label: string
  value: string | number
  iconColor: string
  bgColor: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}

