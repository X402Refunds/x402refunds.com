"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { Activity, TrendingUp, Zap } from "lucide-react"
import { Id } from "../../../../../convex/_generated/dataModel"

type Event = {
  _id: Id<"events">;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  agentDid?: string;
  caseId?: Id<"cases">;
}

export default function ActivityPage() {
  const recentEvents = useQuery(api.events.getRecentEvents, { limit: 100 })
  const stats = useQuery(api.cases.getCachedSystemStats)
  
  const events = recentEvents ?? []

  const getEventIcon = (type: string) => {
    switch (type) {
      case "case_filed":
        return "📋"
      case "case_resolved":
        return "✅"
      case "evidence_submitted":
        return "📎"
      case "agent_registered":
        return "🤖"
      default:
        return "📌"
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "case_filed":
        return "bg-blue-100 text-blue-800"
      case "case_resolved":
        return "bg-green-100 text-green-800"
      case "evidence_submitted":
        return "bg-purple-100 text-purple-800"
      case "agent_registered":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Activity</h1>
          <p className="text-muted-foreground">
            Real-time activity feed from the dispute resolution platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                All system events
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingCases ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.avgResolutionTimeMinutes.toFixed(1)}m</div>
              <p className="text-xs text-muted-foreground">
                Lightning fast
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest events from the dispute resolution system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.slice(0, 50).map((event: Event) => (
                <div 
                  key={event._id}
                  className="flex items-start gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="text-2xl">{getEventIcon(event.type)}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getEventColor(event.type)}>
                        {event.type.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {event.payload && (
                      <div className="text-sm text-muted-foreground">
                        {JSON.stringify(event.payload, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No activity recorded yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
